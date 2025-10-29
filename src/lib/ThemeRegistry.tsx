"use client";
import * as React from "react";
import { ThemeProvider, CssBaseline, GlobalStyles } from "@mui/material";
import createCache from "@emotion/cache";
import { CacheProvider } from "@emotion/react";
import { getTheme, theme as lightTheme } from "./theme";

export const ColorModeContext = React.createContext<{ mode: "light" | "dark"; toggle: () => void }>({
  mode: "light",
  toggle: () => {},
});

export default function ThemeRegistry({ children }: { children: React.ReactNode }) {
  const cache = React.useMemo(() => {
    const c = createCache({ key: "mui", prepend: true });
    c.compat = true;
    return c;
  }, []);

  const [mode, setMode] = React.useState<"light" | "dark">("light");
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    const saved = (localStorage.getItem("color-mode") as "light" | "dark") || "light";
    setMode(saved);
  }, []);

  const muiTheme = React.useMemo(() => (mode === "light" ? lightTheme : getTheme("dark")), [mode]);

  const toggle = React.useCallback(() => {
    setMode((m) => {
      const next = m === "light" ? "dark" : "light";
      localStorage.setItem("color-mode", next);
      return next;
    });
  }, []);

  return (
    <CacheProvider value={cache}>
      <ColorModeContext.Provider value={{ mode, toggle }}>
        <ThemeProvider theme={muiTheme}>
          <CssBaseline/>
          <GlobalStyles
            styles={(t) => ({
              ":root": {
                "--sb-bg":            t.palette.background.paper,
                "--sb-text":          t.palette.text.secondary,
                "--sb-text-active":   t.palette.text.primary,
                "--sb-divider":       t.palette.divider,
                "--sb-hover":         t.palette.mode === "light"
                                      ? "rgba(0,0,0,0.04)"
                                      : "rgba(255,255,255,0.06)",
                "--sb-active":        t.palette.mode === "light"
                                      ? "rgba(0,0,0,0.07)"
                                      : "rgba(255,255,255,0.10)",
                "--sb-shadow":        t.palette.mode === "light"
                                      ? "0 1px 3px rgba(0,0,0,0.08)"
                                      : "0 1px 3px rgba(0,0,0,0.45)",
              },
            })}
          />
          <div style={{ visibility: mounted ? "visible" : "hidden" }} className={mode}>{children}</div>
        </ThemeProvider>
      </ColorModeContext.Provider>
    </CacheProvider>
  );
}
