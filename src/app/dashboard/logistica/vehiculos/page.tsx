import { prisma } from "@/lib/prisma";
import { exigirRol } from "@/lib/guard";
import { guardarVehiculo, cambiarVehiculo } from "../actions";
export default async function VehiculosPage() {
  await exigirRol(["SUPER_ADMIN", "ADMIN"]);
  const vehiculos = await prisma.vehiculo.findMany({ orderBy: { id: "desc" }, include: { _count: { select: { hojasDeRuta: true } } } });
  return <main className="mx-auto max-w-6xl space-y-6"><header><p className="text-sm text-slate-500">Logística / Flota</p><h1 className="text-3xl font-bold text-[#123E70]">Vehículos</h1><p className="text-slate-500">Registro y disponibilidad de la flota.</p></header>
    <form action={guardarVehiculo} className="grid gap-3 rounded-2xl border bg-white p-5 shadow-sm md:grid-cols-4">
      <label className="text-sm font-semibold">Placa<input name="placa" required maxLength={12} placeholder="ABC-123" className="mt-1 w-full rounded-lg border p-2.5 uppercase" /></label>
      <label className="text-sm font-semibold">Modelo<input name="modelo" required maxLength={100} placeholder="Renault Kangoo" className="mt-1 w-full rounded-lg border p-2.5" /></label>
      <label className="text-sm font-semibold">Capacidad<input name="capacidad" required maxLength={80} placeholder="800 kg" className="mt-1 w-full rounded-lg border p-2.5" /></label>
      <button className="self-end rounded-lg bg-[#123E70] px-4 py-2.5 font-semibold text-white">Registrar vehículo</button>
    </form>
    <section className="overflow-x-auto rounded-2xl border bg-white shadow-sm"><table className="w-full text-left text-sm"><thead className="bg-slate-50"><tr>{["Placa","Modelo","Capacidad","Estado","Rutas","Acción"].map(x=><th className="p-4" key={x}>{x}</th>)}</tr></thead><tbody>{vehiculos.map(v=><tr key={v.id} className="border-t"><td className="p-4 font-semibold">{v.placa}</td><td className="p-4">{v.modelo}</td><td className="p-4">{v.capacidad}</td><td className="p-4">{v.estado?"Disponible":"No disponible"}</td><td className="p-4">{v._count.hojasDeRuta}</td><td className="p-4"><form action={cambiarVehiculo}><input type="hidden" name="id" value={v.id}/><button className="rounded-lg border px-3 py-2 hover:bg-slate-50">{v.estado?"Desactivar":"Activar"}</button></form></td></tr>)}</tbody></table>{vehiculos.length===0&&<p className="p-6 text-slate-500">Sin vehículos registrados.</p>}</section>
  </main>;
}
