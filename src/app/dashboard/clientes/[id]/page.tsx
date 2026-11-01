import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { exigirRol } from "@/lib/guard";
import { ROLES_COMERCIAL } from "@/lib/comercial-roles";
import { TabsCliente } from "./tabs-cliente";

type Props = { params: Promise<{ id: string }> };

export default async function DetalleClientePage({ params }: Props) {
  await exigirRol(ROLES_COMERCIAL);
  const { id } = await params;
  const clienteId = Number(id);
  if (!/^\d+$/.test(id) || !Number.isSafeInteger(clienteId) || clienteId <= 0) notFound();

  const cliente = await prisma.cliente.findUnique({
    where: { id: clienteId },
    select: {
      id: true,
      razonSocial: true,
      documento: true,
      telefono: true,
      correo: true,
      direccion: true,
      estado: true,
    },
  });
  if (!cliente) notFound();

  return (
    <main className="space-y-6 p-4 md:p-6">
      <header>
        <Link href="/dashboard/clientes" className="text-sm font-semibold text-[#087EBD] hover:underline">← Volver a clientes</Link>
        <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Clientes / Ficha individual</p>
            <h1 className="mt-1 text-2xl font-bold text-[#123E70] md:text-3xl">{cliente.razonSocial}</h1>
            <p className="mt-1 text-sm text-slate-500">{cliente.documento.length === 8 ? "DNI" : "RUC"}: {cliente.documento}</p>
          </div>
          <span className={`rounded-full px-4 py-2 text-sm font-semibold ${cliente.estado ? "bg-green-50 text-[#238B55]" : "bg-slate-100 text-slate-600"}`}>
            {cliente.estado ? "Cliente activo" : "Cliente inactivo"}
          </span>
        </div>
      </header>

      <TabsCliente
        general={
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-5 text-lg font-bold text-[#123E70]">Información general</h2>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              <Dato titulo="Nombre o razón social" valor={cliente.razonSocial} />
              <Dato titulo="Documento" valor={cliente.documento} />
              <Dato titulo="Teléfono" valor={cliente.telefono} />
              <Dato titulo="Correo electrónico" valor={cliente.correo} />
              <Dato titulo="Dirección" valor={cliente.direccion} />
              <Dato titulo="Estado" valor={cliente.estado ? "Activo" : "Inactivo"} />
            </div>
          </section>
        }
      />
    </main>
  );
}

function Dato({ titulo, valor }: { titulo: string; valor: string | null }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{titulo}</p>
      <p className="mt-1 break-words text-sm font-medium text-slate-800">{valor || "No registrado"}</p>
    </div>
  );
}
