import { defineApp } from "convex/server";
import auth from "@convex-dev/auth/convex.config";
import authEmail from "@convex-dev/auth/components/email/convex.config";
import authPassword from "@convex-dev/auth/components/password/convex.config";
import resend from "@convex-dev/resend/convex.config";

const app = defineApp();
app.use(auth, { name: "auth" });
app.use(authEmail, { name: "authEmail" });
app.use(authPassword, { name: "authPassword" });
app.use(resend, { name: "resend" });
export default app;
