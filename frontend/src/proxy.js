import { NextResponse } from "next/server";

export function proxy(request) {
  const headers = new Headers(request.headers);
  const path = request.nextUrl.pathname;
  const adminUrl = process.env.ADMIN_URL;
  const publicUrl = process.env.PUBLIC_URL;
  const host = request.headers.get("host");
  const adminHost =
    adminUrl && publicUrl !== adminUrl && host === new URL(adminUrl).host;
  const publicHost = publicUrl && host === new URL(publicUrl).host;
  if (adminHost && path === "/admin")
    return NextResponse.redirect(
      new URL(`/${request.nextUrl.search}`, adminUrl),
    );
  if (adminHost && path === "/en")
    return NextResponse.redirect(
      new URL(`/en${request.nextUrl.search}`, publicUrl),
    );
  if (
    !adminHost &&
    publicHost &&
    adminUrl &&
    adminUrl !== publicUrl &&
    (path === "/admin" || path.startsWith("/admin/"))
  )
    return NextResponse.redirect(
      new URL(
        `${path === "/admin" ? "/" : path}${request.nextUrl.search}`,
        adminUrl,
      ),
    );
  const admin = adminHost || path.startsWith("/admin");
  const english =
    path === "/en" ||
    (admin && request.cookies.get("portfolio-admin-locale")?.value === "en-US");
  headers.set("x-portfolio-locale", english ? "en-US" : "pt-BR");
  headers.set("x-portfolio-admin", String(admin));
  if (adminHost && path === "/") {
    const destination = request.nextUrl.clone();
    destination.pathname = "/admin";
    return NextResponse.rewrite(destination, { request: { headers } });
  }
  return NextResponse.next({ request: { headers } });
}
