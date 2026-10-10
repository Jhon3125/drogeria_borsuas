"use client";
import {useState} from "react";
import {recibirCompra} from "./actions";
type Linea = {id:number;nombre:string;pedido:number;recibido:number};
export function RecepcionForm({compraId,lineas}:{compraId:number;lineas:Linea[]}) {
 const [cantidades,setCantidades] = useState<Record<number,number>>({});
 return <form action={recibirCompra} className="mt-3 space-y-3 rounded-xl border bg-slate-50 p-3">
  <input type="hidden" name="compraId" value={compraId}/>
  <input type="hidden" name="cantidades" value={JSON.stringify(cantidades)}/>
  <p className="text-sm font-semibold">Confirmar cantidades efectivamente recibidas</p>
  {lineas.map(l=>{const pendiente=l.pedido-l.recibido;return <label key={l.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
   <span>{l.nombre} — recibido {l.recibido}/{l.pedido} (pendiente {pendiente})</span>
   <input aria-label={`Recibir ${l.nombre}`} type="number" min={0} max={pendiente} step={1} value={cantidades[l.id]??0}
    onChange={e=>setCantidades(p=>({...p,[l.id]:Number(e.target.value)}))}
    className="w-24 rounded-md border bg-white p-2"/>
  </label>})}
  <button type="submit" disabled={!Object.values(cantidades).some(n=>Number.isInteger(n)&&n>0)} className="rounded-lg bg-[#238B55] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Confirmar recepción parcial o completa</button>
  <p className="text-xs text-slate-500">El stock solo aumenta por las cantidades aquí confirmadas. No se puede recibir más de lo pedido.</p>
 </form>;
}
