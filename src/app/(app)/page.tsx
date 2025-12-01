"use client";
import * as React from "react";
import {
  Box, Button, CircularProgress, IconButton, Stack, Typography, TablePagination,
  Dialog,
  ButtonGroup,
  Chip,
  Snackbar, Alert
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RefreshIcon from "@mui/icons-material/Refresh";
import SortIcon from "@mui/icons-material/Sort";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";

import RequestCard from "@/components/RequestCard";
import RequestDetailsOverlay from "@/components/RequestDetailsOverlay";
import CampaignDetailsOverlay from "@/components/CampaignDetailsOverlay";
import EmptyState from "@/components/EmptyState";
import ColumnsMenu from "@/components/ColumnsMenu"
import NewRequestDialog from "@/components/NewRequestDialog";
import NewRequestForm from "@/components/NewRequestForm";
import RequestsFilter, { defaultRequestsFilter, RequestsFilterValue } from "@/components/RequestsFilter";

import { Campaign, RequestItem } from "@/types/campaign";
import { usePageSearch } from "@/lib/PageSearchContext";
import { buildRequestTitle } from "@/lib/requestTitle";
import { useSocket } from "@/providers/SocketProvider";
import { getRequestBuildDate } from "@/lib/sortHelpers";
import { usePathname, useRouter } from "next/navigation";


// ---- fetch helper
type FetchResult = { items: RequestItem[]; total: number };
type LanguageOption = { id: string | number; name: string };
async function fetchRequests(page = 1, limit = 20): Promise<FetchResult> {
  const res = await fetch(`/api/campaigns/campaigns-by-request?page=${page}&limit=${limit}`, { credentials: "include" });
  const text = await res.text();
  let json: any = {};
  try { json = text ? JSON.parse(text) : {}; } catch { json = {}; }

  const rootItems = json?.data?.items ?? json?.items ?? json?.data ?? json;
  const array = Array.isArray(rootItems) ? rootItems : [];
  const total: number = Number(json?.data?.total ?? json?.total ?? json?.totalCount ?? json?.count ?? json?.pagination?.total) || array.length;

  const items = array.map((req: any) => ({
    ...req,
    campaigns: Array.isArray(req?.campaigns) ? req.campaigns : (Array.isArray(req?.children) ? req.children : []),
  })) as RequestItem[];

  return { items, total };
}

type SortOption = "build_time_asc" | "build_time_desc";

const asId = (v: string | number) => String(v);

function mergeCampaigns(oldList: Campaign[], patchList: Campaign[]) {
  const map = new Map(oldList.map(c => [asId(c.id), c]));
  for (const patch of patchList) {
    const id = asId(patch.id);
    map.set(id, { ...map.get(id), ...patch });
  }
  return Array.from(map.values());
}

function statusKind(v: any): "Created" | "Error" | null {
  const s = String(v ?? "").toLowerCase();
  if (!s) return null;
  if (s.includes("fail") || s.includes("timeout") || s.includes("error")) return "Error";
  if (s.includes("created")) return "Created";
  return null;
}

function toDate (v?: string | null) {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
};

function dateInRange (value?: string | null, from?: string | null, to?: string | null) {
  const d = toDate(value);
  if (!d) return false;
  const f = toDate(from ?? undefined);
  const t = toDate(to ?? undefined);
  if (f && d < f) return false;
  if (t && d > t) return false;
  return true;
};

export default function CampaignSetRequestsPage() {
  const { socket } = useSocket();
  const { query } = usePageSearch();
  const pathname = usePathname();
  const router = useRouter();
  const [openNew, setOpenNew] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [items, setItems] = React.useState<RequestItem[]>([]);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(0);
  const [rowsPerPage] = React.useState(20); // selector hidden
  const [languages, setLanguages] = React.useState<LanguageOption[]>([]);

  // overlays
  const [reqOverlayOpen, setReqOverlayOpen] = React.useState(false);
  const [campOverlayOpen, setCampOverlayOpen] = React.useState(false);
  const [reqForOverlay, setReqForOverlay] = React.useState<RequestItem | null>(null);
  const [campForOverlay, setCampForOverlay] = React.useState<any | null>(null);

  const [filters, setFilters] = React.useState<RequestsFilterValue>(defaultRequestsFilter);
  const [editOpen, setEditOpen] = React.useState(false);
  const [editOf, setEditOf] = React.useState<RequestItem | null>(null);
  const [cardSort, setCardSort] = React.useState<SortOption>("build_time_desc");

  const [toastOpen, setToastOpen] = React.useState(false);
  const [toastMsg, setToastMsg] = React.useState("");
  const [toastSeverity, setToastSeverity] =
    React.useState<"success" | "error" | "warning" | "info">("info");

  const [creatingAdditionalAds, setCreatingAdditionalAds] = React.useState(false);
  const [recreating, setRecreating] = React.useState(false);

  const mapRequestToFormDefaults = (r: RequestItem) => ({
    campaign_name_post_fix: r.campaign_name_post_fix ?? "",
    client_name: r.client_name ?? "",
    creatives_folder: r.creatives_folder ?? "",
    ad_platform: Array.isArray(r.ad_platform) ? r.ad_platform : (r.ad_platform ? [r.ad_platform] : []),
    ad_account_id: r.ad_account_id ?? "",
    brand_name: r.brand_name ?? "",
    timezone: r.timezone ?? "UTC",
    country: r.country ?? "",
    device: Array.isArray(r.device) ? r.device : (r.device ? [r.device] : []),
    hours_start: Number(r.hours_start ?? 0),
    hours_end: Number(r.hours_end ?? 0),
    daily_budget: Number(r.daily_budget ?? 0),
    cta_button: r.cta_button ?? "Learn more",
    creative_description: r.creative_description ?? "",
    language: r.language ?? "",
    pacing: r.pacing ?? "off",
    bid_amount: Number((r as any).bid_amount ?? 0),
    headline1: r.headline1 ?? "",
    headline2: r.headline2 ?? "",
    headline3: r.headline3 ?? "",
    headline4: r.headline4 ?? "",
    headline5: r.headline5 ?? "",
    headline6: r.headline6 ?? "",
    headline7: r.headline7 ?? "",
    headline8: r.headline8 ?? "",
    headline9: r.headline9 ?? "",
    campaign_date: r.campaign_date ?? undefined,
    folder_ids: r.folder_ids ?? [],
  });

  React.useEffect(() => {
    let canceled = false;
    (async () => {
      try {
        const res = await fetch("/api/campaigns/revcontent/languages", {
          credentials: "include",
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const payload = await res.json();
        const list = Array.isArray(payload?.data) ? payload.data : payload;
        if (!canceled) {
          setLanguages((list || []) as LanguageOption[]);
        }
      } catch (err) {
        if (!canceled) {
          console.error("Failed to load languages", err);
          setLanguages([]);
        }
      }
    })();
    return () => {
      canceled = true;
    };
  }, []);


  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const { items, total } = await fetchRequests(page + 1, rowsPerPage);
      setItems(items);
      setTotal(total);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage]);

  React.useEffect(() => { load(); }, [load]);

  const openRequest = (r: RequestItem) => { setReqForOverlay(r); setReqOverlayOpen(true); };
  const openCampaign = (row: any) => { setCampForOverlay(row); setCampOverlayOpen(true); };

  const handleDeleteAll = async (req: RequestItem) => {
    console.log("Delete")
    await load();
  };
  const handleRecreate = async (req: RequestItem) => {
    try {
      setReqOverlayOpen(false);
      setRecreating(true);
  
      const res = await fetch(
        `/api/campaigns/requests-recreate?id=${encodeURIComponent(
          String(req.id)
        )}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
          credentials: "include",
        }
      );
  
      const text = await res.text();
      let json: any = {};
      try {
        json = text ? JSON.parse(text) : {};
      } catch {
        json = {};
      }
  
      if (!res.ok || json?.success === false) {
        console.error("Recreate failed:", json);
        setToastMsg(
          json?.message || "Failed to recreate campaigns for this request."
        );
        setToastSeverity("error");
        setToastOpen(true);
        return;
      }
  
      setToastMsg(json?.message || "Campaigns recreated successfully.");
      setToastSeverity("success");
      setToastOpen(true);
  
      await load();
    } catch (e) {
      console.error(e);
      setToastMsg("Unexpected error while recreating campaigns.");
      setToastSeverity("error");
      setToastOpen(true);
    } finally {
      setRecreating(false);
    }
  };

  const handleCreateAdditionalAds = async (req: RequestItem) => {
    try {
      setCreatingAdditionalAds(true);
  
      const res = await fetch(
        `/api/campaigns/create-additional-ads?id=${encodeURIComponent(
          String(req.id)
        )}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
          credentials: "include",
        }
      );
  
      const text = await res.text();
      let json: any = {};
      try {
        json = text ? JSON.parse(text) : {};
      } catch {
        json = {};
      }
  
      if (!res.ok || json?.success === false) {
        console.error("Create additional ads failed:", json);
        setToastMsg(
          json?.message || "Failed to create additional ads for this request."
        );
        setToastSeverity("error");
        setToastOpen(true);
        return;
      }
  
      setToastMsg(json?.message || "Additional ads are being created.");
      setToastSeverity("success");
      setToastOpen(true);
  
      await load();
    } catch (e) {
      console.error(e);
      setToastMsg("Unexpected error while creating additional ads.");
      setToastSeverity("error");
      setToastOpen(true);
    } finally {
      setCreatingAdditionalAds(false);
    }
  };
  const handleEditCampaign = (c: any) => {
    console.log("Edit campaign", c);
  };
  const handleDeleteCampaign = async (c: any) => {
    console.log("Delete Camp")
    setCampOverlayOpen(false);
    await load();
  };

  const handleEditRequest = (req: RequestItem) => {
    setEditOf(req);
    setEditOpen(true);
  };

  const handleOpenInline = (req: RequestItem) => {
    const params = new URLSearchParams({
      request_id: String(req.id),
      page: String(page + 1),
      limit: String(rowsPerPage),
    });
  
    router.push(`/campaigns-inline?${params.toString()}`);
  };

  const q = query.trim().toLowerCase();
  const norm = (v: unknown) => (v ?? "").toString().toLowerCase();

  const searchFiltered = React.useMemo(() => {
    if (!q) return items;

    return items
      .map((req) => {
        const requestLevelValues = [
          req.campaign_name_post_fix,
          req.ad_account_id,
          buildRequestTitle(req),
          req.first_name,
        ];
        const requestLevelHit = requestLevelValues.some((f) => norm(f).includes(q));

        let matchedRows: any[] = [];
        if (Array.isArray(req.campaigns)) {
          matchedRows = req.campaigns.filter(
            (c) => norm(c?.campaign_name).includes(q) || norm(c?.campaign_id).includes(q)
          );
        }

        if (requestLevelHit) return req;
        if (matchedRows.length > 0) return { ...req, campaigns: matchedRows };
        return null;
      })
      .filter(Boolean) as typeof items;
  }, [items, q]);;

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

  const fullyFiltered = React.useMemo(() => {
    if (!hasFilter) return searchFiltered;

    return searchFiltered
      .map((req) => {
        if (filters.requester) {
          const who = `${(req as any)?.first_name ?? ""} ${(req as any)?.last_name ?? ""}`;
          if (!norm(who).includes(norm(filters.requester))) return null;
        }
        if (filters.clientName) {
          const client = (req as any)?.client_name ?? "";
          if (!norm(client).includes(norm(filters.clientName))) return null;
        }
        if ((filters.requestDateFrom || filters.requestDateTo)) {
          const requested =
            (req as any)?.requested_at ??
            (req as any)?.created_at ??
            (req as any)?.createdAt ??
            null;
          if (!dateInRange(requested, filters.requestDateFrom, filters.requestDateTo)) return null;
        }
        if ((filters.campaignDateFrom || filters.campaignDateTo)) {
          const campDate =
            (req as any)?.campaign_date ??
            (req as any)?.campaignDate ??
            null;
          if (!dateInRange(campDate, filters.campaignDateFrom, filters.campaignDateTo)) return null;
        }
        if (filters.country) {
          const rc = ((req as any)?.country ?? "").toString();
          if (!rc.toLowerCase().includes(filters.country.toLowerCase())) return null;
        }

        const rows = (req.campaigns ?? []).filter((row: any) => {
          if (filters.statuses.length) {
            const kind = statusKind(row?.campaign_status);
            if (!kind || !filters.statuses.includes(kind)) return false;
          }

          if (filters.platforms.length) {
            const rowPlat = String(row?.ad_platform ?? "").trim();
            const reqPlat = String((req as any)?.ad_platform ?? "").trim();
            const plat = rowPlat || reqPlat;
            if (!plat || !filters.platforms.some((p) => plat.toLowerCase().includes(p.toLowerCase())))
              return false;
          }

          if (filters.devices.length) {
            const rowDev = String(row?.device ?? "").toLowerCase();
            const fromName = String(row?.campaign_name ?? "").toLowerCase();
            const devHit = filters.devices.some(
              (d) => rowDev.includes(d.toLowerCase()) || fromName.includes(d.toLowerCase())
            );
            if (!devHit) return false;
          }

          return true;
        });

        if (rows.length > 0) return { ...req, campaigns: rows };
        return null;
      })
      .filter(Boolean) as typeof searchFiltered;
  }, [searchFiltered, filters, hasFilter]);

  const data = hasFilter || q ? fullyFiltered : items;

  const GLOBAL_STORAGE_KEY = "req:global:visibleCols";

  const allColumns = React.useMemo(() => {
    const set = new Set<string>();
    for (const req of data) {
      for (const row of req.campaigns ?? []) {
        if (row && typeof row === "object") Object.keys(row).forEach((k) => set.add(k));
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
  }, [data]);

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
    localStorage.setItem(GLOBAL_STORAGE_KEY, JSON.stringify(visibleCols));
  }, [visibleCols]);

  const onCampaignRequests = pathname === "/";

  const handleSocketUpdate = React.useCallback(
    (payload: [{ request_id: string | number; campaigns: Campaign[] }]) => {
      console.log("[socket:test] incoming payload:", payload);
      if (payload.length) {
        payload.map((item: { request_id: string | number; campaigns: Campaign[] }) => {
          setItems(prev =>
            prev.map(req =>
              String(req.id) !== String(item.request_id)
                ? req
                : { ...req, campaigns: mergeCampaigns(req.campaigns ?? [], item.campaigns ?? []) }
            )
          );
        })
      }
    },
    []
  );

  React.useEffect(() => {
    if (!socket || !onCampaignRequests) return;
    socket.on("updatedCampaignStatus", handleSocketUpdate);
    return () => {
      socket.off("updatedCampaignStatus", handleSocketUpdate);
    };
  }, [socket, onCampaignRequests, handleSocketUpdate]);

  const sortedData = React.useMemo(() => {
    const list = [...data];
    list.sort((a, b) => {
      const da = getRequestBuildDate(a);
      const db = getRequestBuildDate(b);
  
      if (!da && !db) return 0;
      if (!da) return cardSort === "build_time_asc" ? 1 : -1;
      if (!db) return cardSort === "build_time_asc" ? -1 : 1;
  
      const diff = da.getTime() - db.getTime();
      return cardSort === "build_time_asc" ? diff : -diff;
    });
    return list;
  }, [data, cardSort]);

  console.log(data)
  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
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
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h4">Campaign Set Requests</Typography>
        <Stack direction="row" spacing={1}>
          <IconButton aria-label="Refresh" onClick={load} disabled={loading}>
            <RefreshIcon />
          </IconButton>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenNew(true)}>
            Add
          </Button>
        </Stack>
      </Stack>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <ColumnsMenu
          allColumns={allColumns}
          visible={visibleCols}
          defaultVisible={defaultVisible}
          onChange={setVisibleCols}
          storageKey="req:global:visibleCols"
          sx={{ mb: 1.5 }}
        />
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          sx={{ mb: 1 }}
        >
          <Stack direction="row" spacing={0.5} alignItems="center">
            <SortIcon fontSize="small" />
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              Sort cards by build time
            </Typography>
          </Stack>

          <ButtonGroup size="small">
            <Button
              startIcon={<ArrowUpwardIcon />}
              onClick={() => setCardSort("build_time_asc")}
            >
              Oldest
            </Button>
            <Button
              startIcon={<ArrowDownwardIcon />}
              onClick={() => setCardSort("build_time_desc")}
            >
              Newest
            </Button>
          </ButtonGroup>

          <Chip
            size="small"
            label={cardSort === "build_time_asc" ? "Active: Oldest first" : "Active: Newest first"}
            color="primary"
            variant="outlined"
            sx={{ ml: 1 }}
          />
        </Stack>
      </Stack>
      <RequestsFilter
        value={filters}
        onChange={setFilters}
        onClear={() => setFilters(defaultRequestsFilter)}
      />

      {loading ? (
        <Stack alignItems="center" justifyContent="center" sx={{ py: 6 }}>
          <CircularProgress />
        </Stack>
        ) : data.length === 0 ? (
          <EmptyState
            title="No results"
            subtitle="We couldn’t find any requests matching your search or filters."
          />
        ) : (
        <>
          <Stack spacing={2}>
            {sortedData.map((req) => (
              <RequestCard
                key={req.id}
                req={req}
                onOpenRequest={openRequest}
                onOpenCampaign={openCampaign}
                visibleCols={visibleCols}
                languages={languages}
              />
            ))}
          </Stack>

          <TablePagination
            component="div"
            count={total}
            page={page}
            onPageChange={(_, p) => setPage(p)}
            rowsPerPage={rowsPerPage}
            rowsPerPageOptions={[]}   // hides selector
            sx={{ mt: 2 }}
          />
        </>
      )}

      {/* Overlays */}
      <RequestDetailsOverlay
        open={reqOverlayOpen}
        onClose={() => setReqOverlayOpen(false)}
        data={reqForOverlay}
        onDeleteAll={handleDeleteAll}
        onRecreate={handleRecreate}
        onOpenCampaign={openCampaign}
        onEditRequest={handleEditRequest}
        onOpenInline={handleOpenInline}
        onCreateAdditionalAds={handleCreateAdditionalAds}
        createAdditionalAdsLoading={creatingAdditionalAds}
        recreateLoading={recreating}
      />

      <CampaignDetailsOverlay
        open={campOverlayOpen}
        onClose={() => setCampOverlayOpen(false)}
        data={campForOverlay}
        onEdit={handleEditCampaign}
        onDelete={handleDeleteCampaign}
        languages={languages}
      />

      <NewRequestDialog open={openNew} onClose={() => setOpenNew(false)} onCreated={load} />

      <Dialog open={editOpen} onClose={() => setEditOpen(false)} fullWidth maxWidth="lg">
        <Box sx={{ p: { xs: 1.5, md: 2 } }}>
          {editOf && (
            <NewRequestForm
              title="Edit Request"
              editOf={editOf.id}
              defaultValues={mapRequestToFormDefaults(editOf)}
              submitLabel="Save changes"
              onSubmitted={(res) => {
                setEditOpen(false);
                setEditOf(null);

                if (!res?.data) return;

                const updated: any = res.data;
                setItems((prev) =>
                  prev.map((req) =>
                    String(req.id) === String(updated.id)
                      ? { ...req, ...updated }
                      : req
                  )
                );

                setReqForOverlay((prev) =>
                  prev && String(prev.id) === String(updated.id)
                    ? { ...prev, ...updated }
                    : prev
                );
              }}
            />
          )}
        </Box>
      </Dialog>
    </Box>
  );
}
