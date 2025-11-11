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

export default function CampaignSetRequestsPage() {
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

      {loading ? (
        <Stack alignItems="center" justifyContent="center" sx={{ py: 6 }}>
          <CircularProgress />
        </Stack>
      ) : (
        <>
          <Stack spacing={2}>
            {items.map((req) => (
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
