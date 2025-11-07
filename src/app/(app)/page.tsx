"use client";

import * as React from "react";
import {
  Box,
  Button,
  Card,
  CardHeader,
  CardContent,
  Chip,
  CircularProgress,
  IconButton,
  Stack,
  Table, TableHead, TableRow, TableCell, TableBody,
  TablePagination,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RefreshIcon from "@mui/icons-material/Refresh";
import NewRequestDialog from "@/components/NewRequestDialog";
import RequestDetailsDrawer from "@/components/RequestDetailsDrawer";
import { useRouter, useSearchParams } from "next/navigation";

// ---------------- types
type Campaign = {
  id: string | number;
  ad_platform?: string;
  brand_name?: string;
  campaign_date?: string;
  campaign_id?: string | number | null;
  campaign_name?: string;
  campaign_status?: string;
  campaign_type?: string;
  client_name?: string;
  country?: string;
  created_at?: string;
  tracking_link?: string;
  requester?: string;
  built_time?: string;
};

type RequestItem = {
  requester: any;
  client_name: any;
  creatives_folder: any;
  hours_start: any;
  hours_end: any;
  timezone: any;
  id: string | number;
  request_date?: string;
  status?: string;
  ad_account_id?: string;
  ad_platform?: string[] | string;
  brand_name?: string;
  campaign_date?: string;
  campaign_type?: string;
  campaigns: Campaign[];
};

type FetchResult = { items: RequestItem[]; total: number };

// ---------------- data fetch
async function fetchRequests(page = 1, limit = 20): Promise<FetchResult> {
  const res = await fetch(`/api/campaigns/campaigns-by-request?page=${page}&limit=${limit}`, {
    credentials: "include",
  });

  const text = await res.text();
  let json: any = {};
  try { json = text ? JSON.parse(text) : {}; } catch { json = {}; }

  // Accept several response shapes
  const rootItems =
    json?.data?.items ??
    json?.items ??
    json?.data ??
    json;

  const array = Array.isArray(rootItems) ? rootItems : [];

  const total: number =
    Number(
      json?.data?.total ??
      json?.total ??
      json?.totalCount ??
      json?.count ??
      json?.pagination?.total
    ) || array.length;

  const items: any[] = array.map((req: any, idx: number) => {
    const campaignsSource =
      req?.campaigns ??
      req?.children ??
      [];

    const campaigns: Campaign[] = Array.isArray(campaignsSource) ? campaignsSource.map((c: any, i: number) => ({
      id: c.id ?? c._id ?? `${idx}-${i}`,
      ad_platform: c.ad_platform ?? c.platform,
      brand_name: c.brand_name,
      campaign_date: c.campaign_date,
      campaign_id: c.campaign_id,
      campaign_name: c.campaign_name ?? c.name,
      campaign_status: c.campaign_status ?? c.status,
      campaign_type: c.campaign_type,
      client_name: c.client_name,
      country: c.country,
      created_at: c.created_at,
      tracking_link: c.tracking_link ?? c.trackingLink,
      requester: c.requester,
      built_time: c.built_time ?? c.builtTime,
    })) : [];

    return {
      id: req.id ?? req._id ?? idx,
      request_date: req.request_date ?? req.created_at,
      status: req.status ?? req.request_status,
      ad_account_id: req.ad_account_id,
      ad_platform: req.ad_platform,
      brand_name: req.brand_name,
      campaign_date: req.campaign_date,
      campaign_type: req.campaign_type,
      campaigns,
    };
  });

  console.log(array)

  return { items, total };
}

// ---------------- page
export default function CampaignSetRequestsPage() {
  const [open, setOpen] = React.useState(false);

  const [loading, setLoading] = React.useState(true);
  const [items, setItems] = React.useState<RequestItem[]>([]);
  const [total, setTotal] = React.useState(0);
  const [selected, setSelected] = React.useState<RequestItem | null>(null);
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const router = useRouter();
  const params = useSearchParams();

  // pagination (MUI uses 0-based page)
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(20);

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

  React.useEffect(() => {
    const id = params.get("requestId");
    if (!id) return;
  }, [params]);

  const openDetails = (item: RequestItem) => {
    setSelected(item);
    setDrawerOpen(true);
  };

  const closeDetails = () => {
    setDrawerOpen(false);
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h4">Campaign Set Requests</Typography>
        <Stack direction="row" spacing={1}>
          <IconButton aria-label="Refresh" onClick={load} disabled={loading}>
            <RefreshIcon />
          </IconButton>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)}>
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
          {/* One card per request */}
          <Stack spacing={2}>
            {items.map((req) => {
              const platform =
                Array.isArray(req.ad_platform) ? req.ad_platform.join(", ") : req.ad_platform;

              return (
                <Card key={req.id} sx={{maxWidth: "100%", cursor: "pointer"}} variant="outlined" onClick={() => openDetails({
                  id: req.id,
                  // title: `${req.brand_name} — ${req.campaign_type}`,
                  requester: req.requester,
                  request_date: req.request_date,
                  status: req.status,
                  campaign_type: req.campaign_type,
                  campaign_date: req.campaign_date,
                  client_name: req.client_name,
                  creatives_folder: req.creatives_folder,
                  ad_platform: req.ad_platform,
                  brand_name: req.brand_name,
                  hours_start: req.hours_start,
                  hours_end: req.hours_end,
                  timezone: req.timezone,
                  ad_account_id: req.ad_account_id,
                  campaigns: req.campaigns,   // pass through array you already render in the inner table
                })}>
                  <CardHeader
                    title={
                      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                        <Typography variant="h6" sx={{ mr: 1 }}>
                          {req.brand_name || "Request"} — {req.campaign_type || "Type N/A"}
                        </Typography>
                        {platform && <Chip size="small" label={platform} />}
                        {req.status && (
                          <Chip
                            size="small"
                            label={req.status}
                            color={/completed|created|done/i.test(req.status) ? "success" : /processing|running|sent/i.test(req.status) ? "warning" : "default"}
                            variant="outlined"
                          />
                        )}
                      </Stack>
                    }
                    subheader={
                      <Stack direction="row" spacing={3} divider={<span style={{ opacity: .25 }}>|</span> as any}>
                        <Typography variant="body2">Req ID: {String(req.id)}</Typography>
                        {req.request_date && <Typography variant="body2">Requested: {req.request_date}</Typography>}
                        {req.campaign_date && <Typography variant="body2">Campaign Date: {req.campaign_date}</Typography>}
                        {req.ad_account_id && <Typography variant="body2">AdAccount: {req.ad_account_id}</Typography>}
                      </Stack>
                    }
                  />
                  <CardContent sx={{
                    pt: 0,
                    overflowY: "auto",
                    maxWidth: "100%" }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>CampaignName</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>CampaignID</TableCell>
                          <TableCell>TrackingLink</TableCell>
                          <TableCell>BuiltTime</TableCell>
                          <TableCell>Requester</TableCell>
                          <TableCell>Country</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {req.campaigns.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={7} sx={{ color: "text.secondary" }}>
                              No campaigns
                            </TableCell>
                          </TableRow>
                        )}
                        {req.campaigns.map((c) => (
                          <TableRow key={c.id} hover>
                            <TableCell>{c.campaign_name ?? "—"}</TableCell>
                            <TableCell>{c.campaign_status ?? "—"}</TableCell>
                            <TableCell>{c.campaign_id ?? "—"}</TableCell>
                            <TableCell sx={{ maxWidth: 420, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {c.tracking_link ?? "—"}
                            </TableCell>
                            <TableCell>{c.built_time ?? c.created_at ?? "—"}</TableCell>
                            <TableCell>{c.requester ?? "—"}</TableCell>
                            <TableCell>{c.country ?? "—"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              );
            })}
          </Stack>

          <TablePagination
            component="div"
            count={total}
            page={page}
            onPageChange={(_, p) => setPage(p)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[10, 20, 50, 100]}
            sx={{ mt: 2 }}
          />
        </>
      )}

      <RequestDetailsDrawer
        open={drawerOpen}
        onClose={closeDetails}
        data={selected}
      />

      <NewRequestDialog
        open={open}
        onClose={() => setOpen(false)}
        onCreated={() => load()}
      />
    </Box>
  );
}
