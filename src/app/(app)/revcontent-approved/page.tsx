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
  TablePagination,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import ArrowDropUpIcon from "@mui/icons-material/ArrowDropUp";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircleOutline";
import PauseCircleOutlineIcon from "@mui/icons-material/PauseCircleOutline";

import ColumnsMenu from "@/components/ColumnsMenu";
import RequestsFilter, {
  RequestsFilterValue,
  defaultRequestsFilter,
} from "@/components/RequestsFilter";
import CampaignDetailsOverlay from "@/components/CampaignDetailsOverlay";
import { usePageSearch } from "@/lib/PageSearchContext";

const GLOBAL_STORAGE_KEY = "revcontent:approved:visibleCols";

type SortState =
  | { by: "name"; dir: "asc" | "desc" }
  | { by: "date"; dir: "asc" | "desc" }
  | null;

type FetchResult = { items: any[]; total: number };

function toDate(value: unknown) {
  if (!value) return null;
  const d = new Date(String(value));
  return isNaN(d.getTime()) ? null : d;
}

function statusKind(v: any): "Created" | "Error" | null {
  const s = String(v ?? "").toLowerCase();
  if (!s) return null;
  if (s.includes("fail") || s.includes("timeout") || s.includes("error"))
    return "Error";
  if (s.includes("created") || s.includes("approved")) return "Created";
  return null;
}

function dateInRange(
  value?: string | null,
  from?: string | null,
  to?: string | null
) {
  const d = value ? toDate(value) : null;
  if (!d) return false;
  const f = from ? toDate(from) : null;
  const t = to ? toDate(to) : null;
  if (f && d < f) return false;
  if (t && d > t) return false;
  return true;
}

