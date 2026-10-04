// Local development proxy; production Caddy forwards /api directly to Express.
import { apiBase } from "@/lib/api";
export const dynamic = "force-dynamic";
async function proxy(request, { params }) {
  const { path } = await params;
  if (path[0] === "internal") return new Response(null, { status: 404 });
  const headers = new Headers();
  for (const name of [
    "content-type",
    "cookie",
    "origin",
    "x-csrf-token",
    "range",
  ]) {
    if (request.headers.has(name)) headers.set(name, request.headers.get(name));
  }
  try {
    const upstream = await fetch(
      `${apiBase()}/api/${path.map(encodeURIComponent).join("/")}${new URL(request.url).search}`,
      {
        method: request.method,
        headers,
        redirect: "manual",
        cache: "no-store",
        ...(!["GET", "HEAD"].includes(request.method)
          ? { body: request.body, duplex: "half" }
          : {}),
      },
    );
    const resultHeaders = new Headers();
    for (const name of [
      "accept-ranges",
      "content-range",
      "content-length",
      "content-type",
      "content-disposition",
      "cache-control",
      "x-content-type-options",
      "retry-after",
    ])
      if (upstream.headers.has(name))
        resultHeaders.set(name, upstream.headers.get(name));
    for (const cookie of upstream.headers.getSetCookie())
      resultHeaders.append("set-cookie", cookie);
    return new Response(upstream.body, {
      status: upstream.status,
      headers: resultHeaders,
    });
  } catch {
    return Response.json(
      { error: "A API está indisponível. Tente novamente." },
      { status: 503 },
    );
  }
}
export {
  proxy as GET,
  proxy as POST,
  proxy as PUT,
  proxy as DELETE,
  proxy as HEAD,
};
