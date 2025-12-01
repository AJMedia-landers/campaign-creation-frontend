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
} from "@mui/material";
import { useRouter } from "next/navigation";

const ADMIN_EMAILS = ["uliana.sedko@ajmedia.io", "ivan.plametiuk@ajmedia.io"];

type CurrentUser = {
  email?: string;
};

type FormState = {
  key: string;
  flowId: string;
  approvedFlowId: string;
  preferredTrackingDomain: string;
};

export default function AdminPage() {
  const router = useRouter();

  const [user, setUser] = React.useState<CurrentUser | null>(null);
  const [userLoaded, setUserLoaded] = React.useState(false);
  const [accessDenied, setAccessDenied] = React.useState(false);

  const [form, setForm] = React.useState<FormState>({
    key: "",
    flowId: "",
    approvedFlowId: "",
    preferredTrackingDomain: "go.toptrendingnewstoday.com",
  });

  const [generatedConfig, setGeneratedConfig] = React.useState<string>("");
  const [error, setError] = React.useState<string | null>(null);

  const [tab, setTab] = React.useState<"flow-config">("flow-config");

  // --------- ACCESS GUARD ----------
  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/auth/profile", { credentials: "include" });
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
  // ---------------------------------

  const handleChange =
    (field: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
    };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.key.trim() || !form.flowId.trim() || !form.approvedFlowId.trim()) {
      setError("Flow key, Flow ID and Approved Flow ID are required.");
      return;
    }

    const configObj = {
      [form.key.trim()]: {
        flowId: form.flowId.trim(),
        approvedFlowId: form.approvedFlowId.trim(),
        preferredTrackingDomain: form.preferredTrackingDomain.trim(),
      },
    };

    setGeneratedConfig(JSON.stringify(configObj, null, 2));
  };

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
    <Box sx={{ maxWidth: 800, mx: "auto", p: { xs: 2, md: 3 } }}>
      <Typography variant="h4" sx={{ mb: 1.5, fontWeight: 700 }}>
        Admin Panel
      </Typography>

      {user?.email && (
        <Typography variant="body2" sx={{ mb: 2 }}>
          Logged in as <strong>{user.email}</strong>
        </Typography>
      )}

      {/* Tabs – for now only Flow Config */}
      <Paper sx={{ mb: 3, px: 2 }}>
        <Tabs
          value={tab}
          onChange={(_, value) => setTab(value)}
          variant="scrollable"
        >
          <Tab label="Flow Config" value="flow-config" />
        </Tabs>
      </Paper>

      {tab === "flow-config" && (
        <>
          <Paper sx={{ p: 3, mb: 3 }}>
            <form onSubmit={handleSubmit}>
              <Stack spacing={2}>
                <TextField
                  label="Flow key"
                  helperText='Example: heater-us-desktop-taboola'
                  value={form.key}
                  onChange={handleChange("key")}
                  fullWidth
                  required
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

                <Box>
                  <Button type="submit" variant="contained">
                    Generate config
                  </Button>
                </Box>
              </Stack>
            </form>
          </Paper>

          
        </>
      )}
    </Box>
  );
}
