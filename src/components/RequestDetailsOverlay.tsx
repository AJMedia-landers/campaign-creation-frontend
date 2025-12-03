"use client";
import * as React from "react";
import {
  AppBar, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Divider, Drawer, IconButton,
  Stack, Toolbar, Typography, CircularProgress
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import OpenInFullIcon from "@mui/icons-material/OpenInFull";
import CloseFullscreenIcon from "@mui/icons-material/CloseFullscreen";
import { RequestItem } from "@/types/campaign";
import { buildRequestTitle } from "@/lib/requestTitle";
import { campaignStatusColor } from "@/lib/statusColor";

type Props = {
  open: boolean;
  onClose: () => void;
  data: RequestItem | null;

  onDeleteAll?: (req: RequestItem) => void;
  onRecreate?: (req: RequestItem) => void;
  onOpenCampaign?: (row: any) => void;

  onEditRequest?: (req: RequestItem) => void;
  onOpenInline?: (req: RequestItem) => void;
  onCreateAdditionalAds?: (req: RequestItem) => void;
  createAdditionalAdsLoading?: boolean;
  recreateLoading?: boolean;
};

export default function RequestDetailsOverlay({
  open, onClose, data, onDeleteAll, onRecreate, onOpenCampaign, onEditRequest, onOpenInline, onCreateAdditionalAds, createAdditionalAdsLoading, recreateLoading 
}: Props) {
  const [expanded, setExpanded] = React.useState(false);
  React.useEffect(() => { if (!open) setExpanded(false); }, [open]);
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  const HeaderBar = (
    <>
      <Toolbar sx={{ px: 2, flexDirection: "column", alignItems: "flex-start", gap: "10px"}}>
        <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between" width="100%">
          <Stack direction="row" spacing={1}>
            {data && (
              <>
                <Button
                  size="small"
                  variant="contained"
                  onClick={() => onEditRequest?.(data)}
                >
                  Edit
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  onClick={() => setConfirmOpen(true)}
                  disabled={recreateLoading}
                >
                  Recreate campaigns
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => onCreateAdditionalAds?.(data)}
                  disabled={createAdditionalAdsLoading}
                  startIcon={
                    createAdditionalAdsLoading ? (
                      <CircularProgress size={14} />
                    ) : undefined
                  }
                >
                  Create additional ads
                </Button>
              </>

            )}
          </Stack>

          {/* <Button
            size="small"
            color="error"
            variant="outlined"
            onClick={() => data && onDeleteAll?.(data)}
          >
            Delete all
          </Button>
          */}

          <Stack direction="row" spacing={1}>
            <IconButton
              aria-label={expanded ? "shrink" : "expand"}
              onClick={() => setExpanded((v) => !v)}
            >
              {expanded ? <CloseFullscreenIcon /> : <OpenInFullIcon />}
            </IconButton>

            <IconButton onClick={onClose} aria-label="close">
              <CloseIcon />
            </IconButton>
          </Stack>

        </Stack>
        <Typography sx={{ flex: 1, maxWidth: "100%" }} variant="h6" noWrap>
          {buildRequestTitle(data)}
        </Typography>
      </Toolbar>

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Recreate campaigns?</DialogTitle>
        <DialogContent>
          <Typography sx={{ mt: 0.5 }}>
            <strong>Have you updated your campaign request?</strong>
            <br />
            If you don&apos;t, the same campaigns will be created as before.
            Please double-check.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)} variant="outlined">
            Cancel
          </Button>
          <Button
            onClick={() => {
              setConfirmOpen(false);
              if (data) onRecreate?.(data);
            }}
            variant="contained"
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );

  const Body = (
    <Box sx={{ p: 2 }}>
      {/* meta */}
      <Stack direction="row" spacing={2} useFlexGap flexWrap="wrap" flexDirection="column" sx={{ mb: 2 }}>
        <Meta label="Status" value={<Chip size="small" label={data?.status ?? "—"} />} />
        <Meta label="Requested" value={data?.request_date ?? "—"} />
        <Meta label="Campaign Date" value={data?.campaign_date ?? "—"} />
        <Meta
          label="Platform"
          value={
            Array.isArray(data?.ad_platform)
              ? data?.ad_platform.join(", ")
              : (data?.ad_platform ?? "—")
          }
        />
        <Meta label="Ad Account" value={data?.ad_account_id ?? "—"} />
        <Meta label="Country" value={data?.country ?? "—"} />
        <Meta
          label="Device"
          value={
            Array.isArray(data?.device)
              ? data?.device.join(", ")
              : (data?.device ?? "—")
          }
        />
        <Meta label="Timezone" value={data?.timezone ?? "—"} />
        <Meta label="Daily Budget" value={data?.daily_budget ?? "—"} />
      </Stack>

      <Divider sx={{ my: 2 }} />

      <Typography component="div" variant="subtitle1" sx={{ mb: 1 }}>Campaigns</Typography>
      {data && (
        <Button
          size="small"
          variant="outlined"
          sx={{ mb: 1.5 }}
          onClick={() => onOpenInline?.(data)}
        >
          Expand campaigns
        </Button>
      )}
      <Stack spacing={1.25}>
        {(data?.campaigns ?? []).map((c: any, i: number) => (
          <Box
            key={c?.id ?? i}
            onClick={() => onOpenCampaign?.(c)}
            sx={{
              p: 1.25, borderRadius: 1.2, border: 1, borderColor: "divider",
              bgcolor: "background.default", cursor: "pointer",
              "&:hover": { bgcolor: "action.hover" },
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 600, mb: .25 }} noWrap>
              {c?.campaign_name ?? "—"}
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center" useFlexGap flexWrap="wrap">
              <Chip
                size="small"
                label={
                  /error/i.test(String(c?.campaign_status ?? ""))
                    ? (c?.error_message ?? "Error")
                    : (c?.campaign_status ?? "—")
                }
                color={
                  /error/i.test(String(c?.campaign_status ?? ""))
                    ? "error"
                    : campaignStatusColor(String(c?.campaign_status ?? ""))
                }
              />
              <Tiny label="ID" value={c?.campaign_id ?? "—"} />
              <Tiny label="Country" value={c?.country ?? "—"} />
              <Tiny label="Built" value={c?.built_time ?? c?.created_at ?? "—"} />
            </Stack>
          </Box>
        ))}
        {(data?.campaigns?.length ?? 0) === 0 && (
          <Typography variant="body2" color="text.secondary">No campaigns found.</Typography>
        )}
      </Stack>

      {(createAdditionalAdsLoading || recreateLoading) && (
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            bgcolor: "rgba(255,255,255,0.65)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
          }}
        >
          <CircularProgress />
        </Box>
      )}
    </Box>
  );

  if (expanded) {
    return (
      <Dialog fullScreen open={open} onClose={onClose}>
        <AppBar color="default" elevation={0} sx={{ position: "relative" }}>
          {HeaderBar}
        </AppBar>
        {Body}
      </Dialog>
    );
  }

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: { xs: "92vw", sm: 620 } } }}
    >
      <Box sx={{ pt: 1 }}>
        {HeaderBar}
        {Body}
      </Box>
    </Drawer>
  );
}

function Meta({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Stack direction="row" spacing={1} alignItems="center">
      <Typography component="span" variant="body2" color="text.secondary">{label}:</Typography>
      <Typography component="span" variant="body2">{value}</Typography>
    </Stack>
  );
}
function Tiny({ label, value }: { label: string; value: React.ReactNode }) {
  return <Chip size="small" variant="outlined" label={`${label}: ${value}`} />;
}
