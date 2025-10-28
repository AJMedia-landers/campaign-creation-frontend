"use client";
import * as React from "react";
import { ThemeProvider, CssBaseline } from "@mui/material";
import createCache from "@emotion/cache";
import { CacheProvider } from "@emotion/react";
import { theme } from "./theme";

export default function ThemeRegistry({ children }: { children: React.ReactNode }) {
  const cache = React.useMemo(() => {
    const c = createCache({ key: "mui", prepend: true });
    c.compat = true;
    return c;
  }, []);

  return (
    <CacheProvider value={cache}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </CacheProvider>
  );
}
