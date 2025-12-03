"use client";

import * as React from "react";
import {
  Box,
  Paper,
  TextField,
  Typography,
  Stack,
  Button,
  MenuItem,
  Alert,
  Tabs,
  Tab,
  IconButton,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  CircularProgress,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import RefreshIcon from "@mui/icons-material/Refresh";
import AddIcon from "@mui/icons-material/Add";
import { useRouter } from "next/navigation";
import { usePageSearch } from "@/lib/PageSearchContext";
import ConfirmBeforeSubmit from "@/components/ComfirmModal";

const ADMIN_EMAILS = ["uliana.sedko@ajmedia.io", "ivan.plametiuk@ajmedia.io", "janessa.pandiyan@ajmedia.io"];

type CurrentUser = {
  email?: string;
};

type FlowConfig = {
  id: number;
  flow_key: string;
  flow_id: string;
  approved_flow_id: string;
  preferred_tracking_domain: string;
};

type TabValue = "flow-config" | "client-config";

type FlowFormState = {
  key: string;
  flowId: string;
  approvedFlowId: string;
  preferredTrackingDomain: string;
};

type FlowConfigDialogProps = {
  open: boolean;
  initial: FlowConfig | null;
  onClose: () => void;
  onSaved: () => Promise<void>;
};

const DEFAULT_DOMAIN = "go.toptrendingnewstoday.com";

const FlowConfigDialog: React.FC<FlowConfigDialogProps> = React.memo(
  ({ open, initial, onClose, onSaved }) => {
    const [form, setForm] = React.useState<FlowFormState>({
      key: "",
      flowId: "",
      approvedFlowId: "",
      preferredTrackingDomain: DEFAULT_DOMAIN,
    });
    const [saving, setSaving] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
      if (!open) return;

      if (initial) {
        setForm({
          key: initial.flow_key,
          flowId: initial.flow_id,
          approvedFlowId: initial.approved_flow_id,
          preferredTrackingDomain: initial.preferred_tracking_domain,
        });
      } else {
        setForm({
          key: "",
          flowId: "",
          approvedFlowId: "",
          preferredTrackingDomain: DEFAULT_DOMAIN,
        });
      }
      setError(null);
    }, [open, initial]);

    const handleChange =
      (field: keyof FlowFormState) =>
      (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm((prev) => ({ ...prev, [field]: e.target.value }));
      };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);

      if (!form.key.trim() || !form.flowId.trim() || !form.approvedFlowId.trim()) {
        setError("Flow key, Flow ID and Approved Flow ID are required.");
        return;
      }

      const payload = {
        flow_key: form.key.trim(),
        flow_id: form.flowId.trim(),
        approved_flow_id: form.approvedFlowId.trim(),
        preferred_tracking_domain: form.preferredTrackingDomain.trim(),
      };

      try {
        setSaving(true);
        let res: Response;

        if (initial) {
          // UPDATE by Key
          res = await fetch(`/api/flow-configs/key/update?key=${initial.flow_key}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(payload),
          });
        } else {
          // CREATE
          res = await fetch("/api/flow-configs/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(payload),
          });
        }

        const text = await res.text();
        const json = text ? JSON.parse(text) : {};
        if (!res.ok || json?.success === false) {
          throw new Error(json?.message || "Failed to save flow config");
        }

        await onSaved();
        onClose();
      } catch (err: any) {
        setError(err?.message || "Unknown error");
      } finally {
        setSaving(false);
      }
    };

    return (
      <Dialog
        open={open}
        onClose={saving ? undefined : onClose}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {initial ? "Edit flow configuration" : "Create flow configuration"}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent dividers>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                label="Flow key"
                helperText={
                  initial
                    ? "Flow key cannot be changed for an existing config"
                    : "Example: heater-us-desktop-taboola"
                }
                value={form.key}
                onChange={handleChange("key")}
                fullWidth
                required
                disabled={!!initial}
              />
              <TextField
                label="Flow ID"
                value={form.flowId}
                onChange={handleChange("flowId")}
                fullWidth
                required
              />
              <TextField
                label="Approved Flow ID"
                value={form.approvedFlowId}
                onChange={handleChange("approvedFlowId")}
                fullWidth
                required
              />
              <TextField
                select
                label="Preferred tracking domain"
                value={form.preferredTrackingDomain}
                onChange={handleChange("preferredTrackingDomain")}
                fullWidth
                required
              >
                <MenuItem value="click.risinghealthtrends.com">
                  click.risinghealthtrends.com
                </MenuItem>
                <MenuItem value="caringdipaimed.com">
                  caringdipaimed.com
                </MenuItem>
                <MenuItem value="go.forwardlinkclick.com">
                  go.forwardlinkclick.com
                </MenuItem>
                <MenuItem value="click.seekinghealthnews.com">
                  click.seekinghealthnews.com
                </MenuItem>
                <MenuItem value="go.toptrendingnewstoday.com">
                  go.toptrendingnewstoday.com
                </MenuItem>
              </TextField>

              {error && <Alert severity="error">{error}</Alert>}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={saving}>
              {saving ? "Saving…" : initial ? "Save changes" : "Create"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    );
  }
);

export default function AdminPage() {
  const router = useRouter();
  const { query } = usePageSearch();

  const [user, setUser] = React.useState<CurrentUser | null>(null);
  const [userLoaded, setUserLoaded] = React.useState(false);
  const [accessDenied, setAccessDenied] = React.useState(false);

  const [tab, setTab] = React.useState<TabValue>("flow-config");

  // flow configs
  const [flows, setFlows] = React.useState<FlowConfig[]>([]);
  const [flowsLoading, setFlowsLoading] = React.useState(false);
  const [flowsError, setFlowsError] = React.useState<string | null>(null);
  const [total, setTotal] = React.useState(0);

  const [deleteId, setDeleteId] = React.useState<number | null>(null);

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<FlowConfig | null>(null);

  const [clientName, setClientName] = React.useState("");
  const [clientGeneratedConfig, setClientGeneratedConfig] =
    React.useState<string>("");
  const [clientError, setClientError] = React.useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = React.useState(false);
  const [flowToDelete, setFlowToDelete] = React.useState<FlowConfig | null>(null);

  // --------- ACCESS GUARD ----------
  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/auth/profile", {
          credentials: "include",
        });
        if (!res.ok) throw new Error("unauthorized");

        const json = await res.json();
        const email: string =
          json?.data?.user?.email?.toLowerCase?.() ?? "";

        const isAdmin = ADMIN_EMAILS.includes(email);

        if (!cancelled) {
          if (!isAdmin) {
            setAccessDenied(true);
            router.replace("/");
            return;
          }
          setUser({ email });
        }
      } catch {
        if (!cancelled) {
          setAccessDenied(true);
          router.replace("/signin");
        }
      } finally {
        if (!cancelled) setUserLoaded(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  // ---------- LOAD FLOWS WITH PAGINATION ----------
  async function fetchAllFlows() {
    let offset = 0;
    let limit = 100;
    let all: any[] = [];
    let hasMore = true;

    while (hasMore) {
      const res = await fetch(`api/flow-configs/get?limit=${limit}&offset=${offset}`, {
        credentials: "include",
      });

      const json = await res.json();
      if (!res.ok || json?.success === false) {
        throw new Error(json?.message || "Failed to load flow configs");
      }

      all = [...all, ...json.data];

      const pg = json.pagination;
      hasMore = pg.hasMore;
      offset += limit;
    }

    return all;
  }

  // ---------- LOAD FLOWS ----------
  const loadFlows = React.useCallback(async () => {
    setFlowsLoading(true);
    try {
      const all = await fetchAllFlows();
      setFlows(all);
    } catch (err:any) {
      setFlowsError(err.message);
    } finally {
      setFlowsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (!userLoaded || accessDenied) return;
    loadFlows();
  }, [userLoaded, accessDenied, loadFlows]);

  React.useEffect(() => {
    if (!userLoaded || accessDenied) return;
    loadFlows();
  }, [userLoaded, accessDenied, loadFlows]);

  // ---------- search  ----------
  const search = (query ?? "").trim().toLowerCase();
  const visibleFlows = React.useMemo(() => {
    if (!search) return flows;
    return flows.filter((f) => {
      const fields = [
        f.flow_key,
        f.flow_id,
        f.approved_flow_id,
        f.preferred_tracking_domain,
      ];
      return fields.some((v) =>
        String(v ?? "")
          .toLowerCase()
          .includes(search)
      );
    });
  }, [flows, search]);

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (flow: FlowConfig) => {
    setEditing(flow);
    setDialogOpen(true);
  };

  const handleDelete = (flow: FlowConfig) => {
    setFlowToDelete(flow);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!flowToDelete) return;
    const flow = flowToDelete;

    try {
      setDeleteId(flow.id);

      const res = await fetch(
        `/api/flow-configs/key/delete?key=${encodeURIComponent(flow.flow_key)}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      const text = await res.text();
      const json = text ? JSON.parse(text) : {};

      if (!res.ok || json?.success === false) {
        throw new Error(json?.message || "Failed to delete flow config");
      }

      await loadFlows();
    } catch (err: any) {
      alert(err?.message || "Delete failed");
    } finally {
      setDeleteModalOpen(false);
      setFlowToDelete(null);
      setDeleteId(null);
    }
  };



  // client tab
  const handleClientSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setClientError(null);
    setClientGeneratedConfig("");

    if (!clientName.trim()) {
      setClientError("Client name is required.");
      return;
    }

    const body = {
      name: clientName.trim(),
    };

    setClientGeneratedConfig(JSON.stringify(body, null, 2));
  };

  // ---------- render ----------
  if (!userLoaded) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Checking access…</Typography>
      </Box>
    );
  }

  if (accessDenied) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">You don’t have access to this page.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1000, mx: "auto", p: { xs: 2, md: 3 } }}>
      <Typography variant="h4" sx={{ mb: 1.5, fontWeight: 700 }}>
        Admin Panel
      </Typography>

      {user?.email && (
        <Typography variant="body2" sx={{ mb: 2 }}>
          Logged in as <strong>{user.email}</strong>
        </Typography>
      )}

      <Paper sx={{ mb: 3, px: 2 }}>
        <Tabs
          value={tab}
          onChange={(_, value) => setTab(value)}
          variant="scrollable"
        >
          <Tab label="Flow Config" value="flow-config" />
          <Tab label="Client Config" value="client-config" />
        </Tabs>
      </Paper>

      {/* FLOW CONFIG TAB */}
      {tab === "flow-config" && (
        <>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                mb: 1.5,
              }}
            >
              <Box>
                <Typography variant="h6">Flow Configs</Typography>
                <Typography variant="body2" color="text.secondary">
                  Search using the top search bar by flow key, ID or domain.
                </Typography>
              </Box>
              <Box sx={{ display: "flex", gap: 1 }}>
                <IconButton
                  aria-label="reload"
                  onClick={() => loadFlows()}
                  disabled={flowsLoading}
                >
                  <RefreshIcon />
                </IconButton>
                <Button
                  startIcon={<AddIcon />}
                  variant="contained"
                  onClick={openCreate}
                >
                  New flow
                </Button>
              </Box>
            </Box>

            {flowsError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {flowsError}
              </Alert>
            )}

            {flowsLoading ? (
              <Box
                sx={{
                  py: 4,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <CircularProgress size={28} />
              </Box>
            ) : visibleFlows.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No flow configs found.
              </Typography>
            ) : (
              <>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Flow key</TableCell>
                      <TableCell>Flow ID</TableCell>
                      <TableCell>Approved Flow ID</TableCell>
                      <TableCell>Preferred domain</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {visibleFlows.map((flow) => (
                      <TableRow key={flow.id}>
                        <TableCell>{flow.flow_key}</TableCell>
                        <TableCell>{flow.flow_id}</TableCell>
                        <TableCell>{flow.approved_flow_id}</TableCell>
                        <TableCell>{flow.preferred_tracking_domain}</TableCell>
                        <TableCell align="right">
                          <IconButton
                            size="small"
                            onClick={() => openEdit(flow)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDelete(flow)}
                            disabled={deleteId === flow.id}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </>
            )}
          </Paper>

          <FlowConfigDialog
            open={dialogOpen}
            initial={editing}
            onClose={() => setDialogOpen(false)}
            onSaved={() => loadFlows()}
          />
        </>
      )}

      {/* CLIENT CONFIG TAB */}
      {tab === "client-config" && (
        <>
          <Paper sx={{ p: 3, mb: 3 }}>
            <form onSubmit={handleClientSubmit}>
              <Stack spacing={2}>
                <TextField
                  label="Client name"
                  helperText='Example: Acme Corporation'
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  fullWidth
                  required
                />

                {clientError && <Alert severity="error">{clientError}</Alert>}

                <Box>
                  <Button type="submit" variant="contained">
                    Generate client payload
                  </Button>
                </Box>
              </Stack>
            </form>
          </Paper>

          {clientGeneratedConfig && (
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>
                Generated Client payload (POST body):
              </Typography>
              <Box
                component="pre"
                sx={{
                  m: 0,
                  fontFamily: "monospace",
                  fontSize: 13,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-all",
                }}
              >
                {clientGeneratedConfig}
              </Box>
            </Paper>
          )}
        </>
      )}
      <ConfirmBeforeSubmit
        open={deleteModalOpen}
        onCancel={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Flow Configuration"
        message={
          flowToDelete
            ? `Are you sure you want to permanently delete:\n\n${flowToDelete.flow_key}\n\nThis action cannot be undone.`
            : ""
        }
        confirmLabel="Delete"
      />
    </Box>
  );
}
