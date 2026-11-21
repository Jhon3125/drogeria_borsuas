"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { exigirRol } from "@/lib/guard";

const ADMIN = ["SUPER_ADMIN", "ADMIN"] as const;
const GESTION = ["SUPER_ADMIN", "ADMIN", "ALMACEN"] as const;
function numero(d: FormData, clave: string) {
  const v = Number(d.get(clave));
  if (!Number.isSafeInteger(v) || v <= 0) throw new Error(`Valor inválido: ${clave}`);
  return v;
}
function texto(d: FormData, clave: string, max: number) {
  const v = String(d.get(clave) ?? "").trim();
  if (!v || v.length > max) throw new Error(`Valor inválido: ${clave}`);
  return v;
}
function exito(path: string) {
  revalidatePath("/dashboard/logistica/vehiculos");
  revalidatePath("/dashboard/logistica/rutas");
  revalidatePath("/dashboard/logistica/despachos");
  redirect(path);
}

export async function guardarVehiculo(d: FormData) {
  await exigirRol([...ADMIN]);
  const placa = texto(d, "placa", 12).toUpperCase();
  if (!/^[A-Z0-9-]{5,12}$/.test(placa)) throw new Error("Placa inválida.");
  const modelo = texto(d, "modelo", 100);
  const capacidad = texto(d, "capacidad", 80);
  await prisma.vehiculo.create({ data: { placa, modelo, capacidad } });
  exito("/dashboard/logistica/vehiculos?ok=creado");
}
export async function cambiarVehiculo(d: FormData) {
  await exigirRol([...ADMIN]);
  const id = numero(d, "id");
  const vehiculo = await prisma.vehiculo.findUnique({ where: { id } });
  if (!vehiculo) throw new Error("Vehículo inexistente.");
  if (vehiculo.estado) {
    const asignadas = await prisma.hojaRuta.count({ where: { vehiculoId: id, despachos: { some: { estado: { in: ["PENDIENTE", "EN_RUTA"] } } } } });
    if (asignadas) throw new Error("El vehículo tiene despachos activos.");
  }
  await prisma.vehiculo.update({ where: { id }, data: { estado: !vehiculo.estado } });
  exito("/dashboard/logistica/vehiculos?ok=actualizado");
}

