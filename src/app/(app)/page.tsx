"use client";

import * as React from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  IconButton,
  Stack,
  Table, TableBody, TableCell, TableHead, TableRow,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RefreshIcon from "@mui/icons-material/Refresh";
import NewRequestDialog from "@/components/NewRequestDialog";
import { usePageSearch } from "@/lib/PageSearchContext";

type Row = {
  id: string;
  campaignName: string;
  detailedStatus: string;
  campaignId?: string;
  trackingLink?: string;
  builtTime?: string;
  requester?: string;
};
async function fetchCampaignSets(): Promise<Row[]> {
  return [
    { id: "1", campaignName: "Some camp", detailedStatus: "Sent" },
    { id: "2", campaignName: "Some camp2", detailedStatus: "Sent" },
  ];
}

export default function Home() {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [rows, setRows] = React.useState<Row[]>([]);

  const { debounced } = usePageSearch();

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchCampaignSets();
      setRows(data);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const filtered = React.useMemo(() => {
    const q = debounced.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      [r.campaignName, r.detailedStatus, r.campaignId, r.trackingLink, r.builtTime, r.requester]
        .filter(Boolean)
        .some(v => String(v).toLowerCase().includes(q))
    );
  }, [rows, debounced]);


  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h4">Campaign Set Requests</Typography>
        <Stack direction="row" spacing={1}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpen(true)}
          >
            Add
          </Button>
        </Stack>
      </Stack>
      <Card variant="outlined">
        <CardContent sx={{ p: 0 }}>
          {loading ? (
            <Stack alignItems="center" justifyContent="center" sx={{ py: 6 }}>
              <CircularProgress />
            </Stack>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>CampaignName</TableCell>
                  <TableCell>Detailed Status</TableCell>
                  <TableCell>CampaignID</TableCell>
                  <TableCell>TrackingLink</TableCell>
                  <TableCell>BuiltTime</TableCell>
                  <TableCell>Requester</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map((r) => (
                  <TableRow key={r.id} hover>
                    <TableCell>{r.campaignName}</TableCell>
                    <TableCell>{r.detailedStatus}</TableCell>
                    <TableCell>{r.campaignId ?? "—"}</TableCell>
                    <TableCell sx={{ maxWidth: 320, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {r.trackingLink ?? "—"}
                    </TableCell>
                    <TableCell>{r.builtTime ?? "—"}</TableCell>
                    <TableCell>{r.requester ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      <NewRequestDialog
        open={open}
        onClose={() => setOpen(false)}
        onCreated={() => load()}
      />
    </Box>
  );
}

