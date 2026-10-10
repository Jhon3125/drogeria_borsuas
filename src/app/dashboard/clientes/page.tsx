import { prisma } from "@/lib/prisma";
import { exigirRol } from "@/lib/guard";
import { ROLES_COMERCIAL } from "@/lib/comercial-roles";
import { ClienteForm } from "./form";
import { alternarCliente } from "./actions";
export default async function ClientesPage(){
 await exigirRol(ROLES_COMERCIAL);
 const clientes=await prisma.cliente.findMany({orderBy:{razonSocial:"asc"},include:{_count:{select:{ventas:true}}}});
 return <div className="space-y-6"><header><h1 className="text-3xl font-bold text-[#123E70]">Clientes</h1><p className="text-slate-600">Registro comercial y gestión de contactos.</p></header>
 <ClienteForm/><section className="overflow-x-auto rounded-xl border bg-white p-5 shadow-sm"><h2 className="mb-4 text-lg font-bold">Clientes registrados ({clientes.length})</h2>
 <table className="w-full text-left text-sm"><thead><tr className="border-b text-slate-500"><th className="p-3">Cliente</th><th>Documento</th><th>Contacto</th><th>Operaciones</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>{clientes.map(c=><tr key={c.id} className="border-b align-top"><td className="p-3 font-semibold">{c.razonSocial}</td><td>{c.documento}</td><td>{c.telefono||c.correo||"—"}</td><td>{c._count.ventas}</td><td>{c.estado?"Activo":"Inactivo"}</td><td className="space-y-2 pb-3"><ClienteForm cliente={{id:c.id,razonSocial:c.razonSocial,documento:c.documento,telefono:c.telefono,correo:c.correo,direccion:c.direccion}}/><form action={alternarCliente}><input type="hidden" name="id" value={c.id}/><button className="rounded border px-2 py-1">{c.estado?"Desactivar":"Activar"}</button></form></td></tr>)}</tbody></table>
 {clientes.length===0&&<p className="py-8 text-center text-slate-500">Todavía no hay clientes registrados.</p>}</section></div>;
}
