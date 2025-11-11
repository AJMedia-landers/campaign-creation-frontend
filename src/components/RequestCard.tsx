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
} from "@mui/material";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import { RequestItem } from "@/types/campaign";

const isUrl = (v: unknown) => typeof v === "string" && /^https?:\/\//i.test(v);

interface RequestCardProps {
  req: RequestItem;
  onOpenRequest: (r: RequestItem) => void;
  onOpenCampaign: (row: any) => void;
}

export default function RequestCard({ req, onOpenRequest, onOpenCampaign }: RequestCardProps) {
  const columns = React.useMemo(() => {
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

  /** Column widths */
  const [colW, setColW] = React.useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    for (const key of columns) {
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
      for (const key of columns) {
        if (next[key] == null) {
          next[key] =
            key === "creative_sub_folder" || key === "creatives_folder" ? 96 :
            key === "sub_folder_type" ? 120 :
            key === "tracking_link" ? 260 :
            key === "campaign_status" ? 160 :
            200;
        }
      }
      Object.keys(next).forEach((k) => !columns.includes(k) && delete next[k]);
      return next;
    });
  }, [columns]);

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

  return (
    <Card variant="outlined" sx={{ overflow: "hidden", maxWidth: "100%" }}>
      <CardHeader
        onClick={() => onOpenRequest(req)}
        sx={{ cursor: "pointer" }}
        title={
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
            <Typography variant="h6">
              {req.brand_name || "Request"} — {req.campaign_type || "Type N/A"}
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
            <Typography variant="body2">Req ID: {req.id}</Typography>
            {req.request_date && <Typography variant="body2">Requested: {req.request_date}</Typography>}
            {req.campaign_date && <Typography variant="body2">Campaign Date: {req.campaign_date}</Typography>}
            {req.ad_account_id && <Typography variant="body2">AdAccount: {req.ad_account_id}</Typography>}
          </Stack>
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
