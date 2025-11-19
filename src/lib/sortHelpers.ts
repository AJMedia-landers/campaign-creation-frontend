import type { RequestItem, Campaign } from "@/types/campaign";

export const toDate = (v?: any): Date | null => {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
};


export const getRequestBuildDate = (req: RequestItem): Date | null =>{
  let best: Date | null = null;
  for (const row of req.campaigns ?? []) {
    const d = toDate((row as any)?.created_at ?? null);
    if (d && (!best || d < best)) best = d;
  }

  if (best) return best;


  return (
    toDate((req as any)?.campaign_date ?? null) ??
    toDate((req as any)?.requested_at ?? (req as any)?.created_at ?? null)
  );
}


export const sortRequestsByBuildTimeAsc = (a: RequestItem, b: RequestItem) => {
  const da = getRequestBuildDate(a);
  const db = getRequestBuildDate(b);
  if (!da && !db) return 0;
  if (!da) return 1;
  if (!db) return -1;
  return da.getTime() - db.getTime();
};

export const toNumber = (v: any): number | null => {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const cleaned = v.replace(/[^0-9.+-]/g, "").trim();
    if (!cleaned) return null;
    const n = Number(cleaned);
    return Number.isNaN(n) ? null : n;
  }
  return null;
};