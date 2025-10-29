import { includesQuery } from "@/lib/pageFilter";

export function filterSection<T extends Record<string, any>>(
  section: { title: string; data: T[] },
  q: string,
  pick: (row: T) => Array<string | number | null | undefined>
) {
  const rows = section.data.filter((r) => includesQuery(q, ...pick(r)));
  return rows.length ? { ...section, data: rows } : null;
}