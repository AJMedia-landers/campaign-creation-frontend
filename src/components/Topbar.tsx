"use client";
import * as React from "react";
import { useContext } from "react";
import { AppBar, Toolbar, Typography, Box, Paper, InputBase, IconButton, Tooltip } from "@mui/material";
import { usePageSearch } from "@/lib/PageSearchContext";
import { ColorModeContext } from "@/lib/ThemeRegistry";
import styles from "./Toolbar.module.scss";

import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";

export default function Topbar() {
  const { query, setQuery } = usePageSearch();
  const { mode, toggle } = useContext(ColorModeContext);

  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);
  return (
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
        {mounted && (
          <Tooltip title={mode === "light" ? "Dark mode" : "Light mode"}>
            <IconButton onClick={toggle} aria-label="toggle color mode" edge="end">
              {mode === "light" ? <DarkModeIcon /> : <LightModeIcon />}
            </IconButton>
          </Tooltip>
        )}
      </Toolbar>
    </AppBar>
  );
}
