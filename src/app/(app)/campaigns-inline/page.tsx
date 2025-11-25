"use client";
import * as React from "react";
import {
  Box,
  Stack,
  Typography,
  CircularProgress,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  Tooltip,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowDropUpIcon from "@mui/icons-material/ArrowDropUp";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import { useSearchParams } from "next/navigation";

import CampaignDetailsOverlay from "@/components/CampaignDetailsOverlay";
import ColumnsMenu from "@/components/ColumnsMenu";
import { usePageSearch } from "@/lib/PageSearchContext";
import { buildRequestTitle } from "@/lib/requestTitle";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";

const GLOBAL_STORAGE_KEY = "req:inline:visibleCols";

type SortState =
  | { by: "name"; dir: "asc" | "desc" }
  | { by: "date"; dir: "asc" | "desc" }
  | null;

function toDate(value: unknown) {
  if (!value) return null;
  const d = new Date(String(value));
  return isNaN(d.getTime()) ? null : d;
}

export default function CampaignsInlinePage() {
  const searchParams = useSearchParams();
  const requestId = searchParams.get("request_id");
  const pageParam = Number(searchParams.get("page") ?? "1");
  const limitParam = Number(searchParams.get("limit") ?? "20");

  const { query } = usePageSearch();

  const [loading, setLoading] = React.useState(true);
  const [rows, setRows] = React.useState<any[]>([]);
  const [requestTitle, setRequestTitle] = React.useState(
    requestId ? `Request #${requestId}` : "Request"
  );
  const [campOverlayOpen, setCampOverlayOpen] = React.useState(false);
  const [campForOverlay, setCampForOverlay] = React.useState<any | null>(null);

  const [sort, setSort] = React.useState<SortState>(null);

  React.useEffect(() => {
    if (!requestId) {
      setLoading(false);
      return;
    }

    (async () => {
      try {
        setLoading(true);

        const res = await fetch(
          `/api/campaigns/campaigns-by-request?page=${pageParam}&limit=${limitParam}`,
          { credentials: "include" }
        );
        const text = await res.text();
        let json: any = {};
        try {
          json = text ? JSON.parse(text) : {};
        } catch {
          json = {};
        }

        const rootItems =
          json?.data?.items ?? json?.items ?? json?.data ?? json;

        const array = Array.isArray(rootItems) ? rootItems : [];

        const items = array.map((req: any) => ({
          ...req,
          campaigns: Array.isArray(req?.campaigns)
            ? req.campaigns
            : Array.isArray(req?.children)
            ? req.children
            : [],
        }));

        const found = items.find(
          (r: any) => String(r.id) === String(requestId)
        );

        if (found) {
          setRows(found.campaigns ?? []);
          setRequestTitle(buildRequestTitle(found));
        } else {
          setRows([]);
        }
      } catch (err) {
        console.error("Failed to load campaigns inline:", err);
        setRows([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [requestId, pageParam, limitParam]);

  const allColumns = React.useMemo(() => {
    const set = new Set<string>();
    for (const row of rows) {
      if (row && typeof row === "object") {
        Object.keys(row).forEach((k) => set.add(k));
      }
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
  }, [rows]);

  const defaultVisible = React.useMemo(
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

  const [visibleCols, setVisibleCols] = React.useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(GLOBAL_STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return defaultVisible;
  });

  React.useEffect(() => {
    setVisibleCols((prev) => {
      const cleaned = prev.filter((k) => allColumns.includes(k));
      return cleaned.length ? cleaned : defaultVisible;
    });
  }, [allColumns, defaultVisible]);

  React.useEffect(() => {
    try {
      localStorage.setItem(GLOBAL_STORAGE_KEY, JSON.stringify(visibleCols));
    } catch {}
  }, [visibleCols]);

  const [colW, setColW] = React.useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    for (const key of allColumns) {
      if (key === "creative_sub_folder" || key === "creatives_folder") {
        initial[key] = 160;
      } else if (key === "sub_folder_type") {
        initial[key] = 130;
      } else if (key === "tracking_link") {
        initial[key] = 320;
      } else if (key === "campaign_status") {
        initial[key] = 170;
      } else {
        initial[key] =
          /name|description|headline/i.test(key) ? 320 :
          /status|country|device|timezone/i.test(key) ? 170 :
          220;
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
            key === "creative_sub_folder" || key === "creatives_folder"
              ? 160
              : key === "sub_folder_type"
              ? 130
              : key === "tracking_link"
              ? 320
              : key === "campaign_status"
              ? 170
              : 220;
        }
      }
      Object.keys(next).forEach((k) => !allColumns.includes(k) && delete next[k]);
      return next;
    });
  }, [allColumns]);

  const dragRef = React.useRef<{
    key: string;
    startX: number;
    startW: number;
  } | null>(null);

  const onMouseMove = React.useCallback((e: MouseEvent) => {
    if (!dragRef.current) return;
    const { key, startX, startW } = dragRef.current;
    const dx = e.clientX - startX;
    setColW((w) => ({ ...w, [key]: Math.max(80, startW + dx) }));
  }, []);

  const endDrag = React.useCallback(() => {
    dragRef.current = null;
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", endDrag);
  }, [onMouseMove]);

  const startDrag = (key: string, e: React.MouseEvent) => {
    e.stopPropagation();
    dragRef.current = { key, startX: e.clientX, startW: colW[key] ?? 220 };
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", endDrag);
  };

  const dateKey = React.useMemo(() => {
    const sample = rows[0] ?? {};
    const candidates = ["created_at", "updated_at"];
    return candidates.find((k) => k in sample) ?? null;
  }, [rows]);

  const norm = (v: unknown) => (v ?? "").toString().toLowerCase();

  const filteredRows = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;

    return rows.filter((row) => {
      const fields = [
        row.campaign_name,
        row.campaign_id,
        row.tracking_link,
        row.country,
      ];
      return fields.some((f) => norm(f).includes(q));
    });
  }, [rows, query]);

  const sortedRows = React.useMemo(() => {
    const arr = [...filteredRows];
    if (!sort) return arr;

    if (sort.by === "name") {
      arr.sort((a, b) => {
        const sa = norm(a.campaign_name);
        const sb = norm(b.campaign_name);
        if (sa < sb) return sort.dir === "asc" ? -1 : 1;
        if (sa > sb) return sort.dir === "asc" ? 1 : -1;
        return 0;
      });
    } else if (sort.by === "date" && dateKey) {
      arr.sort((a, b) => {
        const da = toDate(a[dateKey]);
        const db = toDate(b[dateKey]);
        if (!da && !db) return 0;
        if (!da) return sort.dir === "asc" ? 1 : -1;
        if (!db) return sort.dir === "asc" ? -1 : 1;
        const diff = da.getTime() - db.getTime();
        return sort.dir === "asc" ? diff : -diff;
      });
    }
    return arr;
  }, [filteredRows, sort, dateKey]);

  const handleHeaderClick = (key: string) => {
    if (key === "campaign_name") {
      setSort((prev) =>
        prev?.by === "name"
          ? { by: "name", dir: prev.dir === "asc" ? "desc" : "asc" }
          : { by: "name", dir: "asc" }
      );
    } else if (dateKey && key === dateKey) {
      setSort((prev) =>
        prev?.by === "date"
          ? { by: "date", dir: prev.dir === "asc" ? "desc" : "asc" }
          : { by: "date", dir: "desc" }
      );
    }
  };

  const isNameSorted = sort?.by === "name";
  const isDateSorted = sort?.by === "date";

  if (loading) {
    return (
      <Stack alignItems="center" justifyContent="center" sx={{ py: 6 }}>
        <CircularProgress />
      </Stack>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 2 }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <IconButton
            onClick={() => window.history.back()}
            size="small"
            sx={{
              borderRadius: "999px",
              border: 1,
              borderColor: "divider",
            }}
          >
            <ArrowBackIcon fontSize="small" />
          </IconButton>
          <Typography variant="h5" noWrap>
            Campaigns inline – {requestTitle}
          </Typography>
        </Stack>

        <ColumnsMenu
          allColumns={allColumns}
          visible={visibleCols}
          defaultVisible={defaultVisible}
          onChange={setVisibleCols}
          storageKey={GLOBAL_STORAGE_KEY}
          label="Columns"
        />
      </Stack>

      <Box
        sx={{
          mt: 1,
          borderRadius: 2.5,
          border: 1,
          borderColor: "divider",
          bgcolor: "background.paper",
          boxShadow: 1,
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            maxHeight: "72vh",
            overflowY: "auto",
            overflowX: "auto",
          }}
        >
          <Table
            size="medium"
            stickyHeader
            sx={{
              tableLayout: "fixed",
              minWidth: 1100,
              "& th, & td": {
                whiteSpace: "nowrap",
                textOverflow: "ellipsis",
                overflow: "hidden",
                fontSize: 14.5,
                py: 1.25,
                px: 2,
              },
            }}
          >
            <TableHead>
              <TableRow
                sx={{
                  "& th": {
                    position: "sticky",
                    top: 0,
                    zIndex: 1,
                    bgcolor: "background.paper",
                    borderBottom: 1,
                    borderColor: "divider",
                    fontWeight: 600,
                  },
                }}
              >
                {visibleCols.map((key) => {
                  const isSortable =
                    key === "campaign_name" || (dateKey && key === dateKey);
                  const isActiveName = isNameSorted && key === "campaign_name";
                  const isActiveDate = isDateSorted && dateKey && key === dateKey;
                  const showIcon = isActiveName || isActiveDate;
                  const dir = sort?.dir ?? "asc";

                  return (
                    <TableCell
                      key={key}
                      title={key}
                      onClick={() => isSortable && handleHeaderClick(key)}
                      sx={{
                        position: "relative",
                        width: colW[key],
                        maxWidth: colW[key],
                        minWidth: 90,
                        pr: 3,
                        cursor: isSortable ? "pointer" : "default",
                        ...(isSortable && {
                          "&:hover": { bgcolor: "action.hover" },
                        }),
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 0.5,
                        }}
                      >
                        <span>{key}</span>
                        {showIcon && (
                          dir === "asc" ? (
                            <ArrowDropUpIcon fontSize="small" />
                          ) : (
                            <ArrowDropDownIcon fontSize="small" />
                          )
                        )}
                      </Box>
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
                  );
                })}
              </TableRow>
            </TableHead>

            <TableBody>
              {sortedRows.map((row, i) => (
                <TableRow
                  key={row.id ?? i}
                  hover
                  onClick={() => {
                    setCampForOverlay(row);
                    setCampOverlayOpen(true);
                  }}
                  sx={{
                    cursor: "pointer",
                    "&:nth-of-type(odd)": {
                      bgcolor: "action.hover",
                    },
                  }}
                >
                  {visibleCols.map((key) => {
                    const raw = row?.[key];
                    const text =
                      raw === null || raw === undefined || raw === ""
                        ? "—"
                        : String(raw);

                    const isCopyable =
                      key === "campaign_id" || key === "tracking_link";

                    const handleCopy = (e: React.MouseEvent) => {
                      e.stopPropagation();
                      const value = raw ?? "";
                      if (!value) return;

                      const str = String(value);

                      if (navigator?.clipboard?.writeText) {
                        navigator.clipboard.writeText(str).catch((err) => {
                          console.error("Clipboard copy failed", err);
                        });
                      } else {
                        // fallback for old browsers
                        const textarea = document.createElement("textarea");
                        textarea.value = str;
                        document.body.appendChild(textarea);
                        textarea.select();
                        document.execCommand("copy");
                        document.body.removeChild(textarea);
                      }
                    };

                    return (
                      <TableCell
                        key={key}
                        title={text}
                        sx={{
                          width: colW[key],
                          maxWidth: colW[key],
                        }}
                      >
                        {isCopyable ? (
                          <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                          >
                            <Box
                              component="span"
                              sx={{
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                display: "block",
                              }}
                            >
                              {text}
                            </Box>
                            {raw && (
                              <Tooltip title="Copy to clipboard">
                                <IconButton
                                  size="small"
                                  onClick={handleCopy}
                                >
                                  <ContentCopyIcon fontSize="inherit" />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Stack>
                        ) : (
                          text
                        )}
                      </TableCell>
                    );
                  })}

                </TableRow>
              ))}
              {sortedRows.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={visibleCols.length}
                    sx={{ py: 4, textAlign: "center", color: "text.secondary" }}
                  >
                    No campaigns found for this request.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Box>
      </Box>

      {/* Campaign details overlay */}
      <CampaignDetailsOverlay
        open={campOverlayOpen}
        onClose={() => setCampOverlayOpen(false)}
        data={campForOverlay}
      />
    </Box>
  );
}
