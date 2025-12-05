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

type CurrentUser = {
  email?: string;
  role?: string;
};

type FlowConfig = {
  id: number;
  flow_key: string;
  flow_id: string;
  preferred_tracking_domain: string;
};

type ClientName = {
  id: number;
  name: string;
  created_at?: string;
  updated_at?: string;
};

type TabValue = "flow-config" | "client-config";

type FlowFormState = {
  key: string;
  flowId: string;
  preferredTrackingDomain: string;
};

type FlowConfigDialogProps = {
  open: boolean;
  initial: FlowConfig | null;
  onClose: () => void;
  onSaved: () => Promise<void>;
};

type ClientDialogProps = {
  open: boolean;
  initial: ClientName | null;
  onClose: () => void;
  onSaved: () => Promise<void>;
};

const DEFAULT_DOMAIN = "go.toptrendingnewstoday.com";

const FlowConfigDialog: React.FC<FlowConfigDialogProps> = React.memo(
  ({ open, initial, onClose, onSaved }) => {
    const [form, setForm] = React.useState<FlowFormState>({
      key: "",
      flowId: "",
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
          preferredTrackingDomain: initial.preferred_tracking_domain,
        });
      } else {
        setForm({
          key: "",
          flowId: "",
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

      if (!form.key.trim() || !form.flowId.trim()) {
        setError("Flow key, Flow ID are required.");
        return;
      }

      const payload = {
        flow_key: form.key.trim(),
        flow_id: form.flowId.trim(),
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

const ClientDialog: React.FC<ClientDialogProps> = React.memo(
  ({ open, initial, onClose, onSaved }) => {
    const [name, setName] = React.useState("");
    const [saving, setSaving] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
      if (!open) return;
      setName(initial?.name ?? "");
      setError(null);
    }, [open, initial]);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);

      const trimmed = name.trim();
      if (!trimmed) {
        setError("Client name is required.");
        return;
      }

      const payload = { name: trimmed };

      try {
        setSaving(true);
        let res: Response;

        if (initial) {
          // UPDATE
          res = await fetch(`/api/client-names/update?id=${initial.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(payload),
          });
        } else {
          // CREATE
          res = await fetch("/api/client-names/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(payload),
          });
        }

        const text = await res.text();
        const json = text ? JSON.parse(text) : {};
        if (!res.ok || json?.success === false) {
          throw new Error(json?.message || "Failed to save client");
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
          {initial ? "Edit client name" : "Create client name"}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent dividers>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                label="Client name"
                helperText='Example: Acme Corporation'
                value={name}
                onChange={(e) => setName(e.target.value)}
                fullWidth
                required
              />
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

  const [deleteModalOpen, setDeleteModalOpen] = React.useState(false);
  const [flowToDelete, setFlowToDelete] = React.useState<FlowConfig | null>(null);

  const [clients, setClients] = React.useState<ClientName[]>([]);
  const [clientsLoading, setClientsLoading] = React.useState(false);
  const [clientsError, setClientsError] = React.useState<string | null>(null);
  const [clientDialogOpen, setClientDialogOpen] = React.useState(false);
  const [editingClient, setEditingClient] =
    React.useState<ClientName | null>(null);
  const [clientDeleteId, setClientDeleteId] = React.useState<number | null>(
    null
  );
  const [clientDeleteModalOpen, setClientDeleteModalOpen] =
    React.useState(false);
  const [clientToDelete, setClientToDelete] =
    React.useState<ClientName | null>(null);

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
        const role: string = json?.data?.user?.role ?? "";

        const isAdmin = role === "admin" || role === "super-admin";

        if (!cancelled) {
          if (!isAdmin) {
            setAccessDenied(true);
            router.replace("/");
            return;
          }
          setUser({ email: json?.data?.user?.email, role });
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

  const loadClients = React.useCallback(async () => {
    setClientsLoading(true);
    setClientsError(null);
    try {
      const res = await fetch("/api/client-names/get", {
        credentials: "include",
      });
      const json = await res.json();
      if (!res.ok || json?.success === false) {
        throw new Error(json?.message || "Failed to load client names");
      }
      setClients(json.data);
    } catch (err: any) {
      setClientsError(err.message);
    } finally {
      setClientsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (!userLoaded || accessDenied) return;
    loadFlows();
    loadClients();
  }, [userLoaded, accessDenied, loadFlows, loadClients]);



  // ---------- search  ----------
  const search = (query ?? "").trim().toLowerCase();

  const visibleFlows = React.useMemo(() => {
    if (!search) return flows;
    return flows.filter((f) => {
      const fields = [
        f.flow_key,
        f.flow_id,
        f.preferred_tracking_domain,
      ];
      return fields.some((v) =>
        String(v ?? "")
          .toLowerCase()
          .includes(search)
      );
    });
  }, [flows, search]);

  const visibleClients = React.useMemo(() => {
    if (!search) return clients;
    return clients.filter((c) =>
      c.name.toLowerCase().includes(search)
    );
  }, [clients, search]);

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
  const openClientCreate = () => {
    setEditingClient(null);
    setClientDialogOpen(true);
  };

  const openClientEdit = (client: ClientName) => {
    setEditingClient(client);
    setClientDialogOpen(true);
  };

  const handleClientDelete = (client: ClientName) => {
    setClientToDelete(client);
    setClientDeleteModalOpen(true);
  };

  const confirmClientDelete = async () => {
    if (!clientToDelete) return;
    const client = clientToDelete;

    try {
      setClientDeleteId(client.id);

      const res = await fetch(`/api/client-names/delete?id=${client.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const text = await res.text();
      const json = text ? JSON.parse(text) : {};

      if (!res.ok || json?.success === false) {
        throw new Error(json?.message || "Failed to delete client name");
      }

      await loadClients();
    } catch (err: any) {
      alert(err?.message || "Delete failed");
    } finally {
      setClientDeleteModalOpen(false);
      setClientToDelete(null);
      setClientDeleteId(null);
    }
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
                      <TableCell>Preferred domain</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {visibleFlows.map((flow) => (
                      <TableRow key={flow.id}>
                        <TableCell>{flow.flow_key}</TableCell>
                        <TableCell>{flow.flow_id}</TableCell>
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
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                mb: 1.5,
              }}
            >
              <Box>
                <Typography variant="h6">Client Names</Typography>
                <Typography variant="body2" color="text.secondary">
                  Search using the top search bar by client name.
                </Typography>
              </Box>
              <Box sx={{ display: "flex", gap: 1 }}>
                <IconButton
                  aria-label="reload"
                  onClick={() => loadClients()}
                  disabled={clientsLoading}
                >
                  <RefreshIcon />
                </IconButton>
                <Button
                  startIcon={<AddIcon />}
                  variant="contained"
                  onClick={openClientCreate}
                >
                  New client
                </Button>
              </Box>
            </Box>

            {clientsError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {clientsError}
              </Alert>
            )}

            {clientsLoading ? (
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
            ) : visibleClients.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No clients found.
              </Typography>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Client name</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {visibleClients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell>{client.name}</TableCell>
                      <TableCell>
                        {client.created_at
                          ? new Date(client.created_at).toLocaleString()
                          : "—"}
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={() => openClientEdit(client)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleClientDelete(client)}
                          disabled={clientDeleteId === client.id}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Paper>

          <ClientDialog
            open={clientDialogOpen}
            initial={editingClient}
            onClose={() => setClientDialogOpen(false)}
            onSaved={loadClients}
          />
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

      <ConfirmBeforeSubmit
        open={clientDeleteModalOpen}
        onCancel={() => setClientDeleteModalOpen(false)}
        onConfirm={confirmClientDelete}
        title="Delete Client Name"
        message={
          clientToDelete
            ? `Are you sure you want to permanently delete client:\n\n${clientToDelete.name}\n\nThis action cannot be undone.`
            : ""
        }
        confirmLabel="Delete"
      />
    </Box>
  );
}