async function fetchApproved(page = 1, limit = 50): Promise<FetchResult> {
  const res = await fetch(
    `/api/campaigns/revcontent/approved?page=${page}&limit=${limit}`,
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
    json?.data?.items ?? json?.items ?? json?.data ?? json ?? [];
  const items = Array.isArray(rootItems) ? rootItems : [];

  const total: number =
    Number(
      json?.data?.total ??
        json?.total ??
        json?.totalCount ??
        json?.count ??
        json?.pagination?.total
    ) || items.length;

  return { items, total };
}

export default function RevcontentApprovedPage() {
  const { query } = usePageSearch();

  const [loading, setLoading] = React.useState(true);
  const [rows, setRows] = React.useState<any[]>([]);
  const [total, setTotal] = React.useState(0);

  // pagination
  const [page, setPage] = React.useState(0);
  const [rowsPerPage] = React.useState(50);

  const [filters, setFilters] =
    React.useState<RequestsFilterValue>(defaultRequestsFilter);

  const [sort, setSort] = React.useState<SortState>(null);

  const [campOverlayOpen, setCampOverlayOpen] = React.useState(false);
  const [campForOverlay, setCampForOverlay] = React.useState<any | null>(null);

  // ---- load data with backend pagination ----
  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const { items, total } = await fetchApproved(page + 1, rowsPerPage);
      setRows(items);
      setTotal(total);
    } catch (err) {
      console.error("Failed to load approved RevContent campaigns:", err);
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage]);

  React.useEffect(() => {
    load();
  }, [load]);

  // ---- columns & visibility ----
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
          /name|description|headline/i.test(key)
            ? 320
            : /status|country|device|timezone/i.test(key)
            ? 170
            : 220;
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
  const q = query.trim().toLowerCase();

  const hasFilter =
    filters.statuses.length > 0 ||
    filters.platforms.length > 0 ||
    filters.devices.length > 0 ||
    !!filters.requester ||
    !!filters.clientName ||
    !!filters.requestDateFrom ||
    !!filters.requestDateTo ||
    !!filters.campaignDateFrom ||
    !!filters.campaignDateTo ||
    !!filters.country;

  // search
  const searchFiltered = React.useMemo(() => {
    if (!q) return rows;
    return rows.filter((row) => {
      const fields = [
        row.campaign_name,
        row.campaign_id,
        row.tracking_link,
        row.country,
        row.ad_platform,
        row.device,
      ];
      return fields.some((f) => norm(f).includes(q));
    });
  }, [rows, q]);

  // filters
  const fullyFiltered = React.useMemo(() => {
    if (!hasFilter) return searchFiltered;

    return searchFiltered.filter((row) => {
      if (filters.requester) {
        const who = `${row?.first_name ?? ""} ${row?.last_name ?? ""}`;
        if (!norm(who).includes(norm(filters.requester))) return false;
      }

      if (filters.clientName) {
        const client = row?.client_name ?? "";
        if (!norm(client).includes(norm(filters.clientName))) return false;
      }

      if (filters.country) {
        const rc = (row?.country ?? "").toString();
        if (!rc.toLowerCase().includes(filters.country.toLowerCase()))
          return false;
      }

      if (filters.statuses.length) {
        const kind = statusKind(row?.campaign_status);
        if (!kind || !filters.statuses.includes(kind)) return false;
      }

      if (filters.platforms.length) {
        const plat = String(row?.ad_platform ?? "").trim();
        if (
          !plat ||
          !filters.platforms.some((p) =>
            plat.toLowerCase().includes(p.toLowerCase())
          )
        )
          return false;
      }

      if (filters.devices.length) {
        const rowDev = String(row?.device ?? "").toLowerCase();
        const fromName = String(row?.campaign_name ?? "").toLowerCase();
        const devHit = filters.devices.some(
          (d) =>
            rowDev.includes(d.toLowerCase()) ||
            fromName.includes(d.toLowerCase())
        );
        if (!devHit) return false;
      }

      if (filters.requestDateFrom || filters.requestDateTo) {
        const requested =
          row?.requested_at ?? row?.created_at ?? row?.createdAt ?? null;
        if (
          !dateInRange(
            requested,
            filters.requestDateFrom,
            filters.requestDateTo
          )
        )
          return false;
      }

      if (filters.campaignDateFrom || filters.campaignDateTo) {
        const cDate = row?.campaign_date ?? row?.campaignDate ?? null;
        if (
          !dateInRange(
            cDate,
            filters.campaignDateFrom,
            filters.campaignDateTo
          )
        )
          return false;
      }

      return true;
    });
  }, [searchFiltered, filters, hasFilter]);

  // sorting – same pattern as CampaignsInlinePage
  const sortedRows = React.useMemo(() => {
    const arr = [...fullyFiltered];
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
  }, [fullyFiltered, sort, dateKey]);

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
  const dir = sort?.dir ?? "asc";

  // preparation for ON/OFF toggle
  const handleToggleCampaign = React.useCallback(
    (row: any, nextState: "on" | "off") => {
      console.log("TODO toggle RevContent campaign", {
        campaign_id: row?.campaign_id,
        nextState,
      });
    },
    []
  );

  if (loading && rows.length === 0) {
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
          <Typography variant="h5" noWrap>
            RevContent – Approved campaigns
          </Typography>
        </Stack>

        <Stack direction="row" spacing={1.5} alignItems="center">
          <IconButton
            onClick={load}
            size="small"
            disabled={loading}
            aria-label="Refresh"
          >
            <RefreshIcon fontSize="small" />
          </IconButton>

          <ColumnsMenu
            allColumns={allColumns}
            visible={visibleCols}
            defaultVisible={defaultVisible}
            onChange={setVisibleCols}
            storageKey={GLOBAL_STORAGE_KEY}
            label="Columns"
          />
        </Stack>
      </Stack>

      {/* Filters */}
      <RequestsFilter
        value={filters}
        onChange={setFilters}
        onClear={() => setFilters(defaultRequestsFilter)}
      />

      {/* Table container (same style as CampaignsInlinePage) */}
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
                  const isActiveName =
                    isNameSorted && key === "campaign_name";
                  const isActiveDate =
                    isDateSorted && dateKey && key === dateKey;
                  const showIcon = isActiveName || isActiveDate;

                  return (
                    <TableCell
                      key={key}
                      title={key}
                      onClick={() =>
                        isSortable && handleHeaderClick(key)
                      }
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
                        {showIcon &&
                          (dir === "asc" ? (
                            <ArrowDropUpIcon fontSize="small" />
                          ) : (
                            <ArrowDropDownIcon fontSize="small" />
                          ))}
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

                {/* actions column for ON/OFF */}
                <TableCell
                  key="actions"
                  sx={{ minWidth: 120, width: 120, maxWidth: 140 }}
                >
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {sortedRows.map((row, i) => (
                <TableRow
                  key={row.id ?? row.campaign_id ?? i}
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

                    return (
                      <TableCell
                        key={key}
                        title={text}
                        sx={{
                          width: colW[key],
                          maxWidth: colW[key],
                        }}
                      >
                        {text}
                      </TableCell>
                    );
                  })}

                  <TableCell
                    key="actions"
                    sx={{ minWidth: 120, width: 120, maxWidth: 140 }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Stack
                      direction="row"
                      spacing={0.5}
                      alignItems="center"
                      justifyContent="flex-start"
                    >
                      <Tooltip title="Turn ON campaign">
                        <span>
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleCampaign(row, "on");
                            }}
                          >
                            <PlayCircleOutlineIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="Turn OFF campaign">
                        <span>
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleCampaign(row, "off");
                            }}
                          >
                            <PauseCircleOutlineIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}

              {sortedRows.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={visibleCols.length + 1}
                    sx={{
                      py: 4,
                      textAlign: "center",
                      color: "text.secondary",
                    }}
                  >
                    No approved RevContent campaigns found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Box>

        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          rowsPerPage={rowsPerPage}
          rowsPerPageOptions={[]}
          sx={{ mt: 1 }}
        />
      </Box>

      <CampaignDetailsOverlay
        open={campOverlayOpen}
        onClose={() => setCampOverlayOpen(false)}
        data={campForOverlay}
      />
    </Box>
  );
}
