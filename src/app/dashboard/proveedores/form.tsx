"use client";
import {useActionState} from "react";
import {guardarProveedor} from "./actions";
type ProveedorData={id:number;razonSocial:string;ruc:string;contacto:string|null;telefono:string|null;correo:string|null;direccion:string|null};
export function FormularioProveedor({proveedor}:{proveedor?:ProveedorData}){
 const [state,action,pending]=useActionState(guardarProveedor,undefined);
 return <form action={action} className="grid gap-3 rounded-xl border bg-white p-5 shadow-sm md:grid-cols-2">
  <input type="hidden" name="id" value={proveedor?.id??""}/>
  <h2 className="col-span-full text-lg font-bold">{proveedor?"Editar proveedor":"Nuevo proveedor"}</h2>
  {([['razonSocial','Razón social'],['ruc','RUC (11 dígitos)'],['contacto','Contacto'],['telefono','Teléfono'],['correo','Correo'],['direccion','Dirección']] as const).map(([campo,titulo])=><label key={campo} className="space-y-1 text-sm font-medium"><span>{titulo}</span><input className="block w-full rounded-lg border p-2" name={campo} defaultValue={proveedor?.[campo]??""} required={campo==='razonSocial'||campo==='ruc'} maxLength={campo==='ruc'?11:300}/></label>)}
  <div className="col-span-full flex items-center gap-3"><button disabled={pending} className="rounded-lg bg-[#123E70] px-5 py-2 font-semibold text-white disabled:opacity-50">{pending?"Guardando...":"Guardar proveedor"}</button>{state?.error&&<span role="alert" className="text-red-700">{state.error}</span>}{state?.ok&&<span className="text-green-700">{state.ok}</span>}</div>
 </form>
}
