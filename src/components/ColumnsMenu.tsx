// src/components/ColumnsMenu.tsx
"use client";
import * as React from "react";
import {
  Box,
  Button,
  Checkbox,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  SxProps,
  Tooltip,
  Typography,
} from "@mui/material";
import ViewColumnIcon from "@mui/icons-material/ViewColumn";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import HideSourceIcon from "@mui/icons-material/HideSource";
import RestoreIcon from "@mui/icons-material/Restore";

type Props = {
  allColumns: string[];
  /** currently visible columns (controlled) */
  visible: string[];
  /** defaults used by "Reset" */
  defaultVisible: string[];
  /** update visible columns */
  onChange: (cols: string[]) => void;
  /** optional localStorage key to persist user choice (page already does it, but safe to support) */
  storageKey?: string;
  /** optional styles when placing at top of page */
  sx?: SxProps;
  /** optional label for the button */
  label?: string;
};

export default function ColumnsMenu({
  allColumns,
  visible,
  defaultVisible,
  onChange,
  storageKey,
  sx,
  label = "Columns",
}: Props) {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleOpen = (e: React.MouseEvent<HTMLElement>) => setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);

  // keep visible list valid vs. allColumns
  React.useEffect(() => {
    const cleaned = visible.filter((k) => allColumns.includes(k));
    if (cleaned.length !== visible.length) onChange(cleaned.length ? cleaned : defaultVisible);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allColumns]);

  // optional persistence (page already persists globally; this is harmless)
  React.useEffect(() => {
    if (!storageKey) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(visible));
    } catch {}
  }, [storageKey, visible]);

  const isChecked = React.useCallback((k: string) => visible.includes(k), [visible]);

  const toggle = (k: string) => {
    if (isChecked(k)) onChange(visible.filter((x) => x !== k));
    else onChange([...visible, k]);
  };
  const showAll = () => onChange(allColumns.slice());
  const hideAll = () => onChange([]);
  const reset = () => onChange(defaultVisible.slice());
  const ariaLabel = 'Columns';

  return (
    <Box sx={{ display: "flex", alignItems: "center", ...sx }}>
      <Tooltip title={`${label} (${visible.length}/${allColumns.length})`}>
        <Button
          size="small"
          variant="outlined"
          aria-label={ariaLabel}
          startIcon={<ViewColumnIcon />}
          onClick={handleOpen}
        >
          {label}
        </Button>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        slotProps={{ paper: { sx: { minWidth: 280, maxHeight: 420 } } }}
        onClick={(e) => e.stopPropagation()}
      >
        <Box
          sx={{
            position: "sticky",
            top: 0,
            zIndex: 1,
            bgcolor: "background.paper",
            borderBottom: 1,
            borderColor: "divider",
          }}
        >
          <MenuItem onClick={showAll} dense>
            <ListItemIcon><DoneAllIcon fontSize="small" /></ListItemIcon>
            <ListItemText
              primary="Show all"
              secondary={`${allColumns.length} columns`}
            />
          </MenuItem>
          <MenuItem onClick={hideAll} dense>
            <ListItemIcon><HideSourceIcon fontSize="small" /></ListItemIcon>
            <ListItemText primary="Hide all" />
          </MenuItem>
          <MenuItem onClick={reset} dense>
            <ListItemIcon><RestoreIcon fontSize="small" /></ListItemIcon>
            <ListItemText
              primary="Reset to defaults"
              secondary={`${defaultVisible.length} columns`}
            />
          </MenuItem>

          <Box sx={{ px: 2, py: 1, color: "text.secondary" }}>
            <Typography variant="caption">
              Toggle columns ({visible.length}/{allColumns.length})
            </Typography>
          </Box>
        </Box>

        {allColumns.map((k) => (
          <MenuItem key={k} onClick={() => toggle(k)} dense>
            <Checkbox edge="start" checked={isChecked(k)} />
            <ListItemText primary={k} />
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
}
