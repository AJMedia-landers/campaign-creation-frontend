"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  MenuItem,
  TextField,
  Typography,
  Alert,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  IconButton,
  Autocomplete,
  Snackbar,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
dayjs.extend(customParseFormat);
import { useRouter } from "next/navigation";

import type {
  CampaignRequestInput,
  CampaignCreateResponse,
  UIExtras,
} from "@/types/campaign";
import ConfirmBeforeSubmit from "./ComfirmModal";


const PLATFORMS = [
  { id: "Taboola", label: "Taboola" },
  { id: "Outbrain", label: "Outbrain" },
  { id: "RevContent", label: "RevContent" },
  { id: "MediaGo", label: "MediaGo" },
];

const DEVICES = [
  { id: "Mobile", label: "Mobile" },
  { id: "Desktop", label: "Desktop" },
  { id: "Tablet", label: "Tablet" },
];

const CTA_OPTIONS = ["Learn more", "Shop now", "Read more"];

type ClientName = { id?: string; name: string } | string;
type ObAccount = { id: string; name: string, marketer_id: string };
type RawTzRow = { country: string; timezone: string };

export type NewRequestFormProps = {
  defaultValues?: Partial<CampaignRequestInput & UIExtras>;
  submitLabel?: string;
  onSubmitted?: (res: CampaignCreateResponse) => void;
  title?: string;
};

