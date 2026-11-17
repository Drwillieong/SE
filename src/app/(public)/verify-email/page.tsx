import {VerifyEmail} from "@/features/auth/verify-email";
export default async function VerifyEmailPage({searchParams}:{searchParams:Promise<{code?:string}>}){const {code=""}=await searchParams;return <main className="px-5 py-12"><VerifyEmail code={code}/></main>}
