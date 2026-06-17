import { json, type RequestHandler } from "@sveltejs/kit";
import { insertDwell } from "$lib/server/analytics/db";

const MAX_DWELL_MS = 6 * 3_600_000; // 6h cap — discard abandoned-tab outliers

export const POST: RequestHandler = async ({ request }) => {
  // navigator.sendBeacon sends a Blob/text body; parse defensively.
  let body: { path?: unknown; ms?: unknown } = {};
  try {
    body = JSON.parse(await request.text());
  } catch {
    /* ignore malformed beacons */
  }

  const path = typeof body.path === "string" ? body.path : null;
  const ms = typeof body.ms === "number" ? body.ms : null;

  if (path && path.startsWith("/") && ms !== null && ms >= 0 && ms < MAX_DWELL_MS) {
    try {
      insertDwell(path, ms);
    } catch {
      /* best-effort */
    }
  }

  // sendBeacon ignores the response body; keep it tiny.
  return json({ ok: true });
};
