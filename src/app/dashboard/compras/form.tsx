"use client";
import {useActionState,useState} from "react";
import {crearCompra} from "./actions";
type Item={productoId:number;cantidad:number;precioUnitario:string;numeroLote:string;fechaVencimiento:string};
type Opcion={id:number;nombre:string;codigo:string};
const vacio=():Item=>({productoId:0,cantidad:1,precioUnitario:"0.00",numeroLote:"",fechaVencimiento:""});
export function CompraForm({proveedores,productos}:{proveedores:{id:number;razonSocial:string}[];productos:Opcion[]}){
 const [items,setItems]=useState<Item[]>([vacio()]);const [proveedorId,setProveedorId]=useState(0);
 const [state,action,pending]=useActionState(crearCompra,undefined);
 const actualizar=(pos:number,campo:keyof Item,valor:string)=>setItems(prev=>prev.map((it,i)=>i===pos?{...it,[campo]:campo==='productoId'||campo==='cantidad'?Number(valor):valor}:it));
 const payload=JSON.stringify({proveedorId,items});
 return <form action={action} className="space-y-4 rounded-xl border bg-white p-5 shadow-sm">
  <h2 className="text-xl font-bold">Registrar compra</h2><p className="text-sm text-slate-600">La compra queda pendiente. No modifica stock hasta confirmar la recepción.</p>
  <label className="block text-sm font-semibold">Proveedor<select required className="mt-1 block w-full rounded-lg border p-2" value={proveedorId} onChange={e=>setProveedorId(Number(e.target.value))}><option value={0}>Seleccionar proveedor</option>{proveedores.map(p=><option key={p.id} value={p.id}>{p.razonSocial}</option>)}</select></label>
  <div className="space-y-3">{items.map((it,i)=><div key={i} className="grid gap-2 rounded-lg border bg-slate-50 p-3 md:grid-cols-5">
   <label className="text-xs">Producto<select className="mt-1 w-full rounded border p-2" value={it.productoId} onChange={e=>actualizar(i,'productoId',e.target.value)}><option value={0}>Seleccionar</option>{productos.map(p=><option key={p.id} value={p.id}>{p.codigo} — {p.nombre}</option>)}</select></label>
   <label className="text-xs">Cantidad<input type="number" min="1" step="1" className="mt-1 w-full rounded border p-2" value={it.cantidad} onChange={e=>actualizar(i,'cantidad',e.target.value)}/></label>
   <label className="text-xs">Costo unitario<input type="number" min="0" step="0.01" className="mt-1 w-full rounded border p-2" value={it.precioUnitario} onChange={e=>actualizar(i,'precioUnitario',e.target.value)}/></label>
   <label className="text-xs">N.º lote<input className="mt-1 w-full rounded border p-2" value={it.numeroLote} onChange={e=>actualizar(i,'numeroLote',e.target.value)}/></label>
   <label className="text-xs">Vencimiento<input type="date" className="mt-1 w-full rounded border p-2" value={it.fechaVencimiento} onChange={e=>actualizar(i,'fechaVencimiento',e.target.value)}/></label>
   {items.length>1&&<button type="button" className="text-left text-sm text-red-700 md:col-span-5" onClick={()=>setItems(a=>a.filter((_,x)=>x!==i))}>Quitar línea</button>}
  </div>)}</div>
  <button type="button" className="rounded-lg border px-4 py-2" onClick={()=>setItems(a=>[...a,vacio()])}>+ Añadir producto</button>
  <input type="hidden" name="payload" value={payload}/>
  <div><button disabled={pending||!proveedorId||items.some(i=>!i.productoId||!i.numeroLote||!i.fechaVencimiento)} className="rounded-lg bg-[#123E70] px-5 py-2 font-semibold text-white disabled:opacity-50">{pending?"Guardando...":"Registrar compra pendiente"}</button></div>
  {state?.error&&<p role="alert" className="text-red-700">{state.error}</p>}{state?.ok&&<p className="text-green-700">{state.ok}</p>}
 </form>
}
