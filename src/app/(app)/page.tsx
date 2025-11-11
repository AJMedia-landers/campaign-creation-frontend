"use client";
import * as React from "react";
import {
  Box, Button, CircularProgress, IconButton, Stack, Typography, TablePagination,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RefreshIcon from "@mui/icons-material/Refresh";

import RequestCard from "@/components/RequestCard";
import RequestDetailsOverlay from "@/components/RequestDetailsOverlay";
import CampaignDetailsOverlay from "@/components/CampaignDetailsOverlay";

import NewRequestDialog from "@/components/NewRequestDialog";
import { RequestItem } from "@/types/campaign";
import { usePageSearch } from "@/lib/PageSearchContext";
import { buildRequestTitle } from "@/lib/requestTitle";
import RequestsFilter, { defaultRequestsFilter, RequestsFilterValue } from "@/components/RequestsFilter";
import EmptyState from "@/components/EmptyState";

// ---- fetch helper
type FetchResult = { items: RequestItem[]; total: number };
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
  const { query } = usePageSearch();
  const [openNew, setOpenNew] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [items, setItems] = React.useState<RequestItem[]>([]);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(0);
  const [rowsPerPage] = React.useState(20); // selector hidden

  // overlays
  const [reqOverlayOpen, setReqOverlayOpen] = React.useState(false);
  const [campOverlayOpen, setCampOverlayOpen] = React.useState(false);
  const [reqForOverlay, setReqForOverlay] = React.useState<RequestItem | null>(null);
  const [campForOverlay, setCampForOverlay] = React.useState<any | null>(null);

  const [filters, setFilters] = React.useState<RequestsFilterValue>(defaultRequestsFilter);

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
    console.log("Recreate")
    await load();
  };
  const handleEditCampaign = (c: any) => {
    console.log("Edit")
    console.log("Edit campaign", c);
  };
  const handleDeleteCampaign = async (c: any) => {
    console.log("Delete Camp")
    setCampOverlayOpen(false);
    await load();
  };

  const q = query.trim().toLowerCase();
  const norm = (v: unknown) => (v ?? "").toString().toLowerCase();

  const searchFiltered = React.useMemo(() => {
    if (!q) return items;

    return items
      .map((req) => {
        const requestLevelValues = [
          req.campaign_type,
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


  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
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
            {data.map((req) => (
              <RequestCard
                key={req.id}
                req={req}
                onOpenRequest={openRequest}
                onOpenCampaign={openCampaign}
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
      />

      <CampaignDetailsOverlay
        open={campOverlayOpen}
        onClose={() => setCampOverlayOpen(false)}
        data={campForOverlay}
        onEdit={handleEditCampaign}
        onDelete={handleDeleteCampaign}
      />

      <NewRequestDialog open={openNew} onClose={() => setOpenNew(false)} onCreated={load} />
    </Box>
  );
}
