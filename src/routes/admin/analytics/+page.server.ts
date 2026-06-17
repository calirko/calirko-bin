import { getAnalytics, prune } from "$lib/server/analytics/db";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async () => {
  // opportunistic retention: drop rows older than 90 days
  try {
    prune(90);
  } catch {
    /* best-effort */
  }
  return { analytics: getAnalytics(30) };
};
