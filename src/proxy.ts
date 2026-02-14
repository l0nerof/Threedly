import createMiddleware from "next-intl/middleware";
import { NextRequest } from "next/server";
import { updateSession } from "./business/utils/supabase/proxy";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

async function handleRequest(request: NextRequest) {
  const supabaseResponse = await updateSession(request);

  if (supabaseResponse.headers.get("location")) {
    return supabaseResponse;
  }

  const intlResponse = intlMiddleware(request);

  supabaseResponse.cookies.getAll().forEach((cookie) => {
    intlResponse.cookies.set(cookie);
  });

  return intlResponse;
}

export async function proxy(request: NextRequest) {
  return await handleRequest(request);
}

export const config = {
  // Match only internationalized pathnames
  matcher: [
    "/",
    "/(en|ua)/:path*",
    "/((?!api|_next|_vercel|public|images|icons|.*\\..*).*)",
  ],
};
