"use client";
import Link from "next/link";
import {usePaginatedQuery} from "convex/react";
import {api} from "../../../convex/_generated/api";
import {StatusBadge} from "@/components/shared/status-badge";
import {Money} from "@/components/shared/money";
export function OrdersList({history=false}:{history?:boolean}){
  const active=usePaginatedQuery(api.orders.myOrders,{}, {initialNumItems:20});
  const archived=usePaginatedQuery(api.orders.myHistory,{status:undefined,search:undefined},{initialNumItems:20});
  const state=history?archived:active;
  return <main className="p-5 sm:p-8"><h1 className="font-heading text-3xl font-extrabold">{history?"Order history":"Your orders"}</h1><div className="mt-6 grid gap-3">{state.results?.map(order=><Link key={order._id} href={`/app/orders/${order._id}`} className="rounded-2xl border bg-white p-5 transition hover:border-pink-300 dark:border-white/10 dark:bg-slate-900"><div className="flex flex-wrap items-center justify-between gap-3"><strong>{order.orderNumber}</strong><StatusBadge status={order.status}/></div><p className="mt-2 text-sm text-slate-500">Pickup {order.pickupDate} · {order.loads} loads · {order.addressSnapshot.barangay}</p><p className="mt-3 font-bold"><Money cents={order.total}/></p></Link>)}</div>{state.results?.length===0&&<p className="mt-6 rounded-2xl border p-8 text-center text-slate-500">No orders to show yet.</p>}{state.status==="CanLoadMore"&&<button onClick={()=>state.loadMore(20)} className="mt-4 rounded-xl border px-4 py-2 font-bold">Load more</button>}</main>;
}
