"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { Pencil, UserRoundPlus } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import { ClienteForm } from "./form";
import { alternarCliente } from "./actions";

type Cliente = {
  id: number;
  razonSocial: string;
  documento: string | null;
  telefono: string | null;
  correo: string | null;
  direccion: string | null;
  estado: boolean;
  _count: { ventas: number };
};

type Props = { clientes: Cliente[] };
type Filtro = "TODOS" | "ACTIVOS" | "INACTIVOS";

export function DirectorioClientes({ clientes }: Props) {
  const router = useRouter();
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("TODOS");
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editar, setEditar] = useState<Cliente | null>(null);

  const cerrar = useCallback(() => {
    setModalAbierto(false);
    setEditar(null);
  }, []);

  const guardado = useCallback(() => {
    cerrar();
    router.refresh();
  }, [cerrar, router]);

  const activos = clientes.filter((c) => c.estado).length;
  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLocaleLowerCase("es-PE");
    return clientes.filter((c) => {
      const coincide =
        !q ||
        [c.razonSocial, c.documento, c.telefono, c.correo, c.direccion]
          .some((dato) => (dato ?? "").toLocaleLowerCase("es-PE").includes(q));
      const estado = filtro === "TODOS" || (filtro === "ACTIVOS" ? c.estado : !c.estado);
      return coincide && estado;
    });
  }, [clientes, busqueda, filtro]);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#123E70]">Clientes</h1>
          <p className="mt-1 text-sm text-slate-600">Directorio y administración de la cartera comercial de Borsuas.</p>
        </div>
        <button
          type="button"
          onClick={() => { setEditar(null); setModalAbierto(true); }}
          className="rounded-lg bg-[#123E70] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#087EBD]"
        >
          + Nuevo cliente
        </button>
      </header>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <Indicador titulo="Total de clientes" valor={clientes.length} descripcion="Registrados" />
        <Indicador titulo="Clientes activos" valor={activos} descripcion="Disponibles" />
        <Indicador titulo="Clientes inactivos" valor={clientes.length - activos} descripcion="Deshabilitados" />
        <Indicador titulo="Registros comerciales" valor={clientes.reduce((n, c) => n + c._count.ventas, 0)} descripcion="Incluye cotizaciones y otras etapas" />
      </div>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-200 p-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#123E70]">Directorio de clientes</h2>
            <p className="mt-1 text-sm text-slate-500">Consulta y administra los clientes registrados.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <label className="text-xs font-semibold text-slate-600">
              Buscar cliente
              <input
                type="search"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Nombre, DNI, RUC o contacto"
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm sm:w-72"
              />
            </label>
            <label className="text-xs font-semibold text-slate-600">
              Estado
              <select
                value={filtro}
                onChange={(e) => setFiltro(e.target.value as Filtro)}
                className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm sm:w-40"
              >
                <option value="TODOS">Todos</option>
                <option value="ACTIVOS">Activos</option>
                <option value="INACTIVOS">Inactivos</option>
              </select>
            </label>
          </div>
        </div>

        <p className="border-b border-slate-100 bg-slate-50 px-5 py-3 text-sm text-slate-600">
          Mostrando <b>{filtrados.length}</b> de {clientes.length} clientes
        </p>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-5 py-4">Cliente</th>
                <th className="px-4 py-4">Contacto</th>
                <th className="px-4 py-4 text-center">Registros</th>
                <th className="px-4 py-4 text-center">Estado</th>
                <th className="px-5 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtrados.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="px-5 py-4">
                    <p className="font-semibold text-slate-800">{c.razonSocial}</p>
                    <p className="mt-1 text-xs text-slate-500">{c.documento
                      ? `${c.documento.length === 8 ? "DNI" : "RUC"}: ${c.documento}`
                      : "Sin documento registrado (Prospecto)"}</p>
                  </td>
                  <td className="px-4 py-4 text-slate-600">
                    <p>{c.telefono || "Sin teléfono"}</p>
                    <p className="mt-1 max-w-[240px] truncate text-xs">{c.correo || "Sin correo"}</p>
                  </td>
                  <td className="px-4 py-4 text-center font-semibold">{c._count.ventas}</td>
                  <td className="px-4 py-4 text-center">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${c.estado ? "bg-green-50 text-[#238B55]" : "bg-slate-100 text-slate-600"}`}>
                      {c.estado ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/dashboard/clientes/${c.id}`} className="whitespace-nowrap rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-[#123E70] hover:bg-slate-100">Ver detalle</Link>
                      <button type="button" onClick={() => { setEditar(c); setModalAbierto(true); }} className="rounded-lg border border-blue-200 px-3 py-1.5 text-xs font-semibold text-[#087EBD] hover:bg-blue-50">Editar</button>
                      <form action={alternarCliente}>
                        <input type="hidden" name="id" value={c.id} />
                        <button type="submit" className={`whitespace-nowrap rounded-lg border px-3 py-1.5 text-xs font-semibold ${c.estado ? "border-red-200 text-red-700 hover:bg-red-50" : "border-green-200 text-[#238B55] hover:bg-green-50"}`}>
                          {c.estado ? "Desactivar" : "Activar"}
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtrados.length === 0 && <p className="p-10 text-center text-sm text-slate-500">No se encontraron clientes con esos filtros.</p>}
      </section>

      <Dialog
        open={modalAbierto}
        onOpenChange={(abierto) => {
          if (!abierto) cerrar();
          else setModalAbierto(true);
        }}
      >
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader className="space-y-3 pb-2">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-primary">
              {editar ? <Pencil className="h-5 w-5" /> : <UserRoundPlus className="h-5 w-5" />}
            </div>
            <div className="space-y-1.5">
              <DialogTitle className="text-xl">
                {editar ? "Editar cliente" : "Nuevo cliente"}
              </DialogTitle>
              <DialogDescription>
                {editar
                  ? "Actualiza los datos generales y de contacto del cliente."
                  : "Registra un nuevo cliente en la cartera comercial de Borsuas."}
              </DialogDescription>
            </div>
          </DialogHeader>

          {modalAbierto && (
            <ClienteForm
              key={editar?.id ?? "nuevo"}
              cliente={editar ?? undefined}
              onCancelar={cerrar}
              onGuardado={guardado}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Indicador({ titulo, valor, descripcion }: { titulo: string; valor: number; descripcion: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <p className="text-sm font-semibold text-slate-500">{titulo}</p>
      <p className="mt-3 text-3xl font-bold text-[#123E70]">{valor.toLocaleString("es-PE")}</p>
      <p className="mt-2 text-xs text-slate-500">{descripcion}</p>
    </div>
  );
}
