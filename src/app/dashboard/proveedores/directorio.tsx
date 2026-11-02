"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Pencil, Plus } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { FormularioProveedor } from "./form";
import { cambiarEstadoProveedor } from "./actions";

type Proveedor = {
  id: number;
  razonSocial: string;
  ruc: string;
  contacto: string | null;
  telefono: string | null;
  correo: string | null;
  direccion: string | null;
  estado: boolean;
  _count: { compras: number };
};

type Props = { proveedores: Proveedor[]; puedeGestionar: boolean };
type FiltroEstado = "TODOS" | "ACTIVOS" | "INACTIVOS";

export function DirectorioProveedores({ proveedores, puedeGestionar }: Props) {
  const router = useRouter();
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>("TODOS");
  const [modalAbierto, setModalAbierto] = useState(false);
  const [proveedorEditar, setProveedorEditar] = useState<Proveedor | null>(null);

  const cerrar = useCallback(() => {
    setModalAbierto(false);
    setProveedorEditar(null);
  }, []);

  const guardado = useCallback(() => {
    cerrar();
    router.refresh();
  }, [cerrar, router]);

  const total = proveedores.length;
  const activos = proveedores.filter((p) => p.estado).length;
  const compras = proveedores.reduce((suma, p) => suma + p._count.compras, 0);

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLocaleLowerCase("es-PE");
    return proveedores.filter((p) => {
      const coincideBusqueda = !q || [p.razonSocial, p.ruc, p.contacto, p.telefono, p.correo, p.direccion]
        .some((dato) => (dato ?? "").toLocaleLowerCase("es-PE").includes(q));
      const coincideEstado = filtroEstado === "TODOS" || (filtroEstado === "ACTIVOS" ? p.estado : !p.estado);
      return coincideBusqueda && coincideEstado;
    });
  }, [proveedores, busqueda, filtroEstado]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#123E70]">Proveedores</h1>
          <p className="mt-1 text-sm text-slate-600">Administración y seguimiento de proveedores de Droguería Borsuas.</p>
        </div>
        {puedeGestionar && (
          <button type="button" onClick={() => { setProveedorEditar(null); setModalAbierto(true); }} className="rounded-lg bg-[#123E70] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#087EBD]">
            + Nuevo proveedor
          </button>
        )}
      </header>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <Indicador titulo="Total de proveedores" valor={total} descripcion="Registrados" />
        <Indicador titulo="Proveedores activos" valor={activos} descripcion="Disponibles para compras" color="text-[#238B55]" />
        <Indicador titulo="Proveedores inactivos" valor={total - activos} descripcion="Deshabilitados" />
        <Indicador titulo="Órdenes de compra" valor={compras} descripcion="Total de OC vinculadas" color="text-[#087EBD]" />
      </div>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-200 p-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#123E70]">Directorio de proveedores</h2>
            <p className="mt-1 text-sm text-slate-500">Consulta los datos y el estado de cada proveedor registrado.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <label className="text-xs font-semibold text-slate-600">
              Buscar proveedor
              <input type="search" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Razón social, RUC, contacto..." className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm sm:w-72" />
            </label>
            <label className="text-xs font-semibold text-slate-600">
              Estado
              <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value as FiltroEstado)} className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm sm:w-40">
                <option value="TODOS">Todos</option>
                <option value="ACTIVOS">Activos</option>
                <option value="INACTIVOS">Inactivos</option>
              </select>
            </label>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-slate-50 px-5 py-3">
          <p className="text-sm text-slate-600">Mostrando <b>{filtrados.length}</b> de {total} proveedores</p>
          {(busqueda || filtroEstado !== "TODOS") && <button type="button" onClick={() => { setBusqueda(""); setFiltroEstado("TODOS"); }} className="text-sm font-medium text-[#087EBD] hover:underline">Limpiar filtros</button>}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[950px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-4">Proveedor</th><th className="px-4 py-4">Contacto</th><th className="px-4 py-4 text-center">Compras</th><th className="px-4 py-4 text-center">Estado</th><th className="px-5 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtrados.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-5 py-4"><p className="font-semibold text-slate-800">{p.razonSocial}</p><p className="mt-1 text-xs text-slate-500">RUC: {p.ruc}</p></td>
                  <td className="px-4 py-4"><p className="font-medium text-slate-700">{p.contacto || "Sin contacto"}</p><p className="mt-1 text-xs text-slate-500">{p.telefono || "Sin teléfono"}</p>{p.correo && <p className="max-w-[220px] truncate text-xs text-slate-500">{p.correo}</p>}</td>
                  <td className="px-4 py-4 text-center"><span className="inline-flex min-w-9 justify-center rounded-lg bg-blue-50 px-3 py-1.5 font-bold text-[#123E70]">{p._count.compras}</span></td>
                  <td className="px-4 py-4 text-center"><span className={`rounded-full px-3 py-1 text-xs font-semibold ${p.estado ? "bg-green-50 text-[#238B55]" : "bg-slate-100 text-slate-600"}`}>{p.estado ? "Activo" : "Inactivo"}</span></td>
                  <td className="px-5 py-4"><div className="flex items-center justify-end gap-2">
                    <Link href={`/dashboard/proveedores/${p.id}`} className="whitespace-nowrap rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-[#123E70] hover:bg-slate-50">Ver detalle</Link>
                    {puedeGestionar && <>
                      <button type="button" onClick={() => { setProveedorEditar(p); setModalAbierto(true); }} className="rounded-lg border border-blue-200 px-3 py-1.5 text-xs font-semibold text-[#087EBD] hover:bg-blue-50">Editar</button>
                      <form action={cambiarEstadoProveedor}><input type="hidden" name="id" value={p.id} /><button type="submit" className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${p.estado ? "border-red-200 text-red-700 hover:bg-red-50" : "border-green-200 text-[#238B55] hover:bg-green-50"}`}>{p.estado ? "Desactivar" : "Activar"}</button></form>
                    </>}
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtrados.length === 0 && <p className="px-5 py-12 text-center text-sm text-slate-500">No se encontraron proveedores con esos filtros.</p>}
      </section>

      {puedeGestionar && (
        <Dialog open={modalAbierto} onOpenChange={(abierto) => { if (!abierto) cerrar(); else setModalAbierto(true); }}>
          <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
            <DialogHeader className="space-y-3 pb-2">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-primary">
                {proveedorEditar ? <Pencil className="h-5 w-5" /> : <Building2 className="h-5 w-5" />}
              </div>
              <div className="space-y-1.5">
                <DialogTitle className="text-xl">{proveedorEditar ? "Editar proveedor" : "Nuevo proveedor"}</DialogTitle>
                <DialogDescription>{proveedorEditar ? "Actualiza la información general del proveedor." : "Registra una nueva empresa proveedora de Borsuas."}</DialogDescription>
              </div>
            </DialogHeader>
            {modalAbierto && <FormularioProveedor key={proveedorEditar?.id ?? "nuevo"} proveedor={proveedorEditar ?? undefined} onCancelar={cerrar} onGuardado={guardado} />}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function Indicador({ titulo, valor, descripcion, color = "text-[#123E70]" }: { titulo: string; valor: number; descripcion: string; color?: string }) {
  return <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"><p className="text-sm font-semibold text-slate-500">{titulo}</p><p className={`mt-3 text-3xl font-bold ${color}`}>{valor.toLocaleString("es-PE")}</p><p className="mt-2 text-xs text-slate-500">{descripcion}</p></div>;
}
