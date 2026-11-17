import {ConvexHttpClient} from "convex/browser";
import {redirect} from "next/navigation";
import {api} from "../../convex/_generated/api";
import {convexAuthNextjsAccessToken,isAuthenticatedNextjs} from "./convexAuth";
export async function requirePageRole(roles:readonly ("customer"|"staff"|"admin")[],onboarding=false){
  if(!await isAuthenticatedNextjs())redirect("/login");
  const token=await convexAuthNextjsAccessToken();if(!token)redirect("/login");
  const client=new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);client.setAuth(token);
  const current=await client.query(api.users.me,{});if(!current)redirect("/login");
  if(!current.user.role||!roles.includes(current.user.role))redirect(current.user.role==="staff"||current.user.role==="admin"?"/admin":"/app");
  if(onboarding&&current.user.role==="customer"&&(!current.profile?.phone||current.addresses.length===0))redirect("/onboarding");
  return current;
}
export async function requireSignedInPage(){
  if(!await isAuthenticatedNextjs())redirect("/login");
  const token=await convexAuthNextjsAccessToken();if(!token)redirect("/login");
  const client=new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);client.setAuth(token);
  const current=await client.query(api.users.me,{});if(!current)redirect("/login");return current;
}
