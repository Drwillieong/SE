"use client";
import {useState} from "react";
import {useMutation,useQuery} from "convex/react";
import {api} from "../../../convex/_generated/api";
import type {Id} from "../../../convex/_generated/dataModel";
import {toast} from "sonner";
export function IntakeForm({orderId}:{orderId:Id<"orders">}){
  const [kilos,setKilos]=useState(""),[photos,setPhotos]=useState<File[]>([]),[total,setTotal]=useState(""),[reason,setReason]=useState(""),[pending,setPending]=useState(false);
  const me=useQuery(api.users.me,{}),upload=useMutation(api.adminOrders.generateUploadUrl),record=useMutation(api.adminOrders.recordIntake),canAdjust=me?.user.role==="admin";
  async function submit(){
    if(!kilos||Number(kilos)<=0){toast.error("Enter a weight greater than zero.");return;}
    if(photos.length<1||photos.length>6){toast.error("Choose 1 to 6 photos.");return;}
    if(photos.some(file=>!file.type.startsWith("image/")||file.size>5*1024*1024)){toast.error("Each photo must be an image up to 5 MB.");return;}
    setPending(true);
    try{
      const storageIds:Id<"_storage">[]=[];
      for(const file of photos){const url=await upload({});const response=await fetch(url,{method:"POST",headers:{"Content-Type":file.type},body:file});if(!response.ok)throw new Error("Photo upload failed.");const body=await response.json() as {storageId:string};storageIds.push(body.storageId as Id<"_storage">);}
      await record({orderId,kilos:Number(kilos),photoStorageIds:storageIds,...(total?{adjustedTotal:Number(total)}:{}),...(reason?{adjustReason:reason}:{})});toast.success("Intake saved.");
    }catch(error){toast.error(error instanceof Error?error.message:"Could not save intake.");}finally{setPending(false);}
  }
  return <div className="min-w-64 rounded-xl bg-slate-50 p-3 dark:bg-white/5"><label className="block text-xs font-bold">Weight (kg)<input type="number" min="0.1" step="0.1" value={kilos} onChange={e=>setKilos(e.target.value)} className="mt-1 h-10 w-full rounded-lg border px-2 dark:bg-slate-950"/></label><label className="mt-3 block text-xs font-bold">Intake photos<input type="file" accept="image/*" capture="environment" multiple onChange={e=>setPhotos(Array.from(e.target.files??[]).slice(0,6))} className="mt-1 block w-full text-xs"/></label>{canAdjust&&<><label className="mt-3 block text-xs font-bold">Adjusted total (centavos)<input type="number" min="0" value={total} onChange={e=>setTotal(e.target.value)} className="mt-1 h-10 w-full rounded-lg border px-2 dark:bg-slate-950"/></label>{total&&<label className="mt-3 block text-xs font-bold">Adjustment reason<input required value={reason} onChange={e=>setReason(e.target.value)} className="mt-1 h-10 w-full rounded-lg border px-2 dark:bg-slate-950"/></label>}</>}<button disabled={pending} onClick={submit} className="mt-3 w-full rounded-lg bg-pink-600 px-3 py-2 text-sm font-bold text-white disabled:opacity-50">{pending?"Saving…":"Save intake"}</button></div>;
}
