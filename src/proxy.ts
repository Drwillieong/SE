import {convexAuthNextjsProxy,nextjsProxyRedirect} from "@/lib/convexAuth";
export default convexAuthNextjsProxy(async(request,{isAuthenticated})=>{
  const path=request.nextUrl.pathname,authed=await isAuthenticated();
  if((path==="/app"||path.startsWith("/app/" )||path==="/admin"||path.startsWith("/admin/"))&&!authed)return nextjsProxyRedirect(request,"/login");
  if((path==="/login"||path==="/signup")&&authed)return nextjsProxyRedirect(request,"/app");
});
export const config={matcher:["/((?!auth(?:/|$)|_next/static|_next/image|favicon.ico).*)"]};
