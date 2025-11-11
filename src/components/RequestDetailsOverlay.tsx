"use client";
import * as React from "react";
import {
  AppBar, Box, Button, Chip, Dialog, Divider, Drawer, IconButton,
  Stack, Toolbar, Typography
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import OpenInFullIcon from "@mui/icons-material/OpenInFull";
import CloseFullscreenIcon from "@mui/icons-material/CloseFullscreen";
import { RequestItem } from "@/types/campaign";

type Props = {
  open: boolean;
  onClose: () => void;
  data: RequestItem | null;

  onDeleteAll?: (req: RequestItem) => void;
  onRecreate?: (req: RequestItem) => void;
  onOpenCampaign?: (row: any) => void;
};

export default function RequestDetailsOverlay({
  open, onClose, data, onDeleteAll, onRecreate, onOpenCampaign,
}: Props) {
  const [expanded, setExpanded] = React.useState(false);
  React.useEffect(() => { if (!open) setExpanded(false); }, [open]);

  const HeaderBar = (
    <Toolbar sx={{ px: 2 }}>
      <Typography sx={{ flex: 1 }} variant="h6" noWrap>
        Request details
      </Typography>

      <Stack direction="row" spacing={1} alignItems="center">
        <Button
          size="small"
          color="error"
          variant="outlined"
          onClick={() => data && onDeleteAll?.(data)}
        >
          Delete all
        </Button>
        <Button
          size="small"
          variant="contained"
          onClick={() => data && onRecreate?.(data)}
        >
          Recreate campaigns
        </Button>

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
    </Toolbar>
  );

  const Body = (
    <Box sx={{ p: 2 }}>
      {/* meta */}
      <Stack direction="row" spacing={2} useFlexGap flexWrap="wrap" sx={{ mb: 2 }}>
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
        <Meta label="Device" value={data?.device ?? "—"} />
        <Meta label="Timezone" value={data?.timezone ?? "—"} />
        <Meta label="Daily Budget" value={data?.daily_budget ?? "—"} />
      </Stack>

      <Divider sx={{ my: 2 }} />

      <Typography component="div" variant="subtitle1" sx={{ mb: 1 }}>Campaigns</Typography>
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
                  /error/i.test(String(c?.campaign_status ?? "")) ? "error" :
                  /completed|created|done|success|ok|ready/i.test(String(c?.campaign_status ?? "")) ? "success" :
                  /processing|running|sent|pending|progress|building/i.test(String(c?.campaign_status ?? "")) ? "warning" :
                  "default"
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
      PaperProps={{ sx: { width: { xs: "92vw", sm: 520 } } }}
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
