"use client";
import {usePaginatedQuery,useMutation} from "convex/react";
import {api} from "../../../convex/_generated/api";
import {StatusBadge} from "@/components/shared/status-badge";
import {toast} from "sonner";
import type {Id} from "../../../convex/_generated/dataModel";
export function BookingsList(){
  const {results,status,loadMore}=usePaginatedQuery(api.adminOrders.list,{status:"requested",includeArchived:false,includeDeleted:false},{initialNumItems:25});
  const approve=useMutation(api.adminOrders.approve),reject=useMutation(api.adminOrders.reject);
  async function run(action:"approve"|"reject",id:Id<"orders">){try{if(action==="approve")await approve({orderId:id});else{const reason=window.prompt("Reason for rejection:");if(!reason?.trim())return;await reject({orderId:id,reason});}toast.success(action==="approve"?"Booking approved.":"Booking rejected.");}catch(error){toast.error(error instanceof Error?error.message:"Action failed.");}}
  return <main className="p-5 sm:p-8"><h1 className="font-heading text-3xl font-extrabold">Bookings</h1><p className="mt-1 text-slate-500">Review requested pickups.</p><div className="mt-6 grid gap-3">{results?.map(order=><article key={order._id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border bg-white p-5 dark:border-white/10 dark:bg-slate-900"><div><div className="flex items-center gap-3"><strong>{order.orderNumber}</strong><StatusBadge status={order.status}/></div><p className="mt-2 text-sm text-slate-500">{order.addressSnapshot.fullName} · {order.pickupDate} · {order.loads} loads · {order.addressSnapshot.barangay}</p></div><div className="flex gap-2"><button onClick={()=>run("approve",order._id)} className="rounded-xl bg-emerald-600 px-4 py-2 font-bold text-white">Approve</button><button onClick={()=>run("reject",order._id)} className="rounded-xl border border-red-200 px-4 py-2 font-bold text-red-700">Reject</button></div></article>)}</div>{results?.length===0&&<p className="mt-6 rounded-2xl border p-7 text-center text-slate-500">No pending bookings.</p>}{status==="CanLoadMore"&&<button onClick={()=>loadMore(25)} className="mt-4 rounded-xl border px-4 py-2 font-bold">Load more</button>}</main>;
}
