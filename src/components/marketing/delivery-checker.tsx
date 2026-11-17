"use client";
import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Money } from "@/components/shared/money";
export function DeliveryChecker(){
  const zones=useQuery(api.catalog.listZones,{});
  const [barangay,setBarangay]=useState("");const [loads,setLoads]=useState(1);
  const fee=useQuery(api.catalog.quoteDelivery,barangay?{barangay,loads}:"skip");
  return <div className="rounded-3xl border border-pink-100 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900"><h3 className="font-bold">Delivery fee checker</h3><p className="mt-1 text-sm text-slate-500">Choose your barangay to see the fee.</p><div className="mt-5 grid gap-3 sm:grid-cols-2"><label className="text-sm font-semibold">Barangay<select value={barangay} onChange={(e)=>setBarangay(e.target.value)} className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-3 dark:border-white/15 dark:bg-slate-950"><option value="">Select barangay</option>{zones?.map(z=><option key={z._id} value={z.barangay}>{z.barangay}</option>)}</select></label><label className="text-sm font-semibold">Loads<select value={loads} onChange={(e)=>setLoads(Number(e.target.value))} className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-3 dark:border-white/15 dark:bg-slate-950"><option value={1}>1 load</option><option value={2}>2 loads</option><option value={3}>3 loads</option></select></label></div><p aria-live="polite" className="mt-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-600 dark:bg-white/5 dark:text-slate-300">{!barangay?"Select a barangay to check the delivery fee.":fee===undefined?"Checking fee…":fee===null?"We do not deliver to that area yet.":<>Delivery fee: <Money cents={fee}/></>}</p></div>
}
