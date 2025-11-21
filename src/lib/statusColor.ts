export type StatusChipColor = "default" | "error" | "success" | "warning" | "info";

export function campaignStatusColor(raw: string | undefined): StatusChipColor {
  const s = (raw || "").toLowerCase().trim();
  if (!s) return "default";

  if (s.includes("partially") && s.includes("rejected")) return "warning";
  if (s.includes("rejected")) return "error";
  if (s.includes("approved")) return "success";
  if (s.includes("queued") && s.includes("creation")) return "info";
  if (s.includes("pending") || s.includes("created")) return "default";

  if (/error|failed|fail|timeout/.test(s)) return "error";
  if (/completed|done|success|ok|ready/.test(s)) return "success";
  if (/processing|running|sent|in\s*progress|building/.test(s)) return "warning";

  return "default";
}