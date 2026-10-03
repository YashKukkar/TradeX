import { redirect } from "next/navigation";
import { serverBranding } from "../branding.server";

export async function GET() {
  redirect(`${serverBranding.urls.portalUrl}/login`);
}
