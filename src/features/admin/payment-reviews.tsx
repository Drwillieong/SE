"use client";
import {usePaginatedQuery,useMutation} from "convex/react";
import {api} from "../../../convex/_generated/api";
import {Money} from "@/components/shared/money";
import {toast} from "sonner";
import type {Id} from "../../../convex/_generated/dataModel";

export function PaymentReviews(){
  const {results,status,loadMore}=usePaginatedQuery(api.payments.pendingReviews,{},{initialNumItems:10});
  const review=useMutation(api.payments.reviewGcash);
  async function decide(orderId:Id<"orders">,decision:"approved"|"rejected"){
    const note=decision==="rejected"?window.prompt("Reason for rejection?"):undefined;
    if(decision==="rejected"&&!note?.trim())return;
    try{await review({orderId,decision,note:note??undefined});toast.success(decision==="approved"?"Payment approved.":"Proof rejected.");}catch(e){toast.error(e instanceof Error?e.message:"Could not review payment.");}
  }
  return <section className="mb-6 rounded-2xl border bg-white p-5 dark:border-white/10 dark:bg-slate-900"><h2 className="text-lg font-bold">GCash awaiting review</h2>{results?.length===0&&<p className="mt-3 text-sm text-slate-500">No proofs awaiting review.</p>}<div className="mt-3 grid gap-3 md:grid-cols-2">{results?.map(({payment,order,proofUrl})=><article key={payment._id} className="rounded-xl border p-3 dark:border-white/10"><div className="flex items-center justify-between"><strong>{order.orderNumber}</strong><Money cents={payment.amount}/></div><p className="mt-1 text-sm">Reference: <span className="font-mono">{payment.referenceNumber}</span></p>{proofUrl&&<a href={proofUrl} target="_blank" rel="noreferrer"><img src={proofUrl} alt={`GCash payment proof for ${order.orderNumber}`} className="mt-3 max-h-56 rounded-lg object-contain"/></a>}<div className="mt-3 flex gap-2"><button onClick={()=>decide(order._id,"approved")} className="rounded-lg bg-pink-600 px-3 py-2 text-sm font-bold text-white">Approve</button><button onClick={()=>decide(order._id,"rejected")} className="rounded-lg border px-3 py-2 text-sm font-bold">Reject</button></div></article>)}</div>{status==="CanLoadMore"&&<button onClick={()=>loadMore(10)} className="mt-3 rounded-lg border px-3 py-2">Load more</button>}</section>;
}
