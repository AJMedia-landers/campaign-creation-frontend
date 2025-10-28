"use client";
import { AppBar, Toolbar, Typography } from "@mui/material";
export default function Topbar() {
  return (
    <AppBar position="sticky">
      <Toolbar><Typography variant="h6">AJ Media — CA App</Typography></Toolbar>
    </AppBar>
  );
}