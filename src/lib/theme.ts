import { createTheme, ThemeOptions } from "@mui/material/styles";

const cappuccino = "#BF8E71";
const deepBrown  = "#6E4E3B";
const sand       = "#F4EDE7";
const cardBg     = "#FFF7F0";
const divider    = "#D7C6BA";

const light: ThemeOptions = {
  palette: {
    mode: "light",
    primary:   { main: cappuccino, dark: "#9F6E51", light: "#D9AD91" },
    secondary: { main: deepBrown },
    background: { default: sand, paper: cardBg },
    divider,
    text: { primary: "#2D2A28", secondary: deepBrown },
    success: { main: "#2E7D32" },
    warning: { main: "#8A5B0A" },
  },
  shape: { borderRadius: 10 },
  components: {
    MuiPaper: { styleOverrides: { root: { backgroundImage: "none", border: `1px solid ${divider}` } } },
    MuiAppBar:{ styleOverrides: { colorPrimary:{ backgroundColor: cappuccino, color:"#fff", boxShadow:"none" } } },
    MuiDrawer:{ styleOverrides: { paper:{ backgroundColor: cardBg, borderRight:`1px solid ${divider}` } } },
    MuiButton:{ styleOverrides: { root:{ textTransform:"none", borderRadius:10 } } },
    // MuiDataGrid:{ styleOverrides:{ columnHeaders:{ backgroundColor: sand, borderBottom:`1px solid ${divider}`, fontWeight:600, color:deepBrown } } },
  },
};

const darkDivider = "#3C2E27";
const dark: ThemeOptions = {
  palette: {
    mode: "dark",
    primary:   { main: cappuccino, dark: "#9F6E51", light: "#D9AD91" },
    secondary: { main: deepBrown },
    background: { default: "#2D2A28", paper: "#3C2E27" },
    divider: darkDivider,
    text: { primary: "#F4EDE7", secondary: sand },
    success: { main: "#81C784" },
    warning: { main: "#F9A825" },
  },
  shape: { borderRadius: 10 },
  components: {
    MuiPaper: { styleOverrides: { root: { backgroundImage: "none", border: `1px solid ${darkDivider}` } } },
    MuiAppBar:{ styleOverrides: { colorPrimary:{ backgroundColor: deepBrown, color:"#fff", boxShadow:"none" } } },
    MuiDrawer:{ styleOverrides: { paper:{ backgroundColor: "#3C2E27", borderRight:`1px solid ${darkDivider}` } } },
    MuiButton:{ styleOverrides: { root:{ textTransform:"none", borderRadius:10 } } },
    // MuiDataGrid:{ styleOverrides:{ columnHeaders:{ backgroundColor: "#2D2A28", borderBottom:`1px solid ${darkDivider}`, fontWeight:600, color:sand } } },
  },
};

// function to create theme based on mode
export const getTheme = (mode: "light" | "dark") => createTheme(mode === "dark" ? dark : light);

// default export: light theme
export const theme = createTheme(light);