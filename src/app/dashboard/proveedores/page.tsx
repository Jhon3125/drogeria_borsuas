import {prisma} from "@/lib/prisma";
import {exigirRol} from "@/lib/guard";
import {ROLES_COMPRAS_LECTURA,ROLES_COMPRAS_GESTION} from "@/lib/compras-roles";
import {FormularioProveedor} from "./form";
import {cambiarEstadoProveedor} from "./actions";
export default async function ProveedoresPage(){
 const user=await exigirRol(ROLES_COMPRAS_LECTURA);
 const editar=ROLES_COMPRAS_GESTION.includes(user.rol);
 const proveedores=await prisma.proveedor.findMany({orderBy:{razonSocial:"asc"},include:{_count:{select:{compras:true}}}});
 return <main className="space-y-6 p-6"><header><h1 className="text-3xl font-bold text-[#123E70]">Proveedores</h1><p className="text-slate-600">Catálogo de proveedores de Droguería Borsuas</p></header>
 {editar&&<FormularioProveedor/>}<section className="overflow-x-auto rounded-xl border bg-white p-4"><h2 className="mb-3 font-bold">Registrados ({proveedores.length})</h2><table className="w-full text-left text-sm"><thead><tr className="border-b text-slate-500"><th className="p-3">Razón social</th><th>RUC</th><th>Contacto</th><th>Compras</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>{proveedores.map(x=><tr key={x.id} className="border-b"><td className="p-3 font-semibold">{x.razonSocial}</td><td>{x.ruc}</td><td>{x.telefono||x.correo||"—"}</td><td>{x._count.compras}</td><td>{x.estado?"Activo":"Inactivo"}</td><td>{editar&&<form action={cambiarEstadoProveedor}><input type="hidden" name="id" value={x.id}/><button className="rounded border px-2 py-1">{x.estado?"Desactivar":"Activar"}</button></form>}</td></tr>)}</tbody></table></section></main>
}
