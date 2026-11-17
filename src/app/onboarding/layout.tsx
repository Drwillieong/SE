import type {ReactNode} from "react";
import {requireSignedInPage} from "@/lib/page-guard";
export default async function OnboardingLayout({children}:{children:ReactNode}){await requireSignedInPage();return children}
