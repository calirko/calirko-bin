import { createHmac } from "crypto";
import { env } from "$env/dynamic/private";
import type { RequestEvent } from "@sveltejs/kit";
import { insertView } from "./db.js";

const SKIP_PREFIXES = [
  "/admin",
  "/media",
  "/_app",
  "/api",
  "/favicon",
  "/robots",
  "/sitemap",
];

const SKIP_EXT =
  /\.(?:js|css|map|png|jpe?g|webp|avif|gif|svg|ico|woff2?|ttf|mp4|webm|mp3|json|txt|xml)$/i;

const BOT_RE =
  /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|embedly|quora|pinterest|vkshare|whatsapp|telegram|discord|headless|lighthouse|pingdom|uptime|monitor|healthcheck|curl|wget|python-requests|go-http|axios|node-fetch/i;

export function shouldTrack(event: RequestEvent, response: Response): boolean {
  const p = event.url.pathname;

  if (SKIP_PREFIXES.some((s) => p === s || p.startsWith(s + "/"))) return false;
  if (SKIP_EXT.test(p)) return false;
  if (p.endsWith("__data.json")) return false;

  // SvelteKit / browser prefetch hints
  if (event.request.headers.get("sec-purpose")?.includes("prefetch")) return false;
  if (event.request.headers.get("purpose") === "prefetch") return false;

  // only real HTML page responses
  const ct = response.headers.get("content-type") ?? "";
  if (!ct.includes("text/html")) return false;

  const ua = event.request.headers.get("user-agent") ?? "";
  if (!ua || BOT_RE.test(ua)) return false;

  return true;
}

/** Day-salted HMAC of the IP — accurate per-day uniques, no raw PII, no cross-day linkage. */
function hashIp(ip: string): string {
  const salt = env.ANALYTICS_SALT ?? env.ADMIN_SECRET ?? "change-me-in-production";
  const day = new Date().toISOString().slice(0, 10);
  return createHmac("sha256", salt).update(ip + day).digest("hex").slice(0, 16);
}

/** Reduce a referrer to its external host; drop internal navigation and junk. */
function cleanReferrer(ref: string | null, selfHost: string): string | null {
  if (!ref) return null;
  try {
    const url = new URL(ref);
    if (url.host === selfHost) return null; // internal nav
    return url.host || null;
  } catch {
    return null;
  }
}

export function recordView(event: RequestEvent): void {
  const h = event.request.headers;
  const ip = h.get("cf-connecting-ip") ?? event.getClientAddress();
  insertView({
    ts: Date.now(),
    path: event.url.pathname,
    referrer: cleanReferrer(h.get("referer"), event.url.host),
    country: h.get("cf-ipcountry") ?? null,
    ua: h.get("user-agent"),
    visitorHash: hashIp(ip),
  });
}
