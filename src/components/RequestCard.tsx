"use client";
import React from "react";
import {
  Box,
  Card,
  CardHeader,
  CardContent,
  Chip,
  Stack,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Tooltip,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Checkbox,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import ViewColumnIcon from "@mui/icons-material/ViewColumn";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import HideSourceIcon from "@mui/icons-material/HideSource";
import RestoreIcon from "@mui/icons-material/Restore";
import { RequestItem } from "@/types/campaign";
import { buildRequestTitle } from "@/lib/requestTitle";

const isUrl = (v: unknown) => typeof v === "string" && /^https?:\/\//i.test(v);

interface RequestCardProps {
  req: RequestItem;
  onOpenRequest: (r: RequestItem) => void;
  onOpenCampaign: (row: any) => void;
  visibleCols?: string[];
}

export default function RequestCard({ req, onOpenRequest, onOpenCampaign, visibleCols: externalVisible }: RequestCardProps) {
  const allColumns = React.useMemo(() => {
    const set = new Set<string>();
    for (const row of req.campaigns ?? []) {
      if (row && typeof row === "object") Object.keys(row).forEach((k) => set.add(k));
    }
    const preferred = [
      "campaign_name",
      "campaign_status",
      "campaign_id",
      "tracking_link",
      "creative_sub_folder",
      "creatives_folder",
      "sub_folder_type",
      "ad_platform",
      "ad_account_id",
      "country",
      "device",
      "built_time",
      "created_at",
      "updated_at",
      "request_id",
      "requester",
      "error_message",
    ];
    const rest = [...set].filter((k) => !preferred.includes(k)).sort();
    return [...preferred.filter((k) => set.has(k)), ...rest];
  }, [req.campaigns]);

  const storageKey = React.useMemo(() => `req:${req.id}:visibleCols`, [req.id]);

  const defaultVisible = React.useMemo<string[]>(
    () =>
      allColumns.filter((k) =>
        [
          "campaign_name",
          "campaign_status",
          "campaign_id",
          "tracking_link",
          "creative_sub_folder",
          "creatives_folder",
          "sub_folder_type",
          "built_time",
        ].includes(k)
      ),
    [allColumns]
  );

  const [visibleCols, setVisibleCols] = React.useState<string[]>(defaultVisible);

  // load / persist
  React.useEffect(() => {
    if (externalVisible) return;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const arr: string[] = JSON.parse(raw);
        const cleaned = arr.filter((k) => allColumns.includes(k));
        if (cleaned.length) setVisibleCols(cleaned);
      }
    } catch {}
  }, [storageKey, allColumns, externalVisible]);

  React.useEffect(() => {
    if (externalVisible) return;
    localStorage.setItem(storageKey, JSON.stringify(visibleCols));
  }, [storageKey, visibleCols, externalVisible]);

  const useCols = externalVisible ?? visibleCols;
  const isVisible = React.useCallback((k: string) => useCols.includes(k), [useCols]);
  const columns = React.useMemo(
    () => allColumns.filter((k) => isVisible(k)),
    [allColumns, isVisible]
  );

  const toggleCol = (k: string) =>
    externalVisible ? undefined : setVisibleCols((prev) => (prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k]));
  const showAll = () => externalVisible ? undefined : setVisibleCols(allColumns);
  const hideAll = () => externalVisible ? undefined : setVisibleCols([]);
  const resetCols = () => externalVisible ? undefined : setVisibleCols(defaultVisible);

  /** Column widths */
  const [colW, setColW] = React.useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    for (const key of allColumns) {
      if (key === "creative_sub_folder" || key === "creatives_folder") {
        initial[key] = 96; // icon-only
      } else if (key === "sub_folder_type") {
        initial[key] = 120; // short word
      } else if (key === "tracking_link") {
        initial[key] = 260;
      } else if (key === "campaign_status") {
        initial[key] = 160; // pill fits
      } else {
        initial[key] =
          /name|description|headline/i.test(key) ? 300 :
          /status|country|device|timezone/i.test(key) ? 140 :
          200;
      }
    }
    return initial;
  });

  React.useEffect(() => {
    setColW((prev) => {
      const next: Record<string, number> = { ...prev };
      for (const key of allColumns) {
        if (next[key] == null) {
          next[key] =
            key === "creative_sub_folder" || key === "creatives_folder" ? 96 :
            key === "sub_folder_type" ? 120 :
            key === "tracking_link" ? 260 :
            key === "campaign_status" ? 160 :
            200;
        }
      }
      Object.keys(next).forEach((k) => !allColumns.includes(k) && delete next[k]);
      return next;
    });
  }, [allColumns]);

  // resize
  const dragRef = React.useRef<{ key: string; startX: number; startW: number } | null>(null);

  const onMouseMove = React.useCallback((e: MouseEvent) => {
    if (!dragRef.current) return;
    const { key, startX, startW } = dragRef.current;
    const dx = e.clientX - startX;
    setColW((w) => ({ ...w, [key]: Math.max(72, startW + dx) }));
  }, []);

  const endDrag = React.useCallback(() => {
    dragRef.current = null;
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", endDrag);
  }, [onMouseMove]);

  const startDrag = (key: string, e: React.MouseEvent) => {
    dragRef.current = { key, startX: e.clientX, startW: colW[key] ?? 200 };
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", endDrag);
  };

  /** Status */
  const statusColor = (raw: string | undefined) => {
    const s = (raw || "").toLowerCase();
    if (/error|failed|fail/.test(s)) return "error";
    if (/completed|created|done|success|ok|ready/.test(s)) return "success";
    if (/processing|running|sent|pending|in\s*progress|building/.test(s)) return "warning";
    return "default";
  };

  const renderCell = (key: string, row: any) => {
    const raw = row?.[key];

    if (key === "campaign_status") {
      const s = typeof raw === "string" ? raw : "";
      const isError = /error/i.test(s);
      const label = isError
      ? row?.error_message || "Error"
      : (s || "—");
      const color = isError ? "error" : statusColor(s);
      return (
        <Chip
          size="small"
          color={color as any}
          variant={color === "default" ? "outlined" : "filled"}
          label={label}
          sx={{
            maxWidth: "100%",
            "& .MuiChip-label": {
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            },
          }}
        />
      );
    }

    if (key === "tracking_link") {
      const text = raw == null || raw === "" ? "—" : String(raw);
      return (
        <Box sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {text}
        </Box>
      );
    }

    if (key === "creative_sub_folder") {
      const v = typeof raw === "string" ? raw : "";
      return v ? (
        <Tooltip title="Preview (CreativeSubFolder)">
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              window.open(v, "_blank", "noopener,noreferrer");
            }}
          >
            <ImageOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ) : (
        <Box>—</Box>
      );
    }

    if (key === "creatives_folder") {
      const v = typeof raw === "string" ? raw : "";
      return v ? (
        <Tooltip title="Open Url (CreativesFolder)">
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              window.open(v, "_blank", "noopener,noreferrer");
            }}
          >
            <OpenInNewIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ) : (
        <Box>—</Box>
      );
    }

    if (key === "sub_folder_type") {
      return <Box>{raw ? "Folder" : "—"}</Box>;
    }

    if (isUrl(raw)) {
      try {
        const host = new URL(String(raw)).hostname.replace(/^www\./, "");
        return (
          <Box sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {host}
          </Box>
        );
      } catch {}
    }

    const text = raw == null || raw === "" ? "—" : String(raw);
    return (
      <Box sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {text}
      </Box>
    );
  };

  const platform =
    Array.isArray(req.ad_platform) ? req.ad_platform.join(", ") : req.ad_platform;

  /** Columns menu */
  const [menuEl, setMenuEl] = React.useState<null | HTMLElement>(null);
  const openMenu = (e: React.MouseEvent<HTMLElement>) => setMenuEl(e.currentTarget);
  const closeMenu = () => setMenuEl(null);

  const showLocalMenu = !externalVisible;

  return (
    <Card variant="outlined" sx={{ overflow: "hidden", maxWidth: "100%" }}>
      <CardHeader
        title={
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" onClick={() => onOpenRequest(req)}
          sx={{ cursor: "pointer" }}>
            <Typography variant="h6">
              {buildRequestTitle(req)}
            </Typography>
            {platform && <Chip size="small" label={platform} />}
            {req.status && (
              <Chip
                size="small"
                label={req.status}
                color={
                  /completed|created|done/i.test(req.status)
                    ? "success"
                    : /processing|running|sent/i.test(req.status)
                    ? "warning"
                    : "default"
                }
                variant="outlined"
              />
            )}
            <Chip size="small" variant="outlined" label={`${req.campaigns?.length ?? 0} items`} />
          </Stack>
        }
        subheader={
          <Stack direction="row" spacing={2} divider={<span style={{ opacity: 0.3 }}>|</span> as any}>
            {req.request_date && <Typography variant="body2">Requested: {req.request_date}</Typography>}
            {req.campaign_date && <Typography variant="body2">Campaign Date: {req.campaign_date}</Typography>}
            {req.ad_account_id && <Typography variant="body2">AdAccount: {req.ad_account_id}</Typography>}
          </Stack>
        }
        action={
          showLocalMenu ? (
            <>
              <Tooltip title="Columns">
                <IconButton size="small" onClick={openMenu} onMouseDown={(e) => e.stopPropagation()}>
                  <ViewColumnIcon />
                </IconButton>
              </Tooltip>

              <Menu
                anchorEl={menuEl}
                open={Boolean(menuEl)}
                onClose={closeMenu}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                transformOrigin={{ vertical: "top", horizontal: "right" }}
                slotProps={{ paper: { sx: { minWidth: 260, maxHeight: 360 } } }}
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
                    <ListItemText primary="Show all" />
                  </MenuItem>
                  <MenuItem onClick={hideAll} dense>
                    <ListItemIcon><HideSourceIcon fontSize="small" /></ListItemIcon>
                    <ListItemText primary="Hide all" />
                  </MenuItem>
                  <MenuItem onClick={resetCols} dense>
                    <ListItemIcon><RestoreIcon fontSize="small" /></ListItemIcon>
                    <ListItemText primary="Reset to defaults" />
                  </MenuItem>
                </Box>

                {allColumns.map((k) => (
                  <MenuItem key={k} onClick={() => toggleCol(k)} dense>
                    <Checkbox edge="start" checked={isVisible(k)} />
                    <ListItemText primary={k} />
                  </MenuItem>
                ))}
              </Menu>
            </>
          ) : null
        }
      />
      <CardContent
        sx={{
          pt: 0,
          maxHeight: 360,
          overflowY: "auto",
          borderTop: "1px solid",
          borderColor: "divider",
        }}
      >
        <Table
          size="small"
          sx={{
            tableLayout: "fixed",
            "& th, & td": {
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              verticalAlign: "middle",
            },
          }}
        >
          <TableHead sx={{ bgcolor: "action.hover" }}>
            <TableRow>
              {columns.map((key) => (
                <TableCell
                  key={key}
                  sx={{
                    position: "relative",
                    width: colW[key],
                    maxWidth: colW[key],
                    minWidth: 60,
                    pr: 3,
                  }}
                  title={key}
                >
                  {key}
                  {/* drag handle */}
                  <Box
                    onMouseDown={(e) => startDrag(key, e)}
                    sx={{
                      position: "absolute",
                      right: 0,
                      top: 0,
                      width: 8,
                      height: "100%",
                      cursor: "col-resize",
                      userSelect: "none",
                      "&::after": {
                        content: '""',
                        position: "absolute",
                        left: 3,
                        top: 8,
                        bottom: 8,
                        width: "2px",
                        bgcolor: "divider",
                      },
                    }}
                  />
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {(req.campaigns?.length ?? 0) === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} sx={{ color: "text.secondary" }}>
                  No campaigns
                </TableCell>
              </TableRow>
            ) : (
              (req.campaigns ?? []).map((row) => (
                <TableRow
                  key={row.id ?? JSON.stringify(row)}
                  hover
                  sx={{ cursor: "pointer" }}
                  onClick={() => onOpenCampaign(row)}
                >
                  {columns.map((key) => (
                    <TableCell
                      key={key}
                      sx={{ width: colW[key], maxWidth: colW[key] }}
                      title={
                        typeof row?.[key] === "string" ? (row?.[key] as string) : undefined
                      }
                    >
                      {renderCell(key, row)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
