import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { exigirRol } from "@/lib/guard";
import { guardarConfiguracion } from "./actions";
export default async function ConfiguracionPage(){
 await exigirRol(["SUPER_ADMIN","ADMIN"]);
 const config=await prisma.configuracionSistema.findUnique({where:{id:1}});
 return <main className="mx-auto max-w-3xl space-y-5"><p className="text-sm text-slate-500">Administración / Preferencias</p><h1 className="text-3xl font-bold text-[#123E70]">Configuración</h1>
 <form action={guardarConfiguracion} className="space-y-4 rounded-2xl border bg-white p-6"><h2 className="font-semibold">Alertas de vencimiento</h2><label className="block text-sm">Avisar cuando un lote venza dentro de estos días<input className="mt-2 block w-full rounded-lg border p-2" type="number" min={1} max={365} name="diasAlertaVencimiento" defaultValue={config?.diasAlertaVencimiento??90} required/></label><button className="rounded-lg bg-[#123E70] px-5 py-2.5 text-white">Guardar configuración</button></form>
 <div className="rounded-2xl border bg-white p-6"><h2 className="font-semibold">Administración de usuarios</h2><p className="my-2 text-sm text-slate-500">Los permisos y accesos se administran en Usuarios; las reglas de stock y lotes siguen sus validaciones actuales.</p><Link className="inline-flex items-center gap-2 rounded-lg bg-[#123E70] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#087EBD]" href="/dashboard/usuarios">Administrar usuarios <span aria-hidden="true">→</span></Link></div></main>
}
