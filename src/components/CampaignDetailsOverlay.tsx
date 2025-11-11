"use client";
import * as React from "react";
import {
  AppBar, Box, Button, Chip, Dialog, Drawer, IconButton,
  Stack, Toolbar, Typography
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import OpenInFullIcon from "@mui/icons-material/OpenInFull";
import CloseFullscreenIcon from "@mui/icons-material/CloseFullscreen";

type Props = {
  open: boolean;
  onClose: () => void;
  data: any;
  onEdit?: (c: any) => void;
  onDelete?: (c: any) => void;
};

export default function CampaignDetailsOverlay({
  open, onClose, data, onEdit, onDelete,
}: Props) {
  const [expanded, setExpanded] = React.useState(false);
  React.useEffect(() => { if (!open) setExpanded(false); }, [open]);

  const c = data || {};
  const status = String(c?.campaign_status ?? "");
  const isErr = /error/i.test(status);
  const color =
    isErr ? "error" :
    /completed|created|done|success|ok|ready/i.test(status) ? "success" :
    /processing|running|sent|pending|progress|building/i.test(status) ? "warning" :
    "default";

  const HIDDEN_FIELDS = React.useMemo(() => new Set(["id", "request_id"]), []);
  const visibleEntries = React.useMemo(
    () => Object.entries(c as Record<string, unknown>).filter(([k]) => !HIDDEN_FIELDS.has(k)),
    [c, HIDDEN_FIELDS]
  );

  const HeaderBar = (
    <Toolbar sx={{ px: 2 }}>
      <Typography sx={{ flex: 1 }} variant="h6" noWrap>
        {c?.campaign_name ?? "Campaign details"}
      </Typography>

      <Stack direction="row" spacing={1}>
        {/* <Button variant="outlined" onClick={() => onEdit?.(c)}>Edit this</Button>
        <Button color="error" variant="contained" onClick={() => onDelete?.(c)}>Delete</Button> */}

        <IconButton onClick={() => setExpanded((v) => !v)}>
          {expanded ? <CloseFullscreenIcon /> : <OpenInFullIcon />}
        </IconButton>

        <IconButton onClick={onClose}><CloseIcon /></IconButton>
      </Stack>
    </Toolbar>
  );

  const Body = (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" spacing={1} alignItems="center" useFlexGap flexWrap="wrap" sx={{ mb: 2 }}>
        <Chip size="small" color={color as any} label={isErr ? (c?.error_message ?? "Error") : (status || "—")} />
        {c?.country && <Chip size="small" variant="outlined" label={`Country: ${c.country}`} />}
        {c?.device && <Chip size="small" variant="outlined" label={`Device: ${c.device}`} />}
      </Stack>

      <Stack spacing={1.25}>
        {visibleEntries.map(([k, v]) => (
          <Stack
            key={k}
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ p: 1, border: 1, borderColor: "divider", borderRadius: 1 }}
          >
            <Typography variant="body2" color="text.secondary" sx={{ pr: 2 }}>
              {k}
            </Typography>
            <Typography
              variant="body2"
              sx={{ ml: 2, textAlign: "right", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
              title={String(v ?? "—")}
            >
              {String(v ?? "—")}
            </Typography>
          </Stack>
        ))}
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
