import * as ct from "countries-and-timezones";

export type CountryOption = { code: string; name: string };

export function getAllCountries(): CountryOption[] {
  return Object.values(ct.getAllCountries())
    .map(c => ({ code: c.id, name: c.name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function getTimezonesByCountry(code: string): string[] {
  const tzs = ct.getTimezonesForCountry(code) || [];
  return tzs
    .slice()
    .sort((a, b) =>
      (b.utcOffset - a.utcOffset) || a.name.localeCompare(b.name)
    )
    .map(t => t.name);
}

// Preferred defaults for multi-timezone countries
const PREFERRED_TZ: Record<string, string> = {
  US: "America/New_York",
  CA: "America/Toronto",
  AU: "Australia/Sydney",
  BR: "America/Sao_Paulo",
  MX: "America/Mexico_City",
  RU: "Europe/Moscow",
  CN: "Asia/Shanghai",
  ID: "Asia/Jakarta",
  AR: "America/Argentina/Buenos_Aires",
  CL: "America/Santiago",
  ES: "Europe/Madrid",
  PT: "Europe/Lisbon",
  GB: "Europe/London",
  DE: "Europe/Berlin",
  FR: "Europe/Paris",
  IT: "Europe/Rome",
  IN: "Asia/Kolkata",
  JP: "Asia/Tokyo",
};

export function pickDefaultTimezone(countryCode: string, tzs: string[]): string {
  const prefer = PREFERRED_TZ[countryCode.toUpperCase()];
  if (prefer && tzs.includes(prefer)) return prefer;

  const full = ct.getTimezonesForCountry(countryCode) || [];
  if (full.length) {
    const best = full
      .slice()
      .sort((a, b) => Math.abs(a.utcOffset) - Math.abs(b.utcOffset))[0];
    if (best?.name && tzs.includes(best.name)) return best.name;
  }

  return tzs[0] || "UTC";
}

export function flagEmoji(countryCode: string): string {
  if (!countryCode) return "";
  const cps = countryCode.toUpperCase().replace(/[^A-Z]/g, "").split("")
    .map(c => 127397 + c.charCodeAt(0));
  return String.fromCodePoint(...cps);
}

export function tzToGmtLabel(tzName: string): string {
  const tz = ct.getTimezone(tzName);
  const minutes = tz?.utcOffset ?? 0; // fall back to 0 if unknown
  const sign = minutes >= 0 ? "+" : "-";
  const abs = Math.abs(minutes);
  const h = Math.floor(abs / 60);
  const m = abs % 60;

  const body = m ? `${h}:${String(m).padStart(2, "0")}` : String(h);
  return `GMT ${sign}${body}`;
}