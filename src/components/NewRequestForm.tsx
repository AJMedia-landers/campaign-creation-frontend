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
import {
  getAllCountries,
  getTimezonesByCountry,
  pickDefaultTimezone,
  CountryOption,
  flagEmoji,
  tzToGmtLabel,
} from "@/lib/geo";

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

type ObAccount = { id: string; name: string };

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
  const [result, setResult] = useState<{
    ok: boolean;
    msg: string;
    id?: string;
  } | null>(null);

  // ---- form state
  const [form, setForm] = useState<CampaignRequestInput>({
    campaign_type: "",
    client_name: "",
    creatives_folder: "",
    ad_platform: [],
    ad_account_id: "",
    brand_name: "",
    timezone: "UTC",
    country: "US",
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

  // ---- countries / timezones
  const countries = useMemo<CountryOption[]>(() => getAllCountries(), []);
  const [countryTimezones, setCountryTimezones] = useState<string[]>(["GMT"]);

  useEffect(() => {
    const tzs = getTimezonesByCountry(form.country || "US");
    setCountryTimezones(tzs);
    if (!tzs.includes(form.timezone)) {
      onChange("timezone", pickDefaultTimezone(form.country || "US", tzs));
    }
  }, [form.country]);

  // Clear Outbrain account when Outbrain is not selected
  useEffect(() => {
    if (!form.ad_platform.includes("Outbrain") && form.ad_account_id) {
      onChange("ad_account_id", "");
    }
  }, [form.ad_platform]);

  // ---- Outbrain accounts (GET from mock API)
  const [obAccounts, setObAccounts] = useState<ObAccount[]>([]);
  const [accLoading, setAccLoading] = useState(false);
  const [accError, setAccError] = useState<string | null>(null);

  useEffect(() => {
    let canceled = false;
    (async () => {
      try {
        setAccLoading(true);
        setAccError(null);

        // GET /api/ad-accounts
        const res = await fetch("/api/ad-accounts", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: ObAccount[] = await res.json();

        if (!canceled) setObAccounts(Array.isArray(data) ? data : []);
      } catch (e: any) {
        if (!canceled) setAccError("Failed to load Outbrain accounts");
      } finally {
        if (!canceled) setAccLoading(false);
      }
    })();
    return () => {
      canceled = true;
    };
  }, []);

  // ---- toggle handlers
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

  // ---- payload builder
  const buildPayload = (): CampaignRequestInput => {
    const payload: any = {
      ...form,
      timezone: tzToGmtLabel(form.timezone),
      campaign_date: date ? date.format("YYYY-MM-DD") : undefined,
    };

    // If Outbrain isn't selected, don't send ad_account_id
    if (!form.ad_platform.includes("Outbrain")) {
      delete payload.ad_account_id;
    }

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
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResult(null);
    const eMap = validate();
    if (Object.keys(eMap).length) {
      setErrors(eMap);
      return;
    }

    setSubmitting(true);
    try {
      const payload = buildPayload();
      console.log("REQUEST PAYLOAD →", payload);
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

  return (
    <Box sx={{ maxWidth: 900, mx: "auto", p: { xs: 2, md: 3 } }}>
      {title && (
        <Typography variant="h4" sx={{ mb: 2 }}>
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


      <Box component="form" onSubmit={onSubmit}>
        <Stack spacing={2}>
          {/* <TextField
            label="CampaignNickname"
            value={extras.campaign_nickname || ""}
            onChange={(e) => onExtra("campaign_nickname", e.target.value)}
            helperText={errors.campaign_nickname}
            fullWidth
          /> */}

          <TextField
            label="ClientName"
            value={form.client_name || ""}
            onChange={(e) => onChange("client_name", e.target.value)}
            onBlur={() =>
              setErrors((p) => ({
                ...p,
                client_name: form.client_name?.trim() ? "" : "Required",
              }))
            }
            error={!!errors.client_name}
            helperText={errors.client_name}
            required
            fullWidth
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
            <Typography sx={{ mb: 1 }}>AdPlatform *</Typography>
            <ToggleButtonGroup
              value={form.ad_platform}
              exclusive={false}
              onChange={handlePlatforms}
              color="primary"
              aria-label="ad-platforms"
            >
              {PLATFORMS.map((p) => (
                <ToggleButton
                  key={p.id}
                  value={p.id}
                  aria-pressed={form.ad_platform.includes(p.id)}
                >
                  {p.label}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
            {!!errors.ad_platform && (
              <Typography variant="caption" color="error">
                {errors.ad_platform}
              </Typography>
            )}
          </Box>

          {/* Outbrain account */}
          <Autocomplete
            options={obAccounts}
            getOptionLabel={(opt) => opt.name}
            value={obAccounts.find((a) => a.id === form.ad_account_id) || null}
            onChange={(_, val) => onChange("ad_account_id", val?.id ?? "")}
            isOptionEqualToValue={(o, v) => o.id === v.id}
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
          <Box
            sx={{
              display: "grid",
              gap: 2,
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
            }}
          >
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
                    <IconButton
                      size="small"
                      onClick={() => stepNum("hours_start", -1, { min: 0 })}
                    >
                      <RemoveIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => stepNum("hours_start", +1, { max: 23 })}
                    >
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
                    <IconButton
                      size="small"
                      onClick={() => stepNum("hours_end", -1, { min: 0 })}
                    >
                      <RemoveIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => stepNum("hours_end", +1, { max: 23 })}
                    >
                      <AddIcon />
                    </IconButton>
                  </Stack>
                ),
              }}
              fullWidth
            />
          </Box>

          {/* Country / Timezone */}
          <Box
            sx={{
              display: "grid",
              gap: 2,
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
            }}
          >
            <Autocomplete
              options={countries}
              getOptionLabel={(opt) => `${flagEmoji(opt.code)} ${opt.name}`}
              value={countries.find((c) => c.code === form.country) || null}
              onChange={(_, newVal) => onChange("country", newVal?.code || "")}
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
              options={countryTimezones}
              getOptionLabel={(tz) => tz}
              value={form.timezone || ""}
              onChange={(_, newVal) => onChange("timezone", newVal || "")}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Timezone"
                  required
                  error={!!errors.timezone}
                  helperText={`Will send: ${tzToGmtLabel(form.timezone || "UTC")}`}
                />
              )}
            />
          </Box>

          {/* Devices */}
          <Box>
            <Typography sx={{ mb: 1 }}>Device *</Typography>
            <ToggleButtonGroup
              value={form.device}
              exclusive={false}
              onChange={handleDevices}
              aria-label="devices"
            >
              {DEVICES.map((d) => (
                <ToggleButton
                  key={d.id}
                  value={d.id}
                  aria-pressed={form.device.includes(d.id)}
                >
                  {d.label}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
            {!!errors.device && (
              <Typography variant="caption" color="error">
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
                  <IconButton
                    size="small"
                    onClick={() => stepNum("daily_budget", -1, { min: 0 })}
                  >
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
  );
}
