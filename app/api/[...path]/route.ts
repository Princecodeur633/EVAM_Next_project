import { type NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const DROP_REQ = /^(host|connection|content-length|accept-encoding|cookie|transfer-encoding)$/i;
const DROP_RES = /^(transfer-encoding|connection|content-encoding)$/i;

function apiOrigin() {
  return (process.env.NEXT_PUBLIC_API_URL ?? "https://evam-erp-production.up.railway.app").replace(/\/$/, "");
}

function targetUrl(req: NextRequest, path: string[]) {
  const joined = path.join("/");
  const slash = joined && !joined.endsWith("/") ? "/" : "";
  return `${apiOrigin()}/api/${joined}${slash}${req.nextUrl.search}`;
}

async function proxy(req: NextRequest, path: string[]) {
  const headers = new Headers();
  req.headers.forEach((value, key) => {
    if (!DROP_REQ.test(key)) headers.set(key, value);
  });

  const init: RequestInit = {
    method: req.method,
    headers,
    redirect: "manual",
  };
  if (req.method !== "GET" && req.method !== "HEAD") {
    init.body = await req.arrayBuffer();
  }

  const upstream = await fetch(targetUrl(req, path), init);
  const out = new Headers();
  upstream.headers.forEach((value, key) => {
    if (!DROP_RES.test(key)) out.set(key, value);
  });
  return new Response(upstream.body, { status: upstream.status, headers: out });
}

type Ctx = { params: Promise<{ path: string[] }> };

async function handle(req: NextRequest, ctx: Ctx) {
  return proxy(req, (await ctx.params).path ?? []);
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
export const OPTIONS = handle;
export const HEAD = handle;
