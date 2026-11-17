import {ResetPasswordForm} from "@/features/auth/reset-password-form";
export default async function ResetPasswordPage({searchParams}:{searchParams:Promise<{code?:string}>}){const {code=""}=await searchParams;return <main className="px-5 py-12"><ResetPasswordForm code={code}/></main>}
