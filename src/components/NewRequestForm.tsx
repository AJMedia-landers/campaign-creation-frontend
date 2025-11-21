"use client";

import { useEffect, useMemo, useState } from "react";
import type { ClipboardEvent } from "react";
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Checkbox,
  InputAdornment,
  CircularProgress,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import FolderIcon from "@mui/icons-material/Folder";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";
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
type FolderItem = { id: string; name: string };
type LanguageOption = { id: string; name: string };

export type NewRequestFormProps = {
  defaultValues?: Partial<CampaignRequestInput & UIExtras>;
  submitLabel?: string;
  onSubmitted?: (res: CampaignCreateResponse) => void;
  title?: string;
  editOf?: number | string;
};

export default function NewRequestForm({
  defaultValues,
  submitLabel = "Create request",
  onSubmitted,
  title = "New Request Form",
  editOf,
}: NewRequestFormProps) {
  const effectiveSubmitLabel = submitLabel ?? (editOf ? "Save changes" : "Create request");
  const router = useRouter();
  
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string; id?: string } | null>(null);

  // Folder selection modal state
  const [folderModalOpen, setFolderModalOpen] = useState(false);
  const [selectedFolders, setSelectedFolders] = useState<string[]>([]);
  const [availableFolders, setAvailableFolders] = useState<FolderItem[]>([]);
  const [loadingFolders, setLoadingFolders] = useState(false);
  const [folderError, setFolderError] = useState<string | null>(null);
  const [driveUrlInput, setDriveUrlInput] = useState("");
  const [showMoreHeadlines, setShowMoreHeadlines] = useState(false);

  // ---- form state
  const [form, setForm] = useState<CampaignRequestInput>({
    campaign_name_post_fix: "",
    client_name: "",
    creatives_folder: "",
    folder_ids: [],
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
    language: "",
    pacing: "off",
    bid_amount: 0,
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

  const handleHeadline1Paste = (
    e: ClipboardEvent<HTMLDivElement>
  ) => {
    const text = e.clipboardData.getData("text");
    if (!text) return;

    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length <= 1) return;

    e.preventDefault();

    setForm((prev) => {
      const next: any = { ...prev };
      lines.slice(0, 10).forEach((line, idx) => {
        const field = `headline${idx + 1}`;
        next[field] = line;
      });
      return next;
    });

    if (lines[0]) {
      setErrors((prev) => ({ ...prev, headline1: "" }));
    }
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
  }, [form.timezone, tzToCountries]);

  // RevContent languages
  const [languages, setLanguages] = useState<LanguageOption[]>([]);
  const [langLoading, setLangLoading] = useState(false);
  const [langError, setLangError] = useState<string | null>(null);

  useEffect(() => {
    let canceled = false;

    (async () => {
      try {
        setLangLoading(true);
        setLangError(null);
        const res = await fetch("/api/campaigns/revcontent/languages");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const payload = await res.json();
        const list = Array.isArray(payload?.data) ? payload.data : payload;
        if (!canceled) {
          setLanguages((list || []) as LanguageOption[]);

          if (!form.language) {
            const defaultLang = list?.find((l: LanguageOption) =>
              l.name.toLowerCase().includes("english")
            );
            if (defaultLang) onChange("language", defaultLang.id);
          }
        }
      } catch {
        if (!canceled) setLangError("Failed to load languages");
      } finally {
        if (!canceled) setLangLoading(false);
      }
    })();

    return () => {
      canceled = true;
    };
  }, []);

  const handlePlatforms = (_: any, vals: string[] | null) => {
    if (Array.isArray(vals)) onChange("ad_platform", vals);
  };
  const handleDevices = (_: any, vals: string[] | null) => {
    if (Array.isArray(vals)) onChange("device", vals);
  };

  const loadFoldersFromDrive = async (driveUrl: string) => {
    if (!driveUrl.trim()) {
      setFolderError("Please enter a Google Drive URL");
      return;
    }

    setLoadingFolders(true);
    setFolderError(null);
    setAvailableFolders([]);

    try {
      const res = await fetch("/api/drive-folders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ driveUrl }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to load folders");
      }

      const folders: FolderItem[] = data.data.folders || [];
      setAvailableFolders(folders);

      if (folders.length === 0) {
        setFolderError("No folders found in the specified Drive location");
      }
    } catch (error) {
      console.error("Error loading folders:", error);
      setFolderError(
        error instanceof Error ? error.message : "Failed to load folders from Google Drive"
      );
    } finally {
      setLoadingFolders(false);
    }
  };

  const handleFolderToggle = (folderId: string) => {
    setSelectedFolders(prev =>
      prev.includes(folderId)
        ? prev.filter(id => id !== folderId)
        : [...prev, folderId]
    );
  };

  const handleSelectAllFolders = () => {
    if (selectedFolders.length === availableFolders.length) {
      setSelectedFolders([]);
    } else {
      setSelectedFolders(availableFolders.map(f => f.id));
    }
  };

  const handleConfirmFolderSelection = () => {
    onChange("folder_ids", selectedFolders);

    setFolderModalOpen(false);
    
    if (selectedFolders.length === 0) {
      setToastMsg("No folders selected - all folders will be used");
      setToastSeverity("info");
    } else if (selectedFolders.length === availableFolders.length) {
      setToastMsg("All folders selected");
      setToastSeverity("success");
    } else {
      const selectedFolderNames = availableFolders
        .filter(folder => selectedFolders.includes(folder.id))
        .map(folder => folder.name)
        .join(", ");
      
      setToastMsg(`${selectedFolders.length} folder${selectedFolders.length !== 1 ? 's' : ''} selected: ${selectedFolderNames}`);
      setToastSeverity("success");
    }
    setToastOpen(true);
  };

  const openFolderModal = () => {
    const currentDriveUrl = form.creatives_folder?.trim();
    
    if (!currentDriveUrl) {
      setToastMsg("Please enter a Google Drive folder URL first");
      setToastSeverity("warning");
      setToastOpen(true);
      return;
    }
    
    setDriveUrlInput(currentDriveUrl);
    setSelectedFolders(form.folder_ids || []);
    setFolderModalOpen(true);
    
    loadFoldersFromDrive(currentDriveUrl);
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
    if (!form.campaign_name_post_fix?.trim()) e.campaign_name_post_fix = "Required";
    if (!form.creatives_folder?.trim()) e.creatives_folder = "Required";
    if (!form.ad_platform?.length) e.ad_platform = "Select at least one platform";
    if (form.ad_platform.includes("Outbrain") && !form.ad_account_id)
      e.ad_account_id = "Select an Outbrain account";
    if (!form.country) e.country = "Required";
    if (!form.timezone) e.timezone = "Required";
    if (!form.device?.length) e.device = "Select at least one device";
    if (!form.headline1?.trim()) e.headline1 = "Required";

    if (form.ad_platform.includes("RevContent")) {
      if (!form.language) e.language = "Required";
      if (!form.pacing) e.pacing = "Required";
      if (form.bid_amount == null || Number(form.bid_amount) <= 0) {
        e.bid_amount = "Required";
      }
    }

    return e;
  };

  // ---- payload
  const buildPayload = (): CampaignRequestInput => {
    const payload: any = {
      ...form,
      timezone: form.timezone,
      campaign_date: date ? date.format("YYYY-MM-DD") : undefined,
    };

    if (form.folder_ids && form.folder_ids.length > 0) {
      payload.folder_ids = form.folder_ids;
    } else {
      delete payload.folder_ids;
    }

    if (!form.ad_platform.includes("Outbrain")) delete payload.ad_account_id;

    if (!form.ad_platform.includes("RevContent")) {
      delete payload.language;
      delete payload.pacing;
      delete payload.bid_amount;
    }

    return payload as CampaignRequestInput;
  };

  // ---- toast
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [toastSeverity, setToastSeverity] = useState<"success" | "error" | "warning" | "info">("error");

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
      console.log("Submitting payload:", payload);
      const url = editOf
        ? `/api/campaigns/requests?id=${editOf}`
        : `/api/campaigns/create`;

      const method = editOf ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
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
      // if (!editOf) {
      //   setTimeout(() => {
      //     router.replace("/");
      //   }, 3000);
      // }
    } catch (err: any) {
      setResult({ ok: false, msg: err.message || "Request failed" });
    } finally {
      setSubmitting(false);
    }
  };


  return (
    <>
    <Box sx={{ maxWidth: 1200, mx: "auto", p: { xs: 2, md: 3 } }}>
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

      <Box
        component="form"
        onSubmit={(e) => {
          e.preventDefault();
          doSubmit();
        }}
      >
        <Stack spacing={2}>
          {/* <TextField
            label="CampaignNickname"
            value={extras.campaign_nickname || ""}
            onChange={(e) => onExtra("campaign_nickname", e.target.value)}
            helperText={errors.campaign_nickname}
            fullWidth
          /> */}
          <Box
            sx={{
              display: "grid",
              gap: 2,
              gridTemplateColumns: { xs: "1fr", md: "0.7fr 1.3fr" },
            }}
          >
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
              label="CampaignNamePostFix"
              value={form.campaign_name_post_fix}
              onChange={(e) => onChange("campaign_name_post_fix", e.target.value)}
              onBlur={() =>
                setErrors((p) => ({
                  ...p,
                  campaign_name_post_fix: form.campaign_name_post_fix?.trim() ? "" : "Required",
                }))
              }
              error={!!errors.campaign_name_post_fix}
              helperText={errors.campaign_name_post_fix}
              required
              fullWidth
            />
          </Box>

          <Box
            sx={{
              display: "grid",
              gap: 2,
              gridTemplateColumns: { xs: "1fr", md: "0.7fr 1.3fr" },
            }}
          >
            {/* CampaignDate */}
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
            {/* Brand Name */}
            <TextField
              label="BrandName"
              value={form.brand_name || ""}
              onChange={(e) => onChange("brand_name", e.target.value)}
              required
              fullWidth
            />
          </Box>

          {/* CreativesFolder with Browse Button */}
          <TextField
            label="CreativesFolder (needs to be shared with ivan.plametiuk@ajmedia.io)"
            placeholder="Paste Google Drive folder URL here..."
            value={form.creatives_folder}
            onChange={(e) => {
              onChange("creatives_folder", e.target.value);
              onChange("folder_ids", []);
            }}
            onBlur={() =>
              setErrors((p) => ({
                ...p,
                creatives_folder: form.creatives_folder?.trim() ? "" : "Required",
              }))
            }
            error={!!errors.creatives_folder}
            helperText={
              errors.creatives_folder || 
              (form.folder_ids && form.folder_ids.length > 0 
                ? `${form.folder_ids.length} specific folder${form.folder_ids.length !== 1 ? 's' : ''} selected` 
                : "All folders will be used")
            }
            required
            fullWidth
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<FolderOpenIcon />}
                    onClick={openFolderModal}
                    disabled={!form.creatives_folder?.trim()}
                  >
                    Browse
                  </Button>
                </InputAdornment>
              ),
            }}
          />
          <Box
            sx={{
              display: "grid",
              gap: 2,
              gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            }}
          >
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
          </Box>

          {/* Hours */}
          <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" } }}>
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

          {/* DailyBudget */}
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
          <Box
            sx={{
              display: "grid",
              gap: 2,
              gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            }}
          >
            {/* CTAButton */}
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

            {/* Description */}
            <TextField
              label="CreativeDescription"
              value={form.creative_description || ""}
              onChange={(e) => onChange("creative_description", e.target.value)}
              required
              multiline
              minRows={1}
              fullWidth
            />
          </Box>

          {/* Outbrain account */}
          {form.ad_platform.includes("Outbrain") && (
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
          )}

          {form.ad_platform.includes("RevContent") && (
            <Box
              sx={{
                display: "grid",
                gap: 2,
                alignItems: "flex-end",
                gridTemplateColumns: { xs: "1fr", md: "0.25fr 0.75fr 1.0fr" },
              }}
            >

              {/* Pacing toggle */}
              <Box>
                <Typography component="div" sx={{ mb: 1 }}>
                  Pacing
                </Typography>
                <ToggleButtonGroup
                  exclusive
                  value={form.pacing || "off"}
                  onChange={(_, val) => val && onChange("pacing", val)}
                  aria-label="pacing"
                >
                  <ToggleButton value="off">Off</ToggleButton>
                  <ToggleButton value="on">On</ToggleButton>
                </ToggleButtonGroup>
                {!!errors.pacing && (
                  <Typography component="div" variant="caption" color="error">
                    {errors.pacing}
                  </Typography>
                )}
              </Box>

              {/* Bid amount */}
              <TextField
                sx={{
                  "& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button":
                    { WebkitAppearance: "none", margin: 0 },
                  "& input[type=number]": { MozAppearance: "textfield" },
                }}
                label="BidAmount (RevContent)"
                type="number"
                value={form.bid_amount ?? 0}
                onChange={(e) => onChange("bid_amount", Number(e.target.value))}
                required
                error={!!errors.bid_amount}
                helperText={errors.bid_amount}
                InputProps={{
                  inputProps: { min: 0, step: 0.01 },
                }}
                fullWidth
              />

              {/* Language selector */}
              <Autocomplete
                options={languages}
                getOptionLabel={(opt) => opt.name}
                value={
                  languages.find((l) => l.id === (form.language as string)) || null
                }
                onChange={(_, val) => onChange("language", val?.id ?? "")}
                loading={langLoading}
                loadingText="Loading languages…"
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Language (RevContent)"
                    placeholder="Search"
                    required
                    error={!!errors.language}
                    helperText={errors.language || langError || ""}
                  />
                )}
              />
            </Box>
          )}

          <TextField
            label="Headline1"
            value={form.headline1 || ""}
            onChange={(e) => onChange("headline1", e.target.value)}
            onPaste={handleHeadline1Paste}
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
          <Button
            size="small"
            variant="text"
            onClick={() => setShowMoreHeadlines((v) => !v)}
            sx={{ alignSelf: "flex-start", mb: showMoreHeadlines ? 0 : 1 }}
          >
            {showMoreHeadlines ? "Hide extra headlines" : "Add more headlines"}
          </Button>

          {showMoreHeadlines && (
            <>
              {Array.from({ length: 9 }, (_, i) => i + 2).map((n) => (
                <TextField
                  key={n}
                  label={`Headline${n}`}
                  value={(form as any)[`headline${n}`] || ""}
                  onChange={(e) => onChange(`headline${n}` as any, e.target.value)}
                  fullWidth
                />
              ))}
            </>
          )}

          <Button type="submit" variant="contained" disabled={submitting}>
            {submitting ? (editOf ? "Saving…" : "Submitting…") : effectiveSubmitLabel}
          </Button>

          {result && (
            <Alert severity={result.ok ? "success" : "error"}>
              {result.msg} {result.id ? ` (id: ${result.id})` : ""}
            </Alert>
          )}
        </Stack>
      </Box>
    </Box>

    {/* Folder Selection Modal */}
    <Dialog
      open={folderModalOpen}
      onClose={() => setFolderModalOpen(false)}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Typography variant="h6" component="span">
          Select Creative Folders
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {driveUrlInput}
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {/* Error Message */}
          {folderError && (
            <Alert severity="error" onClose={() => setFolderError(null)}>
              {folderError}
            </Alert>
          )}

          {/* Loading State */}
          {loadingFolders && (
            <Box display="flex" justifyContent="center" alignItems="center" py={4}>
              <CircularProgress />
              <Typography variant="body2" sx={{ ml: 2 }}>
                Loading folders from Google Drive...
              </Typography>
            </Box>
          )}

          {/* Folder List */}
          {!loadingFolders && availableFolders.length > 0 && (
            <>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" color="text.secondary">
                  {availableFolders.length} folder{availableFolders.length !== 1 ? 's' : ''} found
                </Typography>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={handleSelectAllFolders}
                >
                  {selectedFolders.length === availableFolders.length ? 'Deselect All' : 'Select All'}
                </Button>
              </Box>

              <List sx={{ maxHeight: 400, overflow: 'auto', border: 1, borderColor: 'divider', borderRadius: 1 }}>
                {availableFolders.map((folder) => {
                  const isSelected = selectedFolders.includes(folder.id);
                  return (
                    <ListItem key={folder.id} disablePadding>
                      <ListItemButton onClick={() => handleFolderToggle(folder.id)} dense>
                        <ListItemIcon>
                          <Checkbox
                            edge="start"
                            checked={isSelected}
                            tabIndex={-1}
                            disableRipple
                          />
                        </ListItemIcon>
                        <ListItemIcon>
                          <FolderIcon color={isSelected ? "primary" : "action"} />
                        </ListItemIcon>
                        <ListItemText 
                          primary={folder.name}
                          primaryTypographyProps={{
                            fontWeight: isSelected ? 600 : 400
                          }}
                        />
                      </ListItemButton>
                    </ListItem>
                  );
                })}
              </List>

              {selectedFolders.length > 0 && (
                <Alert severity="info">
                  Selected: {selectedFolders.length} folder{selectedFolders.length !== 1 ? 's' : ''}
                  {selectedFolders.length === availableFolders.length && " (all folders)"}
                </Alert>
              )}

              <Alert severity="info">
                <Typography variant="body2">
                  <strong>Tip:</strong> If you don't select any folders, all folders will be used for campaign creation.
                </Typography>
              </Alert>
            </>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setFolderModalOpen(false)}>Cancel</Button>
        <Button
          onClick={handleConfirmFolderSelection}
          variant="contained"
          disabled={loadingFolders}
        >
          {selectedFolders.length === 0 ? 'Use All Folders' : `Use ${selectedFolders.length} Selected`}
        </Button>
      </DialogActions>
    </Dialog>
    </>
  );
}
