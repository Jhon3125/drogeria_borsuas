"use client";
import {useActionState,useState} from "react";
import {crearCotizacion} from "./actions";
type Item={productoId:number;cantidad:number;precioUnitario:string};
type Producto={id:number;codigo:string;nombre:string;precioVenta:string};
const nuevo=():Item=>({productoId:0,cantidad:1,precioUnitario:"0.00"});
export function CotizacionForm({clientes,productos}:{clientes:{id:number;razonSocial:string}[];productos:Producto[]}){
 const [clienteId,setClienteId]=useState(0),[items,setItems]=useState<Item[]>([nuevo()]),[descuento,setDescuento]=useState("0.00");
 const [estado,accion,pendiente]=useActionState(crearCotizacion,undefined);
 const modificar=(i:number,update:Partial<Item>)=>setItems(prev=>prev.map((v,j)=>j===i?{...v,...update}:v));
 const subtotal=items.reduce((n,x)=>n+x.cantidad*(Number(x.precioUnitario)||0),0);
 const total=Math.max(0,subtotal-(Number(descuento)||0));
 return <form action={accion} className="space-y-4 rounded-xl border bg-white p-5 shadow-sm">
 <div><h2 className="text-xl font-bold">Nueva cotización</h2><p className="text-sm text-slate-600">La cotización registra una propuesta comercial, sin reservar ni descontar stock.</p></div>
 <label className="block text-sm font-semibold">Cliente<select required value={clienteId} onChange={e=>setClienteId(Number(e.target.value))} className="mt-1 block w-full rounded-lg border p-2"><option value={0}>Seleccionar cliente</option>{clientes.map(c=><option value={c.id} key={c.id}>{c.razonSocial}</option>)}</select></label>
 <div className="space-y-3">{items.map((it,i)=><div key={i} className="grid gap-3 rounded-lg border bg-slate-50 p-3 md:grid-cols-4">
 <label className="text-sm md:col-span-2">Producto<select value={it.productoId} onChange={e=>{const id=Number(e.target.value);const p=productos.find(p=>p.id===id);modificar(i,{productoId:id,precioUnitario:p?.precioVenta??"0.00"});}} className="mt-1 w-full rounded border p-2"><option value={0}>Seleccionar producto</option>{productos.map(p=><option key={p.id} value={p.id}>{p.codigo} · {p.nombre}</option>)}</select></label>
 <label className="text-sm">Cantidad<input type="number" min="1" max="1000000" step="1" value={it.cantidad} onChange={e=>modificar(i,{cantidad:Number(e.target.value)})} className="mt-1 w-full rounded border p-2"/></label>
 <label className="text-sm">Precio unitario S/<input type="number" min="0" max="99999999" step="0.01" value={it.precioUnitario} onChange={e=>modificar(i,{precioUnitario:e.target.value})} className="mt-1 w-full rounded border p-2"/></label>
 {items.length>1&&<button type="button" onClick={()=>setItems(a=>a.filter((_,j)=>i!==j))} className="text-left text-sm text-red-700 md:col-span-4">Quitar producto</button>}
 </div>)}</div>
 <button type="button" onClick={()=>setItems(a=>[...a,nuevo()])} disabled={items.length>=50} className="rounded-lg border px-4 py-2">+ Añadir producto</button>
 <div className="grid gap-2 text-sm md:grid-cols-3"><label>Descuento general S/<input type="number" min="0" step="0.01" value={descuento} onChange={e=>setDescuento(e.target.value)} className="mt-1 block w-full rounded border p-2"/></label><div className="rounded-lg bg-slate-50 p-3">Subtotal: <b>S/ {subtotal.toFixed(2)}</b></div><div className="rounded-lg bg-blue-50 p-3">Total: <b>S/ {total.toFixed(2)}</b></div></div>
 <input type="hidden" name="payload" value={JSON.stringify({clienteId,items:items.map(i=>({...i,precioUnitario:Number(i.precioUnitario)})),descuento:Number(descuento)})}/>
 <button disabled={pendiente||!clienteId||items.some(x=>!x.productoId||!Number.isInteger(x.cantidad)||x.cantidad<1)||Number(descuento)>subtotal} className="rounded-lg bg-[#123E70] px-5 py-2 font-semibold text-white disabled:opacity-50">{pendiente?"Guardando...":"Registrar cotización"}</button>
 {estado?.error&&<p role="alert" className="text-red-700">{estado.error}</p>}{estado?.ok&&<p className="text-green-700">{estado.ok}</p>}
 </form>;
}
