"use client";
import * as React from "react";
import { useContext } from "react";
import { AppBar, Toolbar, Typography, Box, Paper, InputBase, IconButton, Tooltip, Button, Avatar, Divider, ListItemIcon, ListItemText, Menu, MenuItem, Alert, Dialog, DialogActions, DialogContent, DialogTitle, Snackbar, TextField, InputAdornment } from "@mui/material";
import { usePageSearch } from "@/lib/PageSearchContext";
import { ColorModeContext } from "@/lib/ThemeRegistry";
import styles from "./Toolbar.module.scss";
import { useRouter } from "next/navigation";
import { useSocket } from "@/providers/SocketProvider";

import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import PersonIcon from "@mui/icons-material/Person";
import LockResetIcon from "@mui/icons-material/LockReset";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";

type CurrentUser = {
  email?: string;
  role?: string;
  name?: string;
};

export default function Topbar() {
  const { query, setQuery } = usePageSearch();
  const { mode, toggle } = useContext(ColorModeContext);
  const { setSocketToken } = useSocket();
  const router = useRouter();

  const [user, setUser] = React.useState<CurrentUser | null>(null);
  const [userLoaded, setUserLoaded] = React.useState(false);

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const menuOpen = Boolean(anchorEl);

  const [pwdOpen, setPwdOpen] = React.useState(false);
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [pwdSaving, setPwdSaving] = React.useState(false);
  const [pwdError, setPwdError] = React.useState<string | null>(null);

  const [successOpen, setSuccessOpen] = React.useState(false);
  const [showCurrentPw, setShowCurrentPw] = React.useState(false);
  const [showNewPw, setShowNewPw] = React.useState(false);

  const handleSignOut = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setSocketToken(null);
    location.href = "/signin";
  };

  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/auth/profile", {
          credentials: "include",
        });
        if (!res.ok) throw new Error("unauthorized");

        const json = await res.json();
        if (cancelled) return;

        const data = json?.data?.user ?? json?.data ?? {};
        const email: string | undefined = data?.email;
        const role: string | undefined = data?.role;
        const name: string | undefined = data?.name ?? data?.full_name;

        setUser({ email, role, name });
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setUserLoaded(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const openMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const closeMenu = () => setAnchorEl(null);

  const openChangePassword = () => {
    setPwdError(null);
    setCurrentPassword("");
    setNewPassword("");
    setPwdOpen(true);
  };

  const closeChangePassword = () => {
    if (pwdSaving) return;
    setPwdOpen(false);
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError(null);

    if (!currentPassword.trim() || !newPassword.trim()) {
      setPwdError("Please fill in both fields.");
      return;
    }
    if (newPassword.length < 8) {
      setPwdError("Password must be at least 8 characters long.");
      return;
    }
    if (!/[A-Z]/.test(newPassword)) {
      setPwdError("Password must contain at least one uppercase letter.");
      return;
    }

    try {
      setPwdSaving(true);
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          currentPassword: currentPassword.trim(),
          newPassword: newPassword.trim(),
        }),
      });

      const text = await res.text();
      let json: any = {};
      try {
        json = text ? JSON.parse(text) : {};
      } catch {}

      if (!res.ok || json?.success === false) {
        throw new Error(json?.message || "Failed to change password.");
      }

      setPwdOpen(false);
      setSuccessOpen(true);
    } catch (err: any) {
      setPwdError(err?.message || "Unknown error");
    } finally {
      setPwdSaving(false);
    }
  };

  const avatarLetter =
    user?.name?.[0] ??
    user?.email?.[0] ??
    (userLoaded ? "U" : "?");


  return (
    <>
      <AppBar position="sticky" color="primary" elevation={0}>
        <Toolbar className={styles.root} sx={{ gap: 2, minHeight: 56, px: { xs: 1.5, sm: 2 } }}>
          <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: -0.3 }}>
            AJ Media — CA App
          </Typography>

          <Box sx={{ flex: 1, maxWidth: 720 }}>
            <Paper sx={{ p: "2px 10px", display: "flex", alignItems: "center", borderRadius: 10 }}>
              <SearchIcon sx={{ mr: 1 }} />
              <InputBase
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search on this page…"
                inputProps={{ "aria-label": "page search" }}
                sx={{ flex: 1, fontSize: 14 }}
              />
              {query && (
                <IconButton onClick={() => setQuery("")} size="small" aria-label="Clear search">
                  <CloseIcon fontSize="small" />
                </IconButton>
              )}
            </Paper>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
            {mounted && (
              <Tooltip title={mode === "light" ? "Dark mode" : "Light mode"}>
                <IconButton onClick={toggle} aria-label="toggle color mode" edge="end">
                  {mode === "light" ? <DarkModeIcon /> : <LightModeIcon />}
                </IconButton>
              </Tooltip>
            )}
            <Box>
              <Tooltip
                title={
                  user?.email
                    ? `${user.email}${user?.role ? ` (${user.role})` : ""}`
                    : "Account"
                }
              >
                <IconButton
                  onClick={openMenu}
                  size="small"
                  sx={{ ml: 0.5 }}
                  aria-haspopup="true"
                  aria-controls={menuOpen ? "account-menu" : undefined}
                  aria-expanded={menuOpen ? "true" : undefined}
                >
                  <Avatar
                    sx={{ width: 32, height: 32, fontSize: 16 }}
                  >
                    {avatarLetter.toUpperCase?.() ?? "?"}
                  </Avatar>
                </IconButton>
              </Tooltip>

              <Menu
                anchorEl={anchorEl}
                id="account-menu"
                open={menuOpen}
                onClose={closeMenu}
                onClick={closeMenu}
                transformOrigin={{ horizontal: "right", vertical: "top" }}
                anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
              >
                <MenuItem disabled>
                  <ListItemIcon>
                    <PersonIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary={user?.email || "Unknown user"}
                    secondary={
                      user?.role ? `Role: ${user.role}` : undefined
                    }
                  />
                </MenuItem>
                <Divider />

                <MenuItem
                  onClick={() => {
                    closeMenu();
                    openChangePassword();
                  }}
                >
                  <ListItemIcon>
                    <LockResetIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="Change password" />
                </MenuItem>

                <Divider />

                <MenuItem
                  onClick={() => {
                    closeMenu();
                    handleSignOut();
                  }}
                >
                  <ListItemText primary="Sign out" />
                </MenuItem>
              </Menu>
            </Box>
          </Box>
        </Toolbar>
      </AppBar>
      <Dialog
        open={pwdOpen}
        onClose={closeChangePassword}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Change password</DialogTitle>
        <form onSubmit={handleChangePasswordSubmit}>
          <DialogContent dividers>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <TextField
                label="Current password"
                type={showCurrentPw ? "text" : "password"}
                fullWidth
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label={showCurrentPw ? "Hide password" : "Show password"}
                        onClick={() => setShowCurrentPw((v) => !v)}
                        onMouseDown={(e) => e.preventDefault()}
                        edge="end"
                      >
                        {showCurrentPw ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                label="New password"
                type={showNewPw ? "text" : "password"}
                fullWidth
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label={showNewPw ? "Hide password" : "Show password"}
                        onClick={() => setShowNewPw((v) => !v)}
                        onMouseDown={(e) => e.preventDefault()}
                        edge="end"
                      >
                        {showNewPw ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              {pwdError && (
                <Alert severity="error">{pwdError}</Alert>
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={closeChangePassword} disabled={pwdSaving}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={pwdSaving}
            >
              {pwdSaving ? "Saving…" : "Change password"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
      <Snackbar
        open={successOpen}
        autoHideDuration={4000}
        onClose={() => setSuccessOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSuccessOpen(false)}
          severity="success"
          variant="filled"
          sx={{ width: "100%" }}
        >
          Password changed successfully
        </Alert>
      </Snackbar>
    </>
  );
}
