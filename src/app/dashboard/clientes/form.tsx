"use client";
import { useActionState, useState } from "react";
import { guardarCliente } from "./actions";
type ClienteEditable={id:number;razonSocial:string;documento:string;telefono:string|null;correo:string|null;direccion:string|null};
export function ClienteForm({cliente}:{cliente?:ClienteEditable}){
  const [abierto,setAbierto]=useState(!cliente);
  const [estado,accion,pendiente]=useActionState(guardarCliente,undefined);
  return <div className="rounded-xl border bg-white p-4 shadow-sm">
    <button type="button" className="font-semibold text-[#123E70]" onClick={()=>setAbierto(x=>!x)}>{cliente?`Editar ${cliente.razonSocial}`:"+ Registrar cliente"}</button>
    {abierto&&<form action={accion} className="mt-4 grid gap-3 md:grid-cols-2">
      {cliente&&<input type="hidden" name="id" value={cliente.id}/>}
      <label className="text-sm">Razón social / nombre<input required name="razonSocial" defaultValue={cliente?.razonSocial} maxLength={180} className="mt-1 w-full rounded-lg border p-2"/></label>
      <label className="text-sm">DNI / RUC<input required name="documento" defaultValue={cliente?.documento} minLength={8} maxLength={11} inputMode="numeric" className="mt-1 w-full rounded-lg border p-2"/></label>
      <label className="text-sm">Teléfono<input name="telefono" defaultValue={cliente?.telefono??""} maxLength={30} className="mt-1 w-full rounded-lg border p-2"/></label>
      <label className="text-sm">Correo<input name="correo" type="email" defaultValue={cliente?.correo??""} className="mt-1 w-full rounded-lg border p-2"/></label>
      <label className="text-sm md:col-span-2">Dirección<input name="direccion" defaultValue={cliente?.direccion??""} maxLength={300} className="mt-1 w-full rounded-lg border p-2"/></label>
      <div className="md:col-span-2"><button disabled={pendiente} className="rounded-lg bg-[#123E70] px-4 py-2 font-semibold text-white disabled:opacity-50">{pendiente?"Guardando...":"Guardar cliente"}</button></div>
      {estado?.error&&<p role="alert" className="text-red-700 md:col-span-2">{estado.error}</p>}{estado?.ok&&<p className="text-green-700 md:col-span-2">{estado.ok}</p>}
    </form>}
  </div>;
}
