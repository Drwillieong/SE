"use client";
import {useEffect} from "react";
import {useRouter} from "next/navigation";
import {useCompleteSignUpWithEmailPassword} from "@convex-dev/auth/methods/email-password/react";
import {api} from "../../../convex/_generated/api";
export function VerifyEmail({code}:{code:string}){
  const state=useCompleteSignUpWithEmailPassword(api.auth,{emailCode:code}),router=useRouter();
  useEffect(()=>{if(state.status==="complete")router.replace("/onboarding");},[state.status,router]);
  return <section className="mx-auto max-w-md rounded-3xl border bg-white p-7 text-center dark:border-white/10 dark:bg-slate-900"><h1 className="font-heading text-2xl font-extrabold">Verify your email</h1><p className="mt-3 text-slate-500">{state.status==="loading"?"Checking your verification link…":state.status==="complete"?"Email verified. Taking you to onboarding…":state.userError.error==="MISSING_SECRET"?"Open this link in the same browser where you started sign-up.":"This link could not be verified. Request a new sign-up link and try again."}</p></section>;
}