export default function NewRequestForm({
  defaultValues,
  submitLabel = "Create request",
  onSubmitted,
  title = "New Request Form",
}: NewRequestFormProps) {
  const router = useRouter();
  
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string; id?: string } | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // ---- form state
  const [form, setForm] = useState<CampaignRequestInput>({
    campaign_type: "",
    client_name: "",
    creatives_folder: "",
    ad_platform: [],
    ad_account_id: "",
    brand_name: "",
    timezone: "UTC",
    country: "",
    device: [],
    hours_start: 0,
    hours_end: 0,
    daily_budget: 0,
    cta_button: "Learn more",
    creative_description: "",
    headline1: "",
    ...(defaultValues || {}),
  });

  const [extras, setExtras] = useState<UIExtras>({
    campaign_nickname: "",
    ...(defaultValues || {}),
  });

  const [date, setDate] = useState<Dayjs | null>(
    defaultValues?.campaign_date ? dayjs(defaultValues!.campaign_date) : dayjs()
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  const onChange = (k: keyof CampaignRequestInput, v: any) => {
    setForm((prev) => ({ ...prev, [k]: v }));
    setErrors((prev) => ({ ...prev, [k]: "" }));
  };
  const onExtra = (k: keyof UIExtras, v: any) => {
    setExtras((prev) => ({ ...prev, [k]: v }));
    setErrors((prev) => ({ ...prev, [k]: "" }));
  };

  // Client names
  const [clientNames, setClientNames] = useState<string[]>([]);
  const [clientLoading, setClientLoading] = useState(false);
  const [clientErr, setClientErr] = useState<string | null>(null);

  useEffect(() => {
    let canceled = false;
    (async () => {
      try {
        setClientLoading(true);
        setClientErr(null);
        const res = await fetch("/api/client-names");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const payload = await res.json();
        const list = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : [];
        const normalized = (list as ClientName[])
          .map((c) => (typeof c === "string" ? c : c?.name))
          .filter(Boolean) as string[];
        if (!canceled) setClientNames(normalized);
      } catch {
        if (!canceled) setClientErr("Failed to load client names");
      } finally {
        if (!canceled) setClientLoading(false);
      }
    })();
    return () => {
      canceled = true;
    };
  }, []);

  // Outbrain accounts
  const [obAccounts, setObAccounts] = useState<ObAccount[]>([]);
  const [accLoading, setAccLoading] = useState(false);
  const [accError, setAccError] = useState<string | null>(null);

  useEffect(() => {
    let canceled = false;
    (async () => {
      try {
        setAccLoading(true);
        setAccError(null);
        const res = await fetch("/api/outbrain-accounts");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const payload = await res.json();
        const list = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : [];
        if (!canceled) setObAccounts(list as ObAccount[]);
      } catch {
        if (!canceled) setAccError("Failed to load Outbrain accounts");
      } finally {
        if (!canceled) setAccLoading(false);
      }
    })();
    return () => {
      canceled = true;
    };
  }, []);

  //Country and Timezone
  const [countryOptions, setCountryOptions] = useState<string[]>([]); // e.g. ["DE – Germany", ...]
  const [countryToTz, setCountryToTz] = useState<Record<string, string>>({});
  const [tzToCountries, setTzToCountries] = useState<Record<string, string[]>>({});
  const [tzOptions, setTzOptions] = useState<string[]>([]);
  const [tzLoading, setTzLoading] = useState(false);
  const [tzErr, setTzErr] = useState<string | null>(null);

  const listTzsForCountry = (country: string): string[] => {
    const all = Object.keys(tzToCountries)
      .filter((tz) => tzToCountries[tz]?.includes(country))
      .sort((a, b) => a.localeCompare(b));
    if (country?.trim().startsWith("US")) {
      all.sort((a, b) =>
        a === "America/New_York" ? -1 : b === "America/New_York" ? 1 : a.localeCompare(b)
      );
    }
    return all.length ? all : ["UTC"];
  };

  useEffect(() => {
    let canceled = false;
    (async () => {
      try {
        setTzLoading(true);
        setTzErr(null);

        const res = await fetch("/api/country-timezones");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const payload = await res.json();
        const rows: RawTzRow[] = Array.isArray(payload?.data) ? payload.data : payload;

        const c2t: Record<string, string> = {};
        const t2c: Record<string, string[]> = {};
        const countries: string[] = [];
        const seen = new Set<string>();

        for (const r of rows) {
          const country = String(r?.country || "").trim();
          const tz = String(r?.timezone || "").trim();
          if (!country || !tz) continue;

          if (!c2t[country]) c2t[country] = tz;

          (t2c[tz] ??= []).push(country);

          if (!seen.has(country)) {
            countries.push(country);
            seen.add(country);
          }
        }

        const uniqueCountries = countries;
        const allTzs = Object.keys(t2c).sort((a, b) => a.localeCompare(b));

        setCountryOptions(uniqueCountries);
        setCountryToTz(c2t);
        setTzToCountries(t2c);
        setTzOptions(allTzs.length ? allTzs : ["UTC"]);

        if (!form.country && uniqueCountries.length) {
          const first = uniqueCountries[0];
          onChange("country", first);
          onChange("timezone", c2t[first] || "UTC");
        } else if (form.country && !form.timezone) {
          onChange("timezone", c2t[form.country] || "UTC");
        }
      } catch {
        if (!canceled) {
          setTzErr("Failed to load timezones");
          setCountryOptions([]);
          setCountryToTz({});
          setTzToCountries({});
          setTzOptions(["UTC"]);
        }
      } finally {
        if (!canceled) setTzLoading(false);
      }
    })();
    return () => {
      canceled = true;
    };
  }, []);

  useEffect(() => {
    if (!form.country) {
      const all = Object.keys(tzToCountries).sort((a, b) => a.localeCompare(b));
      setTzOptions(all.length ? all : ["UTC"]);
      return;
    }
    const opts = listTzsForCountry(form.country);
    setTzOptions(opts);
    if (!opts.includes(form.timezone)) {
      onChange("timezone", opts[0]);
    }
  }, [form.country, tzToCountries]);

  useEffect(() => {
    const countries = tzToCountries[form.timezone] || [];
    if (countries.length) {
      if (!countries.includes(form.country)) {
        onChange("country", countries[0]);
      }
    }
  }, [form.timezone, tzToCountries]); // eslint-disable-line

  const handlePlatforms = (_: any, vals: string[] | null) => {
    if (Array.isArray(vals)) onChange("ad_platform", vals);
  };
  const handleDevices = (_: any, vals: string[] | null) => {
    if (Array.isArray(vals)) onChange("device", vals);
  };

  // ---- steppers
  const stepNum = (
    key: "hours_start" | "hours_end" | "daily_budget",
    delta: number,
    bounds?: { min?: number; max?: number }
  ) => {
    const cur = Number(form[key] ?? 0);
    let next = cur + delta;
    if (bounds?.min !== undefined) next = Math.max(bounds.min, next);
    if (bounds?.max !== undefined) next = Math.min(bounds.max, next);
    onChange(key, next);
  };

  // ---- validation
  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.client_name?.trim()) e.client_name = "Required";
    if (!form.campaign_type?.trim()) e.campaign_type = "Required";
    if (!form.creatives_folder?.trim()) e.creatives_folder = "Required";
    if (!form.ad_platform?.length) e.ad_platform = "Select at least one platform";
    if (form.ad_platform.includes("Outbrain") && !form.ad_account_id)
      e.ad_account_id = "Select an Outbrain account";
    if (!form.country) e.country = "Required";
    if (!form.timezone) e.timezone = "Required";
    if (!form.device?.length) e.device = "Select at least one device";
    if (!form.headline1?.trim()) e.headline1 = "Required";
    return e;
  };

  // ---- payload
  const buildPayload = (): CampaignRequestInput => {
    const payload: any = {
      ...form,
      timezone: form.timezone,
      campaign_date: date ? date.format("YYYY-MM-DD") : undefined,
    };
    if (!form.ad_platform.includes("Outbrain")) delete payload.ad_account_id;
    return payload as CampaignRequestInput;
  };

  // ---- toast
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [toastSeverity, setToastSeverity] = useState<"success" | "error">("error");

  function formatBackendErrors(json: any): string {
    const errs = Array.isArray(json?.errors) ? json.errors : [];
    if (errs.length) {
      return errs
        .map((e: any) => `• ${e?.field ? `${e.field}: ` : ""}${e?.message ?? "Invalid value"}`)
        .join("\n");
    }
    return String(json?.message || "Validation failed");
  }

  // ---- submit
  const doSubmit = async () => {
    setResult(null);
    const eMap = validate();
    if (Object.keys(eMap).length) {
      setErrors(eMap);
      return;
    }

    setSubmitting(true);
    try {
      const payload = buildPayload();
      const res = await fetch("/api/campaigns/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json?.success === false) {
        const msg = formatBackendErrors(json);
        setResult({ ok: false, msg });
        setToastMsg(msg);
        setToastSeverity("error");
        setToastOpen(true);
        return;
      }
      setResult({ ok: true, msg: json.message, id: json.data?.id });
      setToastMsg(json.message || "Request created");
      setToastSeverity("success");
      setToastOpen(true);
      onSubmitted?.(json);
      setTimeout(() => {
        router.replace("/");
      }, 3000);
    } catch (err: any) {
      setResult({ ok: false, msg: err.message || "Request failed" });
    } finally {
      setSubmitting(false);
    }
  };

  // open modal before submit
  const handlePreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const eMap = validate();
    if (Object.keys(eMap).length) {
      setErrors(eMap);
      return;
    }
    setConfirmOpen(true);
  };

  return (
    <>
    <Box sx={{ maxWidth: 900, mx: "auto", p: { xs: 2, md: 3 } }}>
      {title && (
        <Typography component="div" variant="h4" sx={{ mb: 2 }}>
          {title}
        </Typography>
      )}

      <Snackbar
        open={toastOpen}
        onClose={() => setToastOpen(false)}
        autoHideDuration={5000}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          severity={toastSeverity}
          variant="filled"
          onClose={() => setToastOpen(false)}
          sx={{ whiteSpace: "pre-wrap", minWidth: 300 }}
        >
          {toastMsg}
        </Alert>
      </Snackbar>

      <Box component="form" onSubmit={handlePreSubmit}>
        <Stack spacing={2}>
          {/* <TextField
            label="CampaignNickname"
            value={extras.campaign_nickname || ""}
            onChange={(e) => onExtra("campaign_nickname", e.target.value)}
            helperText={errors.campaign_nickname}
            fullWidth
          /> */}

          {/* ClientName */}
          <Autocomplete
            options={clientNames}
            getOptionLabel={(opt) => opt}
            value={form.client_name || null}
            onChange={(_, val) => onChange("client_name", val || "")}
            loading={clientLoading}
            loadingText="Loading client names…"
            renderInput={(params) => (
              <TextField
                {...params}
                label="ClientName"
                required
                error={!!errors.client_name}
                helperText={errors.client_name || clientErr || ""}
                fullWidth
              />
            )}
          />

          <TextField
            label="CampaignType"
            value={form.campaign_type}
            onChange={(e) => onChange("campaign_type", e.target.value)}
            onBlur={() =>
              setErrors((p) => ({
                ...p,
                campaign_type: form.campaign_type?.trim() ? "" : "Required",
              }))
            }
            error={!!errors.campaign_type}
            helperText={errors.campaign_type}
            required
            fullWidth
          />

          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label="CampaignDate"
              value={date}
              onChange={setDate}
              format="YYYY-MM-DD"
              slotProps={{
                textField: {
                  fullWidth: true,
                  required: true,
                  inputProps: { placeholder: "YYYY-MM-DD" },
                },
              }}
            />
          </LocalizationProvider>

          <TextField
            label="CreativesFolder (needs to be shared with ivan.plametiuk@ajmedia.io)"
            placeholder="http://"
            value={form.creatives_folder}
            onChange={(e) => onChange("creatives_folder", e.target.value)}
            onBlur={() =>
              setErrors((p) => ({
                ...p,
                creatives_folder: form.creatives_folder?.trim() ? "" : "Required",
              }))
            }
            error={!!errors.creatives_folder}
            helperText={errors.creatives_folder}
            required
            fullWidth
          />

          {/* AdPlatform */}
          <Box>
            <Typography component="div" sx={{ mb: 1 }}>AdPlatform *</Typography>
            <ToggleButtonGroup
              value={form.ad_platform}
              exclusive={false}
              onChange={handlePlatforms}
              color="primary"
              aria-label="ad-platforms"
            >
              {PLATFORMS.map((p) => (
                <ToggleButton key={p.id} value={p.id} aria-pressed={form.ad_platform.includes(p.id)}>
                  {p.label}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
            {!!errors.ad_platform && (
              <Typography component="div" variant="caption" color="error">
                {errors.ad_platform}
              </Typography>
            )}
          </Box>

          {/* Outbrain account */}
          <Autocomplete
            options={obAccounts}
            getOptionLabel={(opt) => opt.name}
            value={obAccounts.find((a) => a.marketer_id === form.ad_account_id) || null}
            onChange={(_, val) => onChange("ad_account_id", val?.marketer_id ?? "")}
            isOptionEqualToValue={(o, v) => o.marketer_id === v.marketer_id}
            disabled={!form.ad_platform.includes("Outbrain")}
            loading={accLoading}
            loadingText="Loading accounts…"
            renderInput={(params) => (
              <TextField
                {...params}
                label="AdAccountId (Outbrain Only)"
                placeholder="Search"
                error={!!errors.ad_account_id}
                helperText={
                  form.ad_platform.includes("Outbrain")
                    ? errors.ad_account_id || accError || ""
                    : "Enable by selecting Outbrain"
                }
                fullWidth
              />
            )}
          />

          <TextField
            label="BrandName"
            value={form.brand_name || ""}
            onChange={(e) => onChange("brand_name", e.target.value)}
            required
            fullWidth
          />

          {/* Hours */}
          <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" } }}>
            <TextField
              sx={{
                "& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button":
                  { WebkitAppearance: "none", margin: 0 },
                "& input[type=number]": { MozAppearance: "textfield" },
              }}
              label="HoursStart"
              type="number"
              value={form.hours_start ?? 0}
              onChange={(e) => onChange("hours_start", Number(e.target.value))}
              required
              InputProps={{
                inputProps: { min: 0, max: 23 },
                endAdornment: (
                  <Stack direction="row" spacing={0.5}>
                    <IconButton size="small" onClick={() => stepNum("hours_start", -1, { min: 0 })}>
                      <RemoveIcon />
                    </IconButton>
                    <IconButton size="small" onClick={() => stepNum("hours_start", +1, { max: 23 })}>
                      <AddIcon />
                    </IconButton>
                  </Stack>
                ),
              }}
              fullWidth
            />
            <TextField
              sx={{
                "& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button":
                  { WebkitAppearance: "none", margin: 0 },
                "& input[type=number]": { MozAppearance: "textfield" },
              }}
              label="HoursEnd"
              type="number"
              value={form.hours_end ?? 0}
              onChange={(e) => onChange("hours_end", Number(e.target.value))}
              required
              InputProps={{
                inputProps: { min: 0, max: 23 },
                endAdornment: (
                  <Stack direction="row" spacing={0.5}>
                    <IconButton size="small" onClick={() => stepNum("hours_end", -1, { min: 0 })}>
                      <RemoveIcon />
                    </IconButton>
                    <IconButton size="small" onClick={() => stepNum("hours_end", +1, { max: 23 })}>
                      <AddIcon />
                    </IconButton>
                  </Stack>
                ),
              }}
              fullWidth
            />
          </Box>

          {/* Country / Timezone */}
          <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" } }}>
            <Autocomplete
              options={countryOptions}
              getOptionLabel={(opt) => opt}
              value={form.country || null}
              onChange={(_, newVal) => onChange("country", newVal || "")}
              loading={tzLoading}
              loadingText="Loading countries…"
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Country"
                  required
                  error={!!errors.country}
                  helperText={errors.country}
                />
              )}
            />

            <Autocomplete
              options={tzOptions}
              getOptionLabel={(tz) => tz}
              value={form.timezone || ""}
              onChange={(_, newVal) => onChange("timezone", newVal || "")}
              loading={tzLoading}
              loadingText="Loading timezones…"
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Timezone"
                  required
                  error={!!errors.timezone}
                />
              )}
            />
          </Box>

          {/* Devices */}
          <Box>
            <Typography component="div" sx={{ mb: 1 }}>Device *</Typography>
            <ToggleButtonGroup value={form.device} exclusive={false} onChange={handleDevices} aria-label="devices">
              {DEVICES.map((d) => (
                <ToggleButton key={d.id} value={d.id} aria-pressed={form.device.includes(d.id)}>
                  {d.label}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
            {!!errors.device && (
              <Typography component="div" variant="caption" color="error">
                {errors.device}
              </Typography>
            )}
          </Box>

          <TextField
            sx={{
              "& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button":
                { WebkitAppearance: "none", margin: 0 },
              "& input[type=number]": { MozAppearance: "textfield" },
            }}
            label="DailyBudget"
            type="number"
            value={form.daily_budget ?? 0}
            onChange={(e) => onChange("daily_budget", Number(e.target.value))}
            required
            InputProps={{
              inputProps: { min: 0, step: 1 },
              endAdornment: (
                <Stack direction="row" spacing={0.5}>
                  <IconButton size="small" onClick={() => stepNum("daily_budget", -1, { min: 0 })}>
                    <RemoveIcon />
                  </IconButton>
                  <IconButton size="small" onClick={() => stepNum("daily_budget", +1)}>
                    <AddIcon />
                  </IconButton>
                </Stack>
              ),
            }}
            fullWidth
          />

          <TextField
            select
            label="CTAButton"
            value={form.cta_button || "Learn more"}
            onChange={(e) => onChange("cta_button", e.target.value)}
            required
            fullWidth
          >
            {CTA_OPTIONS.map((opt) => (
              <MenuItem key={opt} value={opt}>
                {opt}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="CreativeDescription"
            value={form.creative_description || ""}
            onChange={(e) => onChange("creative_description", e.target.value)}
            required
            multiline
            minRows={2}
            fullWidth
          />

          <TextField
            label="Headline1"
            value={form.headline1 || ""}
            onChange={(e) => onChange("headline1", e.target.value)}
            onBlur={() =>
              setErrors((p) => ({
                ...p,
                headline1: form.headline1?.trim() ? "" : "Required",
              }))
            }
            error={!!errors.headline1}
            helperText={errors.headline1}
            required
            fullWidth
          />

          {Array.from({ length: 9 }, (_, i) => i + 2).map((n) => (
            <TextField
              key={n}
              label={`Headline${n}`}
              value={(form as any)[`headline${n}`] || ""}
              onChange={(e) => onChange(`headline${n}` as any, e.target.value)}
              fullWidth
            />
          ))}

          <Button type="submit" variant="contained" disabled={submitting}>
            {submitting ? "Submitting..." : submitLabel}
          </Button>

          {result && (
            <Alert severity={result.ok ? "success" : "error"}>
              {result.msg} {result.id ? ` (id: ${result.id})` : ""}
            </Alert>
          )}
        </Stack>
      </Box>
    </Box>
    <ConfirmBeforeSubmit
      open={confirmOpen}
      onCancel={() => setConfirmOpen(false)}
      onConfirm={() => {
        setConfirmOpen(false);
        doSubmit();   // submit only after user confirms
      }}
    />
    </>
  );
}