export async function crearRuta(d: FormData) {
  await exigirRol([...GESTION]);
  const conductorId = numero(d, "conductorId");
  const vehiculoId = numero(d, "vehiculoId");
  const ids = [...new Set(d.getAll("ventaIds").map(Number))];
  if (!ids.length || ids.length > 50 || ids.some(id => !Number.isSafeInteger(id) || id <= 0)) throw new Error("Selecciona entre 1 y 50 órdenes válidas.");
  const fechaRaw = texto(d, "fecha", 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaRaw) || Number.isNaN(Date.parse(`${fechaRaw}T12:00:00Z`))) throw new Error("Fecha inválida.");
  await prisma.$transaction(async tx => {
    const [conductor, vehiculo, ventas] = await Promise.all([
      tx.usuario.findFirst({ where: { id: conductorId, rol: "CONDUCTOR", estado: "ACTIVO" } }),
      tx.vehiculo.findFirst({ where: { id: vehiculoId, estado: true } }),
      tx.venta.findMany({ where: { id: { in: ids }, estado: { not: "ANULADA" }, saldoPendiente: { lte: 0 }, importeTotal: { gt: 0 }, despachos: { every: { estado: "REPROGRAMADO", devolucionInventarioEn: { not: null } } } }, select: { id: true, detalles: { select: { cantidad: true, asignacionesLote: { select: { cantidad: true } } } } } }),
    ]);
    if (!conductor || !vehiculo) throw new Error("Conductor o vehículo no disponible.");
    if (ventas.length !== ids.length) throw new Error("Hay ventas no pagadas, anuladas o con un despacho sin devolución confirmada.");
    if (ventas.some(v => v.detalles.length === 0 || v.detalles.some(det => det.asignacionesLote.reduce((n,a) => n+a.cantidad, 0) < det.cantidad))) throw new Error("Hay ventas sin lotes suficientes asignados.");
    const fecha = new Date(`${fechaRaw}T12:00:00.000Z`);
    const diaInicio = new Date(`${fechaRaw}T00:00:00.000Z`);
    const diaFin = new Date(diaInicio.getTime()+86400000);
    const duplicados = await tx.hojaRuta.count({ where: { fecha: { gte: diaInicio, lt: diaFin }, OR: [{ conductorId }, { vehiculoId }], despachos: { some: { estado: { in: ["PENDIENTE", "EN_RUTA"] } } } } });
    if (duplicados) throw new Error("Conductor o vehículo con otra ruta activa ese día.");
    await tx.hojaRuta.create({ data: { conductorId, vehiculoId, fecha, despachos: { create: ids.map(ventaId => ({ ventaId })) } } });
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  exito("/dashboard/logistica/rutas?ok=creada");
}

/** La salida ocurre una sola vez, al iniciar la ruta. No volver a descontar al entregar. */
export async function actualizarDespacho(d: FormData) {
  const usuario = await exigirRol(["SUPER_ADMIN", "ADMIN", "ALMACEN", "CONDUCTOR"]);
  const id = numero(d, "id");
  const estado = String(d.get("estado"));
  if (!["EN_RUTA", "ENTREGADO", "REPROGRAMADO"].includes(estado)) throw new Error("Estado inválido.");
  const observacion = String(d.get("observacion") ?? "").trim().slice(0, 500);
  if (estado === "REPROGRAMADO" && !observacion) throw new Error("Indica el motivo de la reprogramación.");
  const receptor = estado === "ENTREGADO" ? texto(d, "receptor", 120) : null;
  const adjunto = d.get("foto");
  let foto: { contenido: Uint8Array<ArrayBuffer>; tipoMime: string; nombre: string } | null = null;
  if (estado === "ENTREGADO") {
    if (!(adjunto instanceof File) || adjunto.size === 0) throw new Error("Adjunta una fotografía de la entrega.");
    if (adjunto.size > 3 * 1024 * 1024) throw new Error("La fotografía no puede superar 3 MB.");
    if (!["image/jpeg", "image/png", "image/webp"].includes(adjunto.type)) throw new Error("Solo se admiten imágenes JPG, PNG o WEBP.");
    const contenido = new Uint8Array<ArrayBuffer>(await adjunto.arrayBuffer());
    const jpg = contenido.length > 3 && contenido[0] === 0xff && contenido[1] === 0xd8 && contenido[2] === 0xff;
    const png = contenido.length > 8 && [137,80,78,71,13,10,26,10].every((x,i)=>contenido[i]===x);
    const webp = contenido.length > 12 && String.fromCharCode(...contenido.slice(0,4)) === "RIFF" && String.fromCharCode(...contenido.slice(8,12)) === "WEBP";
    if (!((adjunto.type==="image/jpeg" && jpg)||(adjunto.type==="image/png" && png)||(adjunto.type==="image/webp" && webp))) throw new Error("El contenido no corresponde a una imagen válida.");
    foto = { contenido, tipoMime: adjunto.type, nombre: adjunto.name.slice(0, 150) || "entrega" };
  }
  await prisma.$transaction(async tx => {
    const despacho = await tx.despacho.findUnique({
      where: { id }, include: { hojaRuta: true,
        venta: { include: { detalles: { include: { asignacionesLote: true } } } } },
    });
    if (!despacho) throw new Error("Despacho inexistente.");
    if (usuario.rol === "CONDUCTOR" && despacho.hojaRuta.conductorId !== Number(usuario.id)) throw new Error("No es tu despacho.");
    if ((estado === "EN_RUTA" && despacho.estado !== "PENDIENTE") ||
       (["ENTREGADO", "REPROGRAMADO"].includes(estado) && despacho.estado !== "EN_RUTA")) throw new Error("Transición de estado no permitida.");
    if (despacho.venta.estado === "ANULADA") throw new Error("La venta está anulada.");
    const resultado = await tx.despacho.updateMany({
      where: { id, estado: despacho.estado },
      data: { estado: estado as "EN_RUTA" | "ENTREGADO" | "REPROGRAMADO", observacion: observacion || null,
        ...(estado === "EN_RUTA" ? { salidaInventarioEn: new Date() } : {}),
        ...(estado === "ENTREGADO" ? { receptor, entregadoEn: new Date() } : {}) },
    });
    if (resultado.count !== 1) throw new Error("Otro usuario modificó el despacho. Recarga la pantalla.");
    if (estado === "EN_RUTA") {
      if (despacho.salidaInventarioEn) throw new Error("Este despacho ya registró salida de inventario.");
      if (despacho.venta.saldoPendiente.greaterThan(0)) throw new Error("La venta tiene saldo pendiente.");
      if (!despacho.venta.detalles.length) throw new Error("La venta no tiene productos.");
      const cantidades = new Map<number, { productoId: number; cantidad: number }>();
      for (const detalle of despacho.venta.detalles) {
        const asignado = detalle.asignacionesLote.reduce((n,a)=>n+a.cantidad,0);
        if (asignado !== detalle.cantidad) throw new Error("Los lotes asignados no coinciden con la venta.");
        for (const a of detalle.asignacionesLote) {
          const previo = cantidades.get(a.loteId);
          if (previo && previo.productoId !== detalle.productoId) throw new Error("Lote inconsistente.");
          cantidades.set(a.loteId, { productoId: detalle.productoId, cantidad: (previo?.cantidad ?? 0)+a.cantidad });
        }
      }
      for (const [loteId, item] of cantidades) {
        const descontado = await tx.lote.updateMany({
          where: { id: loteId, productoId: item.productoId, estadoCalidad: "DISPONIBLE", cantidadDisponible: { gte: item.cantidad } },
          data: { cantidadDisponible: { decrement: item.cantidad } },
        });
        if (descontado.count !== 1) throw new Error(`Stock insuficiente o lote bloqueado: ${loteId}.`);
        const producto = await tx.producto.updateMany({ where: { id: item.productoId, stockActual: { gte: item.cantidad } }, data: { stockActual: { decrement: item.cantidad } } });
        if (producto.count !== 1) throw new Error(`Stock global insuficiente: ${item.productoId}.`);
        await tx.movimientoInventario.create({ data: { loteId, productoId: item.productoId, usuarioId: Number(usuario.id), tipo: "SALIDA_VENTA", cantidad: item.cantidad, motivo: `Salida despacho #${id}, venta #${despacho.ventaId}` } });
      }
      await tx.venta.update({ where: { id: despacho.ventaId }, data: { estado: "DESPACHADA" } });
    }
    if (estado === "ENTREGADO") {
      if (!despacho.salidaInventarioEn) throw new Error("La salida física no está registrada.");
      await tx.evidenciaEntrega.create({ data: { despachoId: id, ...foto! } });
      await tx.venta.update({ where: { id: despacho.ventaId }, data: { estado: "COMPLETADA" } });
    }
    await tx.historialDespacho.create({ data: {
      despachoId: id, usuarioId: Number(usuario.id), estadoAnterior: despacho.estado,
      estadoNuevo: estado as "EN_RUTA" | "ENTREGADO" | "REPROGRAMADO", observacion: observacion || null,
    } });
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 20000 });
  revalidatePath("/dashboard/ventas");
  revalidatePath(`/dashboard/logistica/despachos`);
  revalidatePath("/dashboard/logistica/rutas");
  revalidatePath("/dashboard/inventario");
  revalidatePath("/dashboard/inventario/movimientos");
  redirect("/dashboard/logistica/despachos?ok=actualizado");
}


/** Reintegro físico de un despacho REPROGRAMADO, una sola vez y previa conformidad del almacén.
 * No reprograma automáticamente una nueva ruta ni modifica pagos.
 */
export async function recibirDevolucionDespacho(d: FormData) {
  const usuario = await exigirRol(["SUPER_ADMIN", "ADMIN", "ALMACEN"]);
  const id = numero(d, "id");
  const motivo = texto(d, "motivo", 500);
  if (d.get("inspeccion") !== "confirmada") throw new Error("Confirma que se recibieron y revisaron físicamente todas las unidades.");
  await prisma.$transaction(async tx => {
    const despacho = await tx.despacho.findUnique({
      where: { id },
      include: { venta: { include: { detalles: { include: { asignacionesLote: true } } } } },
    });
    if (!despacho || despacho.estado !== "REPROGRAMADO" || !despacho.salidaInventarioEn || despacho.devolucionInventarioEn) {
      throw new Error("Solo se reciben devoluciones de despachos reprogramados, con salida y sin devolución previa.");
    }
    const cantidades = new Map<number, { productoId: number; cantidad: number }>();
    for (const det of despacho.venta.detalles) {
      const suma = det.asignacionesLote.reduce((n, a) => n + a.cantidad, 0);
      if (suma !== det.cantidad) throw new Error("Las asignaciones no coinciden con la venta.");
      for (const a of det.asignacionesLote) {
        const anterior = cantidades.get(a.loteId);
        if (anterior && anterior.productoId !== det.productoId) throw new Error("Lote inconsistente.");
        cantidades.set(a.loteId, { productoId: det.productoId, cantidad: (anterior?.cantidad ?? 0) + a.cantidad });
      }
    }
    if (!cantidades.size) throw new Error("El despacho no tiene unidades para reintegrar.");
    // Comprueba las salidas registradas: evita reintegrar mercadería sin salida auditable.
    const salidas = await tx.movimientoInventario.findMany({
      where: { tipo: "SALIDA_VENTA", motivo: `Salida despacho #${id}, venta #${despacho.ventaId}` },
      select: { loteId: true, productoId: true, cantidad: true },
    });
    const salidasAgrupadas = new Map<number, number>();
    for (const m of salidas) {
      if (m.loteId === null) throw new Error("La salida no contiene lote.");
      if (cantidades.get(m.loteId)?.productoId !== m.productoId) throw new Error("El producto de la salida no coincide.");
      salidasAgrupadas.set(m.loteId, (salidasAgrupadas.get(m.loteId) ?? 0) + m.cantidad);
    }
    if (salidasAgrupadas.size !== cantidades.size || [...cantidades].some(([loteId, item]) => salidasAgrupadas.get(loteId) !== item.cantidad)) {
      throw new Error("No se puede conciliar la devolución con las salidas originales. Revisión manual necesaria.");
    }
    const actualizado = await tx.despacho.updateMany({
      where: { id, estado: "REPROGRAMADO", devolucionInventarioEn: null },
      data: { devolucionInventarioEn: new Date(), devolucionMotivo: motivo },
    });
    if (actualizado.count !== 1) throw new Error("La devolución ya fue procesada.");
    for (const [loteId, item] of cantidades) {
      const lote = await tx.lote.findFirst({
        where: { id: loteId, productoId: item.productoId, estadoCalidad: "DISPONIBLE", fechaVencimiento: { gt: new Date() } },
      });
      if (!lote) throw new Error(`Lote ${loteId} vencido, bloqueado o no disponible. Revisar devolución manualmente.`);
      // No reintegrar por encima de lo originalmente ingresado al lote.
      const loteActualizado = await tx.lote.updateMany({
        where: { id: loteId, productoId: item.productoId, cantidadDisponible: { lte: lote.cantidadInicial - item.cantidad } },
        data: { cantidadDisponible: { increment: item.cantidad } },
      });
      if (loteActualizado.count !== 1) throw new Error(`El lote ${loteId} excedería su cantidad inicial.`);
      await tx.producto.update({ where: { id: item.productoId }, data: { stockActual: { increment: item.cantidad } } });
      await tx.movimientoInventario.create({ data: {
        loteId, productoId: item.productoId, usuarioId: Number(usuario.id), tipo: "ENTRADA_DEVOLUCION",
        cantidad: item.cantidad, motivo: `Devolución despacho #${id}, venta #${despacho.ventaId}: ${motivo}`,
      } });
    }
    await tx.venta.update({ where: { id: despacho.ventaId }, data: { estado: "EN_PREPARACION" } });
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 20000 });
  for (const ruta of ["/dashboard/logistica/despachos", "/dashboard/logistica/panel", "/dashboard/logistica/movimientos", "/dashboard/inventario", "/dashboard/ventas"]) revalidatePath(ruta);
  redirect("/dashboard/logistica/despachos?ok=devuelto");
}
