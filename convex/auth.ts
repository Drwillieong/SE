import {components,internal} from "./_generated/api";
import {setupConvexAuth} from "@convex-dev/auth/server";
import {setupEmailPassword} from "@convex-dev/auth/methods/email-password/server";
import {setupGoogle} from "@convex-dev/auth/methods/google/server";
const auth=setupConvexAuth({component:components.auth});
export const {signOut,refreshSession,isAuthenticated}=auth;
const siteUrl=process.env.SITE_URL??"http://localhost:3000";
export const {
  signUpWithEmailPassword,completeSignUpWithEmailPassword,signInWithEmailPassword,
  startPasswordRecovery,checkPasswordRecovery,completePasswordRecovery,changePassword,
}=setupEmailPassword(auth,{
  component:components.authEmail,passwordComponent:components.authPassword,
  emailSender:{kind:"resend",sendEmail:components.resend.lib.sendEmail,apiKey:process.env.AUTH_RESEND_KEY??"MISSING_RESEND_API_KEY",from:process.env.EMAIL_FROM??"Wash It Izzy <auth@example.com>"},
  urls:{signUp:`${siteUrl}/verify-email`,changeEmail:`${siteUrl}/verify-email`,recovery:`${siteUrl}/reset-password`},
}).attachUserCallbacks({createUser:internal.users.createUser});
export const {startSignInWithGoogle,completeSignInWithGoogle}=setupGoogle(auth,{component:components.authGoogle,allowedRedirectOrigins:[siteUrl,"http://localhost:3000"]}).attachUserCallbacks({createUser:internal.users.createUser});
