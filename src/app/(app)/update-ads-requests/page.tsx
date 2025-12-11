"use client";

import * as React from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  IconButton,
  Snackbar,
  Stack,
  TablePagination,
  Typography,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";

import RequestCard from "@/components/RequestCard";
import EmptyState from "@/components/EmptyState";
import ColumnsMenu from "@/components/ColumnsMenu";
import { RequestItem } from "@/types/campaign";
import { usePageSearch } from "@/lib/PageSearchContext";
import UpdateAdsForm from "@/components/UpdateAdsForm";

type FetchResult = { items: RequestItem[]; total: number };

async function fetchUpdateAdsRequests(
  page = 1,
  limit = 20
): Promise<FetchResult> {
  const res = await fetch(
    `/api/campaigns/update-ads/get?page=${page}&limit=${limit}`,
    { credentials: "include" }
  );
  const text = await res.text();
  let json: any = {};
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = {};
  }

  const rootItems = json?.data?.items ?? json?.items ?? json?.data ?? json;
  const array = Array.isArray(rootItems) ? rootItems : [];
  const total: number =
    Number(
      json?.data?.total ??
        json?.total ??
        json?.data?.count ??
        json?.count ??
        json?.pagination?.total
    ) || array.length;

  const items = array.map((req: any) => ({
    ...req,
    campaigns: Array.isArray(req?.campaigns) ? req.campaigns : [],
  })) as RequestItem[];

  return { items, total };
}

const norm = (v: unknown) => (v ?? "").toString().toLowerCase();

export default function UpdateAdsRequestsPage() {
  const { query } = usePageSearch();

  const [loading, setLoading] = React.useState(true);
  const [items, setItems] = React.useState<RequestItem[]>([]);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(0);
  const [rowsPerPage] = React.useState(20);

  const [visibleCols, setVisibleCols] = React.useState<string[]>([]);
  const [snack, setSnack] = React.useState<{
    open: boolean;
    msg: string;
    severity: "success" | "error" | "info";
  }>({ open: false, msg: "", severity: "info" });

  const [openForm, setOpenForm] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const { items, total } = await fetchUpdateAdsRequests(
        page + 1,
        rowsPerPage
      );
      setItems(items);
      setTotal(total);
    } catch (err: any) {
      setSnack({
        open: true,
        msg: err?.message || "Failed to load update ads requests",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage]);

  React.useEffect(() => {
    load();
  }, [load]);

  const q = query.trim().toLowerCase();
  const searched = React.useMemo(() => {
    if (!q) return items;

    return items
      .map((req) => {
        const requestLevelFields = [
          (req as any).id,
          (req as any).first_name,
          (req as any).last_name,
          (req as any).email,
          (req as any).creatives_folder,
          (req as any).cta_button,
          (req as any).creative_description,
        ];
        const hitRequest = requestLevelFields.some((f) =>
          norm(f).includes(q)
        );

        const matchedRows = (req.campaigns ?? []).filter(
          (c: any) =>
            norm(c?.campaign_id).includes(q) ||
            norm(c?.platform).includes(q) ||
            norm(c?.status).includes(q)
        );

        if (hitRequest) return req;
        if (matchedRows.length > 0)
          return { ...req, campaigns: matchedRows };
        return null;
      })
      .filter(Boolean) as RequestItem[];
  }, [items, q]);

  const data = searched;

  const GLOBAL_STORAGE_KEY = "updateAdsRequests:visibleCols";

  React.useEffect(() => {
    const set = new Set<string>();
    for (const req of data) {
      for (const row of req.campaigns ?? []) {
        if (row && typeof row === "object") {
          Object.keys(row).forEach((k) => set.add(k));
        }
      }
    }
    const cols = Array.from(set);
    setVisibleCols((prev) => {
      if (prev.length === 0) return cols;
      return prev.filter((c) => cols.includes(c));
    });
  }, [data]);

  React.useEffect(() => {
    if (visibleCols.length) {
      localStorage.setItem(
        GLOBAL_STORAGE_KEY,
        JSON.stringify(visibleCols)
      );
    }
  }, [visibleCols]);

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(GLOBAL_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setVisibleCols(parsed);
      }
    } catch {
      // ignore
    }
  }, []);

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Snackbar
        open={snack.open}
        autoHideDuration={5000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          severity={snack.severity}
          variant="filled"
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
          sx={{ whiteSpace: "pre-wrap", minWidth: 300 }}
        >
          {snack.msg}
        </Alert>
      </Snackbar>

      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 2 }}
      >
        <Typography variant="h4">Update Ads Requests</Typography>
        <Stack direction="row" spacing={1}>
          <IconButton onClick={load} disabled={loading}>
            <RefreshIcon />
          </IconButton>
          <Button variant="contained" onClick={() => setOpenForm(true)}>
            New Update Ads Request
          </Button>
        </Stack>
      </Stack>

      <ColumnsMenu
        allColumns={visibleCols}
        visible={visibleCols}
        defaultVisible={visibleCols}
        onChange={setVisibleCols}
        storageKey={GLOBAL_STORAGE_KEY}
        sx={{ mb: 2 }}
      />

      {loading ? (
        <Stack
          alignItems="center"
          justifyContent="center"
          sx={{ py: 6 }}
        >
          <CircularProgress />
        </Stack>
      ) : data.length === 0 ? (
        <EmptyState
          title="No update ads requests yet"
          subtitle="Create a new update ads request using the button above."
        />
      ) : (
        <>
          <Stack spacing={2}>
            {data.map((req) => (
              <RequestCard
                key={req.id}
                req={req}
                onOpenRequest={() => {}}
                onOpenCampaign={() => {}}
                visibleCols={visibleCols}
              />
            ))}
          </Stack>

          <TablePagination
            component="div"
            count={total}
            page={page}
            onPageChange={(_, p) => setPage(p)}
            rowsPerPage={rowsPerPage}
            rowsPerPageOptions={[]}
            sx={{ mt: 2 }}
          />
        </>
      )}

      <Dialog
        open={openForm}
        onClose={() => setOpenForm(false)}
        fullWidth
        maxWidth="lg"
      >
        <DialogContent sx={{ p: { xs: 2, md: 3 } }}>
          <UpdateAdsForm
            onSubmitted={() => {
              load();
            }}
            onClose={() => setOpenForm(false)}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
}
