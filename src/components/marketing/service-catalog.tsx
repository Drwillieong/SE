"use client";
import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Money } from "@/components/shared/money";
const tabs=[["laundry","Wash, Dry & Fold"],["dryCleaning","Dry Cleaning"],["selfService","Self Service"],["addon","Add-ons"]] as const;
export function ServiceCatalog(){
  const [category,setCategory]=useState<string>("laundry");
  const services=useQuery(api.catalog.listServices,{});
  const selected=services?.filter(service=>service.category===category) ?? [];
  return <><div className="mt-8 flex flex-wrap gap-2" role="tablist" aria-label="Service categories">{tabs.map(([key,label])=><button key={key} role="tab" aria-selected={category===key} onClick={()=>setCategory(key)} className={`rounded-full px-4 py-2 text-sm font-bold transition ${category===key?"bg-pink-600 text-white":"border border-slate-200 bg-white text-slate-600 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300"}`}>{label}</button>)}</div>{services===undefined?<div className="mt-5 rounded-2xl border p-6 text-slate-500">Loading services…</div>:<div className="mt-5 grid gap-5 md:grid-cols-3">{selected.map(service=><article key={service._id} className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900"><h3 className="font-heading text-xl font-bold">{service.name}</h3><p className="mt-2 min-h-14 leading-6 text-slate-600 dark:text-slate-300">{service.description}</p><div className="mt-5 border-t border-slate-100 pt-4 dark:border-white/10"><span className="block text-xs text-slate-500">{service.pricingType==="quote"?"Starting at":"Price"}</span><span className="font-heading text-lg font-extrabold"><Money cents={service.startingPrice??service.price}/>{service.pricingType==="per_load"?" / load":""}</span></div></article>)}{selected.length===0&&<p className="col-span-full rounded-2xl border p-6 text-slate-500">No services available right now.</p>}</div>}</>;
}
