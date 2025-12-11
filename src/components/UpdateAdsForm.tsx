"use client";

import * as React from "react";
import {
  Alert,
  Box,
  Button,
  FormControlLabel,
  MenuItem,
  Paper,
  Snackbar,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";

const CTA_OPTIONS = ["Learn more", "Shop now", "Read more"];
const INITIAL_IDS = 3;
const MAX_HEADLINES = 10;

type PlatformKey = "taboola" | "outbrain" | "revcontent";
type IdState = Record<PlatformKey, string[]>;

const emptyIds: IdState = {
  taboola: Array(INITIAL_IDS).fill(""),
  outbrain: Array(INITIAL_IDS).fill(""),
  revcontent: Array(INITIAL_IDS).fill(""),
};

const friendlyLabel: Record<PlatformKey, string> = {
  taboola: "Taboola",
  outbrain: "Outbrain",
  revcontent: "RevContent",
};

export interface UpdateAdsFormProps {
  title?: string;
  onSubmitted?: (response: any) => void;
  onClose?: () => void;
}

function formatBackendErrors(json: any): string {
  const errs = Array.isArray(json?.errors) ? json.errors : [];
  if (errs.length) {
    return errs
      .map(
        (e: any) =>
          `• ${e?.field ? `${e.field}: ` : ""}${e?.message ?? "Invalid value"}`
      )
      .join("\n");
  }
  return String(json?.error || json?.message || "Validation failed");
}

const UpdateAdsForm: React.FC<UpdateAdsFormProps> = ({
  title = "Update Ads Form",
  onSubmitted,
  onClose,
}) => {
  const [creativesFolder, setCreativesFolder] = React.useState("");
  const [creativeDescription, setCreativeDescription] = React.useState("");
  const [cta, setCta] = React.useState<string>("Learn more");
  const [headlines, setHeadlines] = React.useState<string[]>([""]);

  const [ids, setIds] = React.useState<IdState>(emptyIds);
  const [enabled, setEnabled] = React.useState<Record<PlatformKey, boolean>>({
    taboola: true,
    outbrain: false,
    revcontent: false,
  });

  const [submitting, setSubmitting] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [toastOpen, setToastOpen] = React.useState(false);
  const [toastMsg, setToastMsg] = React.useState("");
  const [toastSeverity, setToastSeverity] =
    React.useState<"success" | "error" | "warning" | "info">("info");

  const handleIdChange = (
    platform: PlatformKey,
    index: number,
    value: string
  ) => {
    setIds((prev) => {
      const next = { ...prev };
      const arr = [...next[platform]];
      arr[index] = value;
      next[platform] = arr;
      return next;
    });
  };

  const handleAddIdField = (platform: PlatformKey) => {
    setIds((prev) => ({
      ...prev,
      [platform]: [...prev[platform], ""],
    }));
  };

  const togglePlatform = (platform: PlatformKey) => {
    setEnabled((prev) => ({ ...prev, [platform]: !prev[platform] }));
  };

  const normalizeIds = (platform: PlatformKey): string[] => {
    if (!enabled[platform]) return [];
    return ids[platform].map((v) => v.trim()).filter(Boolean);
  };

  const validate = () => {
    const e: Record<string, string> = {};

    if (!creativesFolder.trim()) {
      e.creativesFolder = "Creatives folder is required";
    }
    if (!creativeDescription.trim()) {
      e.creativeDescription = "Creative description is required";
    }

    const trimmedHeadlines = headlines
      .map((h) => h.trim())
      .filter((h) => h.length > 0);
    if (trimmedHeadlines.length === 0) {
      e.headlines = "At least one headline is required";
    }

    const taboolaIds = normalizeIds("taboola");
    const outbrainIds = normalizeIds("outbrain");
    const revcontentIds = normalizeIds("revcontent");

    if (
      taboolaIds.length === 0 &&
      outbrainIds.length === 0 &&
      revcontentIds.length === 0
    ) {
      e.platformIds =
        "Add at least one campaign ID for Taboola, Outbrain or RevContent";
    }

    return {
      e,
      taboolaIds,
      outbrainIds,
      revcontentIds,
      trimmedHeadlines,
    };
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setErrors({});
    setToastOpen(false);

    const {
      e,
      taboolaIds,
      outbrainIds,
      revcontentIds,
      trimmedHeadlines,
    } = validate();

    if (Object.keys(e).length) {
      setErrors(e);
      setToastMsg("Please fix validation errors and try again.");
      setToastSeverity("error");
      setToastOpen(true);
      return;
    }

    const payload: any = {
      creatives_folder: creativesFolder.trim(),
      creative_description: creativeDescription.trim(),
      cta_button: cta,
      headlines: trimmedHeadlines,
    };

    if (taboolaIds.length) payload.taboola_campaign_ids = taboolaIds;
    if (outbrainIds.length) payload.outbrain_campaign_ids = outbrainIds;
    if (revcontentIds.length) payload.revcontent_campaign_ids = revcontentIds;

    try {
      setSubmitting(true);

      const res = await fetch("/api/campaigns/update-ads/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      let json: any = {};
      try {
        json = text ? JSON.parse(text) : {};
      } catch {
        json = {};
      }

      if (!res.ok || json?.success === false) {
        const msg = formatBackendErrors(json);
        setToastMsg(msg);
        setToastSeverity("error");
        setToastOpen(true);
        return;
      }

      setToastMsg(
        json?.message || "Ad update request created successfully."
      );
      setToastSeverity("success");
      setToastOpen(true);
      onSubmitted?.(json);

      if (onClose) onClose();
    } catch (err: any) {
      setToastMsg(err?.message || "Request failed");
      setToastSeverity("error");
      setToastOpen(true);
    } finally {
      setSubmitting(false);
    }
  };

  const renderPlatformBlock = (platform: PlatformKey) => {
    const enabledPlatform = enabled[platform];
    const platformIds = ids[platform];

    return (
      <Paper
        key={platform}
        variant="outlined"
        sx={{
          p: 2,
          flex: 1,
          minWidth: { xs: "100%", md: 0 },
          opacity: enabledPlatform ? 1 : 0.55,
          borderStyle: enabledPlatform ? "solid" : "dashed",
        }}
      >
        <Stack spacing={1.5}>
          <FormControlLabel
            control={
              <Switch
                checked={enabledPlatform}
                onChange={() => togglePlatform(platform)}
              />
            }
            label={friendlyLabel[platform]}
          />

          <Typography variant="body2" color="text.secondary">
            Add campaign IDs for {friendlyLabel[platform]}. You can add more
            inputs if needed.
          </Typography>

          <Stack spacing={1.5}>
            {platformIds.map((value, index) => (
              <TextField
                key={index}
                size="small"
                label={`${friendlyLabel[platform]} ID ${index + 1}`}
                placeholder="e.g. 123456789"
                value={value}
                onChange={(e) =>
                  handleIdChange(platform, index, e.target.value)
                }
                disabled={!enabledPlatform}
                fullWidth
              />
            ))}
          </Stack>

          <Button
            size="small"
            variant="text"
            onClick={() => handleAddIdField(platform)}
            disabled={!enabledPlatform}
            sx={{ alignSelf: "flex-start" }}
          >
            Add ID
          </Button>
        </Stack>
      </Paper>
    );
  };

  return (
    <>
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

      {title && (
        <Typography variant="h4" sx={{ mb: 2 }}>
          {title}
        </Typography>
      )}

      <Box component="form" onSubmit={handleSubmit}>
        {/* Platform IDs */}
        <Stack spacing={2} sx={{ mb: 2 }}>
          <Typography variant="h6">Campaign IDs by platform</Typography>
          {errors.platformIds && (
            <Alert severity="error">{errors.platformIds}</Alert>
          )}

          <Stack
            spacing={2}
            direction={{ xs: "column", md: "row" }}
            alignItems="stretch"
          >
            {(["taboola", "outbrain", "revcontent"] as PlatformKey[]).map(
              (p) => renderPlatformBlock(p)
            )}
          </Stack>
        </Stack>

        <Stack spacing={3}>
          <TextField
            label="Creatives folder (Google Drive URL)"
            value={creativesFolder}
            onChange={(e) => setCreativesFolder(e.target.value)}
            error={!!errors.creativesFolder}
            helperText={errors.creativesFolder}
            fullWidth
            required
          />

          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              label="Creative description"
              multiline
              minRows={1}
              value={creativeDescription}
              onChange={(e) => setCreativeDescription(e.target.value)}
              error={!!errors.creativeDescription}
              helperText={errors.creativeDescription}
              fullWidth
              required
            />
            <TextField
              select
              label="CTA button"
              value={cta}
              onChange={(e) => setCta(e.target.value)}
              fullWidth
            >
              {CTA_OPTIONS.map((opt) => (
                <MenuItem key={opt} value={opt}>
                  {opt}
                </MenuItem>
              ))}
            </TextField>
          </Stack>

          <Stack spacing={1.5}>
            {headlines.map((value, index) => (
              <TextField
                key={index}
                label={index === 0 ? "Headline" : `Headline ${index + 1}`}
                value={value}
                onChange={(e) => {
                  const v = e.target.value;
                  setHeadlines((prev) => {
                    const next = [...prev];
                    next[index] = v;
                    return next;
                  });
                }}
                error={index === 0 && !!errors.headlines}
                helperText={index === 0 ? errors.headlines : ""}
                fullWidth
                required={index === 0}
              />
            ))}

            <Button
              size="small"
              variant="text"
              onClick={() =>
                setHeadlines((prev) =>
                  prev.length < MAX_HEADLINES ? [...prev, ""] : prev
                )
              }
              disabled={headlines.length >= MAX_HEADLINES}
              sx={{ alignSelf: "flex-start" }}
            >
              Add headline
            </Button>
          </Stack>

          <Box>
            <Button type="submit" variant="contained" disabled={submitting}>
              {submitting ? "Submitting…" : "Submit"}
            </Button>
          </Box>
        </Stack>
      </Box>
    </>
  );
};

export default UpdateAdsForm;
