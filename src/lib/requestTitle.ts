import dayjs from "dayjs";

export function buildRequestTitle(req: any) {
  const datePart =
    req?.campaign_date ? dayjs(req.campaign_date).format("DD MM") : "";

  const firstName =
    req?.first_name ||
    req?.requested_by?.first_name ||
    req?.owner?.first_name ||
    (typeof req?.created_by === "string" ? req.created_by.split(" ")[0] : "") ||
    "";

  const client = req?.client_name || "";

  const countryCode =
    (req?.country && String(req.country).split(" - ")[0]) ||
    req?.country_code ||
    "";

  const device = Array.isArray(req?.device)
    ? req.device.join("/")
    : (req?.device || "");

  const ctype = req?.campaign_name_post_fix || "";

  const title = [datePart, firstName, client, countryCode, device, ctype]
    .filter(Boolean)
    .join(" – ");

  // fallback
  return title || `${req?.brand_name ?? "Request"} — ${req?.campaign_name_post_fix ?? "Type N/A"}`;
}
