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
  Checkbox,
  FormGroup,
  FormControlLabel,
  Divider,
  Chip,
  Snackbar,
  Autocomplete,
  Tooltip,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
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

type PlatformAccount = {
  id: string;
  name: string;
  platform: string;
  timezone: string | null;
};

type TabValue = "flow-config" | "client-config" | "accounts" | "user-tokens";

type TokenUser = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
};

type LoginTokenRow = {
  id: number;
  user_id: number;
  user_email: string;
  user_first_name: string;
  user_last_name: string;
  user_role: string;
  creator_email: string | null;
  used_at: string | null;
  expires_at: string;
  created_at: string;
  status: "active" | "used" | "expired";
};

type IssuedTokenInfo = {
  id: number;
  token: string;
  expires_at: string;
  user: { id: number; email: string; first_name: string; last_name: string; role: string };
};

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

const PLATFORM_OPTIONS = [
  { value: "taboola", label: "Taboola" },
  { value: "outbrain", label: "Outbrain" },
  { value: "revcontent", label: "RevContent" },
] as const;

const DEVICE_OPTIONS = [
  { value: "desktop", label: "Desktop" },
  { value: "mobile", label: "Mobile" },
  { value: "tablet", label: "Tablet" },
] as const;

function normalizeToken(s: string) {
  return (s ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}


const DEFAULT_DOMAIN = "go.toptrendingnewstoday.com";

function generateFlowKeysFromBase(baseKey: string, platforms: string[], devices: string[]) {
  const base = normalizeToken(baseKey);
  const ps = (platforms ?? []).map(normalizeToken).filter(Boolean);
  const ds = (devices ?? []).map(normalizeToken).filter(Boolean);

  if (!base || ps.length === 0 || ds.length === 0) return [];
  return ps.flatMap((p) => ds.map((d) => `${base}-${d}-${p}`));
}

const FlowConfigDialog: React.FC<FlowConfigDialogProps> = React.memo(
  ({ open, initial, onClose, onSaved }) => {
  const [form, setForm] = React.useState<FlowFormState>({
    key: "",
    flowId: "",
    preferredTrackingDomain: DEFAULT_DOMAIN,
  });
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [mode, setMode] = React.useState<"bulk" | "single">("bulk");

  const [bulkPlatforms, setBulkPlatforms] = React.useState<string[]>([]);
  const [bulkDevices, setBulkDevices] = React.useState<string[]>([]);

  React.useEffect(() => {
    if (!open) return;

    if (initial) {
      setForm({
        key: initial.flow_key,
        flowId: initial.flow_id,
        preferredTrackingDomain: initial.preferred_tracking_domain,
      });
      setMode("single");
    } else {
      setForm({
        key: "",
        flowId: "",
        preferredTrackingDomain: DEFAULT_DOMAIN,
      });
      setMode("bulk");
      setBulkPlatforms([]);
      setBulkDevices([]);
    }
    setError(null);
  }, [open, initial]);

  const generatedKeys = React.useMemo(() => {
    if (initial) return [];
    if (mode !== "bulk") return [];
    return generateFlowKeysFromBase(form.key, bulkPlatforms, bulkDevices);
  }, [initial, mode, form.key, bulkPlatforms, bulkDevices]);

  const toggleBulk =
    (field: "platforms" | "devices", value: string) =>
    (_: React.ChangeEvent<HTMLInputElement>, checked: boolean) => {
      if (field === "platforms") {
        setBulkPlatforms((prev) => (checked ? [...prev, value] : prev.filter((v) => v !== value)));
      } else {
        setBulkDevices((prev) => (checked ? [...prev, value] : prev.filter((v) => v !== value)));
      }
    };

  const handleChange =
    (field: keyof FlowFormState) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);

      try {
        setSaving(true);

        if (initial) {
          if (!form.key.trim() || !form.flowId.trim()) {
            setError("Flow key, Flow ID are required.");
            return;
          }
    
          const payload = {
            flow_key: form.key.trim(),
            flow_id: form.flowId.trim(),
            preferred_tracking_domain: form.preferredTrackingDomain.trim(),
          };
    
          const res = await fetch(
            `/api/flow-configs/key/update?key=${initial.flow_key}`,
            {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify(payload),
            }
          );

          const text = await res.text();
          const json = text ? JSON.parse(text) : {};
          if (!res.ok || json?.success === false) {
            throw new Error(json?.message || "Failed to save flow config");
          }

          await onSaved();
          onClose();
          return;
        }

        if (!form.key.trim() || !form.flowId.trim()) {
          setError("Flow key, Flow ID are required.");
          return;
        }

        if (mode === "bulk") {
          if (bulkPlatforms.length === 0) {
            setError("Select at least one platform.");
            return;
          }
          if (bulkDevices.length === 0) {
            setError("Select at least one device.");
            return;
          }

          const keys = generatedKeys; // from useMemo
          if (!keys || keys.length === 0) {
            setError("No flow keys generated. Check base flow key / selections.");
            return;
          }

          for (const key of keys) {
            const payload = {
              flow_key: key,
              flow_id: form.flowId.trim(),
              preferred_tracking_domain: form.preferredTrackingDomain.trim(),
            };

            const res = await fetch("/api/flow-configs/create", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify(payload),
            });

            const text = await res.text();
            const json = text ? JSON.parse(text) : {};
            if (!res.ok || json?.success === false) {
              throw new Error(json?.message || `Failed to create flow config: ${key}`);
            }
          }

          await onSaved();
          onClose();
          return;
        }

        const payload = {
          flow_key: form.key.trim(),
          flow_id: form.flowId.trim(),
          preferred_tracking_domain: form.preferredTrackingDomain.trim(),
        };

        const res = await fetch("/api/flow-configs/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        });

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
          {!initial && (
            <Paper
              variant="outlined"
              sx={{
                mb: 2,
                p: 0.5,
                borderRadius: 2,
                overflow: "hidden",
              }}
            >
              <Tabs
                value={mode}
                onChange={(_, v) => setMode(v)}
                variant="fullWidth"
                sx={{
                  minHeight: 36,
                  "& .MuiTabs-indicator": { height: 0 }, // hide indicator
                  "& .MuiTab-root": {
                    minHeight: 36,
                    textTransform: "none",
                    fontWeight: 700,
                    borderRadius: 1.5,
                    mx: 0.5,
                  },
                  "& .Mui-selected": {
                    bgcolor: "action.selected",
                  },
                }}
              >
                <Tab value="bulk" label="Bulk" />
                <Tab value="single" label="Single" />
              </Tabs>
            </Paper>
          )}
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label={mode === "bulk" ? "ClientName-Country" : "Flow key"}
              helperText={
                initial
                  ? "Flow key cannot be changed for an existing config"
                  : mode === "bulk"
                  ? "Base client name - country (no device/platform). Example: heater-us"
                  : "Example: heater-us-desktop-taboola"
              }
              value={form.key}
              onChange={handleChange("key")}
              fullWidth
              required
              disabled={!!initial}
            />
            {!initial && mode === "bulk" && (
              <>
                <Divider />

                <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>
                    Platforms
                  </Typography>

                  <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                    {PLATFORM_OPTIONS.map((p) => {
                      const checked = bulkPlatforms.includes(p.value);
                      return (
                        <FormControlLabel
                          key={p.value}
                          label={p.label}
                          sx={{
                            m: 0,
                            px: 1,
                            py: 0.5,
                            borderRadius: 2,
                            border: "1px solid",
                            borderColor: checked ? "primary.main" : "divider",
                            bgcolor: checked ? "action.selected" : "transparent",
                            userSelect: "none",
                          }}
                          control={
                            <Checkbox
                              size="small"
                              checked={checked}
                              onChange={toggleBulk("platforms", p.value)}
                              sx={{ p: 0.5 }}
                            />
                          }
                        />
                      );
                    })}
                  </Box>
                </Paper>

                <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>
                    Devices
                  </Typography>

                  <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                    {DEVICE_OPTIONS.map((d) => {
                      const checked = bulkDevices.includes(d.value);
                      return (
                        <FormControlLabel
                          key={d.value}
                          label={d.label}
                          sx={{
                            m: 0,
                            px: 1,
                            py: 0.5,
                            borderRadius: 2,
                            border: "1px solid",
                            borderColor: checked ? "primary.main" : "divider",
                            bgcolor: checked ? "action.selected" : "transparent",
                            userSelect: "none",
                          }}
                          control={
                            <Checkbox
                              size="small"
                              checked={checked}
                              onChange={toggleBulk("devices", d.value)}
                              sx={{ p: 0.5 }}
                            />
                          }
                        />
                      );
                    })}
                  </Box>
                </Paper>

                <Divider />

                <Box>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                    <Typography variant="subtitle2">Generated flow keys</Typography>
                    <Chip size="small" label={`${generatedKeys.length}`} />
                  </Box>

                  <Paper variant="outlined" sx={{ p: 1.5, maxHeight: 180, overflow: "auto" }}>
                    {generatedKeys.length === 0 ? (
                      <Typography variant="body2" color="text.secondary">
                        Select at least 1 platform and 1 device to preview keys.
                      </Typography>
                    ) : (
                      <Stack spacing={0.5}>
                        {generatedKeys.map((k) => (
                          <Typography key={k} variant="body2" sx={{ fontFamily: "monospace" }}>
                            {k}
                          </Typography>
                        ))}
                      </Stack>
                    )}
                  </Paper>
                </Box>
              </>
            )}
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
              <MenuItem value="go.thesmarttechpost.com">
                go.thesmarttechpost.com
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
            {saving ? "Saving…" : initial ? "Save changes" : mode === "bulk" ? `Create (${generatedKeys.length})` : "Create"}
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

  // platform accounts (Taboola / Outbrain)
  const [accounts, setAccounts] = React.useState<PlatformAccount[]>([]);
  const [accountsLoading, setAccountsLoading] = React.useState(false);
  const [accountsError, setAccountsError] = React.useState<string | null>(null);
  const [accountPlatform, setAccountPlatform] = React.useState<"all" | "taboola" | "outbrain">("all");
  const [accountNameSearch, setAccountNameSearch] = React.useState("");
  const [accountPage, setAccountPage] = React.useState(0);
  const [accountRowsPerPage, setAccountRowsPerPage] = React.useState(10);
  const [accountSyncing, setAccountSyncing] = React.useState(false);

  // user-tokens (super-admin only)
  const [tokenUsers, setTokenUsers] = React.useState<TokenUser[]>([]);
  const [tokens, setTokens] = React.useState<LoginTokenRow[]>([]);
  const [tokensLoading, setTokensLoading] = React.useState(false);
  const [tokensError, setTokensError] = React.useState<string | null>(null);
  const [selectedTokenUser, setSelectedTokenUser] =
    React.useState<TokenUser | null>(null);
  const [tokenTtlHours, setTokenTtlHours] = React.useState<string>("24");
  const [issuedToken, setIssuedToken] =
    React.useState<IssuedTokenInfo | null>(null);
  const [creatingToken, setCreatingToken] = React.useState(false);
  const [revokingTokenId, setRevokingTokenId] = React.useState<number | null>(
    null
  );

  const [snack, setSnack] = React.useState<{
    open: boolean;
    severity: "success" | "error" | "info";
    message: string;
  }>({ open: false, severity: "info", message: "" });

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

  const handleSyncAccounts = async () => {
    setAccountSyncing(true);
    try {
      const res = await fetch("/api/cron/accounts/sync-all", {
        method: "POST",
        credentials: "include",
      });
      const json = await res.json();
      if (!res.ok || json?.success === false) {
        throw new Error(json?.message || json?.error || "Sync failed");
      }
      const newCount = json?.data?.newAccounts ?? 0;
      const updatedCount = json?.data?.updatedAccounts ?? 0;
      setSnack({
        open: true,
        severity: "success",
        message: `Sync complete — ${newCount} new account(s) added, ${updatedCount} updated.`,
      });
      await loadAccounts();
    } catch (err: any) {
      setSnack({
        open: true,
        severity: "error",
        message: err?.message || "Sync failed",
      });
    } finally {
      setAccountSyncing(false);
    }
  };

  const loadAccounts = React.useCallback(async () => {
    setAccountsLoading(true);
    setAccountsError(null);
    try {
      const res = await fetch("/api/accounts", {
        credentials: "include",
      });
      const json = await res.json();
      if (!res.ok || json?.success === false) {
        throw new Error(json?.message || json?.error || "Failed to load accounts");
      }
      setAccounts(json.data ?? []);
    } catch (err: any) {
      setAccountsError(err.message);
    } finally {
      setAccountsLoading(false);
    }
  }, []);

  const loadTokenUsers = React.useCallback(async () => {
    try {
      const res = await fetch("/api/login-tokens/users", { credentials: "include" });
      const json = await res.json();
      if (!res.ok || json?.success === false) {
        throw new Error(json?.message || json?.error || "Failed to load users");
      }
      setTokenUsers(json.data ?? []);
    } catch (err: any) {
      setTokensError(err.message);
    }
  }, []);

  const loadTokens = React.useCallback(async () => {
    setTokensLoading(true);
    setTokensError(null);
    try {
      const res = await fetch("/api/login-tokens", { credentials: "include" });
      const json = await res.json();
      if (!res.ok || json?.success === false) {
        throw new Error(json?.message || json?.error || "Failed to load tokens");
      }
      setTokens(json.data ?? []);
    } catch (err: any) {
      setTokensError(err.message);
    } finally {
      setTokensLoading(false);
    }
  }, []);

  const handleCreateToken = async () => {
    if (!selectedTokenUser) return;
    setCreatingToken(true);
    try {
      const res = await fetch("/api/login-tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          user_id: selectedTokenUser.id,
          ttl_hours: Number(tokenTtlHours) || 24,
        }),
      });
      const json = await res.json();
      if (!res.ok || json?.success === false) {
        throw new Error(json?.message || "Failed to create token");
      }
      setIssuedToken(json.data);
      setSelectedTokenUser(null);
      await loadTokens();
    } catch (err: any) {
      setSnack({ open: true, severity: "error", message: err.message });
    } finally {
      setCreatingToken(false);
    }
  };

  const handleRevokeToken = async (id: number) => {
    setRevokingTokenId(id);
    try {
      const res = await fetch(`/api/login-tokens/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const json = await res.json();
      if (!res.ok || json?.success === false) {
        throw new Error(json?.message || "Failed to revoke token");
      }
      setTokens((prev) => prev.filter((t) => t.id !== id));
      setSnack({ open: true, severity: "success", message: "Token revoked" });
    } catch (err: any) {
      setSnack({ open: true, severity: "error", message: err.message });
    } finally {
      setRevokingTokenId(null);
    }
  };

  const buildLoginUrl = (token: string): string => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/?token=${encodeURIComponent(token)}`;
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setSnack({ open: true, severity: "success", message: `${label} copied` });
    } catch {
      setSnack({ open: true, severity: "error", message: "Copy failed" });
    }
  };

  const isSuperAdmin = user?.role === "super-admin";

  React.useEffect(() => {
    if (!userLoaded || accessDenied) return;
    loadFlows();
    loadClients();
    loadAccounts();
    if (user?.role === "super-admin") {
      loadTokenUsers();
      loadTokens();
    }
  }, [userLoaded, accessDenied, user?.role, loadFlows, loadClients, loadAccounts, loadTokenUsers, loadTokens]);



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

  const visibleAccounts = React.useMemo(() => {
    const nameQuery = accountNameSearch.trim().toLowerCase();
    return accounts.filter((a) => {
      if (accountPlatform !== "all" && a.platform !== accountPlatform) return false;
      if (nameQuery && !a.name.toLowerCase().includes(nameQuery)) return false;
      return true;
    });
  }, [accounts, accountPlatform, accountNameSearch]);

  React.useEffect(() => {
    setAccountPage(0);
  }, [accountPlatform, accountNameSearch, accountRowsPerPage]);

  const pagedAccounts = React.useMemo(() => {
    if (accountRowsPerPage === -1) return visibleAccounts;
    const start = accountPage * accountRowsPerPage;
    return visibleAccounts.slice(start, start + accountRowsPerPage);
  }, [visibleAccounts, accountPage, accountRowsPerPage]);

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
          <Tab label="Accounts" value="accounts" />
          {isSuperAdmin && <Tab label="User Tokens" value="user-tokens" />}
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
                        <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                          <Stack direction="row" spacing={0.5} justifyContent="flex-end">
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
                          </Stack>
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
                      <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
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
                        </Stack>
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

      {/* ACCOUNTS TAB */}
      {tab === "accounts" && (
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
              <Typography variant="h6">Accounts</Typography>
              <Typography variant="body2" color="text.secondary">
                Taboola & Outbrain accounts.
              </Typography>
            </Box>
            <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
              <IconButton
                aria-label="reload"
                onClick={() => loadAccounts()}
                disabled={accountsLoading || accountSyncing}
              >
                <RefreshIcon />
              </IconButton>
              <Button
                variant="contained"
                onClick={handleSyncAccounts}
                disabled={accountSyncing}
                startIcon={
                  accountSyncing ? <CircularProgress size={16} color="inherit" /> : null
                }
              >
                {accountSyncing ? "Syncing…" : "Sync"}
              </Button>
            </Box>
          </Box>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 2 }}>
            <TextField
              select
              size="small"
              label="Platform"
              value={accountPlatform}
              onChange={(e) =>
                setAccountPlatform(e.target.value as "all" | "taboola" | "outbrain")
              }
              sx={{ minWidth: 180 }}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="taboola">Taboola</MenuItem>
              <MenuItem value="outbrain">Outbrain</MenuItem>
            </TextField>
            <TextField
              size="small"
              label="Search by name"
              value={accountNameSearch}
              onChange={(e) => setAccountNameSearch(e.target.value)}
              fullWidth
            />
          </Stack>

          {accountsError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {accountsError}
            </Alert>
          )}

          {accountsLoading ? (
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
          ) : visibleAccounts.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No accounts found.
            </Typography>
          ) : (
            <>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>ID</TableCell>
                    <TableCell>Platform</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pagedAccounts.map((acc) => (
                    <TableRow key={`${acc.platform}-${acc.id}`}>
                      <TableCell>{acc.name}</TableCell>
                      <TableCell sx={{ fontFamily: "monospace" }}>{acc.id}</TableCell>
                      <TableCell>
                        <Chip size="small" label={acc.platform} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <TablePagination
                component="div"
                count={visibleAccounts.length}
                page={accountPage}
                onPageChange={(_, p) => setAccountPage(p)}
                rowsPerPage={accountRowsPerPage}
                onRowsPerPageChange={(e) =>
                  setAccountRowsPerPage(parseInt(e.target.value, 10))
                }
                rowsPerPageOptions={[5, 10, 15, 20, { label: "All", value: -1 }]}
              />
            </>
          )}
        </Paper>
      )}

      {tab === "user-tokens" && isSuperAdmin && (
        <>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="h6">Issue a one-time login token</Typography>
              <Typography variant="body2" color="text.secondary">
                Generates a single-use token. Append it as <code>?token=…</code>
                to any URL on any of our frontends to sign the recipient in as
                the selected user. The raw token is shown once — copy it
                immediately.
              </Typography>
            </Box>

            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              alignItems={{ xs: "stretch", sm: "flex-end" }}
            >
              <Autocomplete
                sx={{ flex: 1 }}
                options={tokenUsers}
                getOptionLabel={(u) =>
                  `${u.first_name} ${u.last_name} <${u.email}>${
                    u.role !== "user" ? ` [${u.role}]` : ""
                  }`
                }
                value={selectedTokenUser}
                onChange={(_, val) => setSelectedTokenUser(val)}
                isOptionEqualToValue={(a, b) => a.id === b.id}
                renderInput={(params) => (
                  <TextField {...params} label="Target user" size="small" />
                )}
              />
              <TextField
                label="TTL (hours)"
                size="small"
                type="number"
                value={tokenTtlHours}
                onChange={(e) => setTokenTtlHours(e.target.value)}
                inputProps={{ min: 1, max: 24 * 30 }}
                sx={{ width: 140 }}
              />
              <Button
                variant="contained"
                onClick={handleCreateToken}
                disabled={!selectedTokenUser || creatingToken}
                startIcon={
                  creatingToken ? (
                    <CircularProgress size={16} color="inherit" />
                  ) : null
                }
              >
                {creatingToken ? "Creating…" : "Create token"}
              </Button>
            </Stack>
          </Paper>

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
                <Typography variant="h6">Existing tokens</Typography>
                <Typography variant="body2" color="text.secondary">
                  Token strings are stored hashed; only status/owner is shown.
                </Typography>
              </Box>
              <IconButton
                aria-label="reload"
                onClick={() => loadTokens()}
                disabled={tokensLoading}
              >
                <RefreshIcon />
              </IconButton>
            </Box>

            {tokensError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {tokensError}
              </Alert>
            )}

            {tokensLoading ? (
              <Box sx={{ py: 4, display: "flex", justifyContent: "center" }}>
                <CircularProgress size={28} />
              </Box>
            ) : tokens.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No tokens issued yet.
              </Typography>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>User</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell>Expires</TableCell>
                    <TableCell>Created by</TableCell>
                    <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tokens.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell>
                        {t.user_first_name} {t.user_last_name}
                        <Typography variant="caption" display="block" color="text.secondary">
                          {t.user_email}
                        </Typography>
                      </TableCell>
                      <TableCell>{t.user_role}</TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={t.status}
                          color={
                            t.status === "active"
                              ? "success"
                              : t.status === "used"
                              ? "default"
                              : "warning"
                          }
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(t.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {new Date(t.expires_at).toLocaleString()}
                      </TableCell>
                      <TableCell>{t.creator_email ?? "—"}</TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={() => handleRevokeToken(t.id)}
                          disabled={revokingTokenId === t.id}
                          aria-label="revoke"
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
        </>
      )}

      {/* Issued-token modal — shown once after creation */}
      <Dialog
        open={!!issuedToken}
        onClose={() => setIssuedToken(null)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Token created</DialogTitle>
        <DialogContent>
          {issuedToken && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Alert severity="warning">
                Copy the URL or token now. After this dialog closes the value
                cannot be retrieved.
              </Alert>
              <Alert severity="info">
                Append <code>?token=…</code> to <strong>any</strong> page URL on
                any of our frontends to log in as this user. The token is valid
                for one use only.
              </Alert>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  For user
                </Typography>
                <Typography>
                  {issuedToken.user.first_name} {issuedToken.user.last_name} (
                  {issuedToken.user.email})
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Login URL
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  <TextField
                    fullWidth
                    size="small"
                    value={buildLoginUrl(issuedToken.token)}
                    InputProps={{ readOnly: true, sx: { fontFamily: "monospace" } }}
                  />
                  <Tooltip title="Copy URL">
                    <IconButton
                      onClick={() =>
                        copyToClipboard(buildLoginUrl(issuedToken.token), "URL")
                      }
                    >
                      <ContentCopyIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Raw token
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  <TextField
                    fullWidth
                    size="small"
                    value={issuedToken.token}
                    InputProps={{ readOnly: true, sx: { fontFamily: "monospace" } }}
                  />
                  <Tooltip title="Copy token">
                    <IconButton
                      onClick={() => copyToClipboard(issuedToken.token, "Token")}
                    >
                      <ContentCopyIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Box>
              <Typography variant="caption" color="text.secondary">
                Expires: {new Date(issuedToken.expires_at).toLocaleString()}
              </Typography>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIssuedToken(null)}>Close</Button>
        </DialogActions>
      </Dialog>

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

      <Snackbar
        open={snack.open}
        autoHideDuration={5000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
          severity={snack.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snack.message}
        </Alert>
      </Snackbar>

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
