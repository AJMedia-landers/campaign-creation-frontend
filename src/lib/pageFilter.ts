export function includesQuery(q: string, ...fields: Array<string | number | null | undefined>) {
  const needle = q.trim().toLowerCase();
  if (!needle) return () => true;
  const hay = fields.map(v => (v ?? "") + "").join(" ").toLowerCase();
  return hay.includes(needle);
}