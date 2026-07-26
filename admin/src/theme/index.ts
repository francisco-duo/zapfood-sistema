import { createTheme, alpha } from "@mui/material/styles";

const INK = "#0F172A";
const CORAL = "#FF5A36";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: CORAL,
      dark: "#E23F1D",
      contrastText: "#FFFFFF",
    },
    secondary: {
      main: INK,
    },
    background: {
      default: "#F5F6F9",
      paper: "#FFFFFF",
    },
    text: {
      primary: "#131A2B",
      secondary: "#6B7488",
    },
    divider: alpha(INK, 0.08),
  },
  shape: {
    borderRadius: 14,
  },
  typography: {
    fontFamily: "'Plus Jakarta Sans', 'Inter', 'Helvetica', 'Arial', sans-serif",
    h1: { fontSize: "1.4rem", fontWeight: 800, letterSpacing: "-0.01em" },
    h2: { fontSize: "1.15rem", fontWeight: 800 },
    h6: { fontWeight: 700 },
    subtitle1: { fontWeight: 700 },
    subtitle2: { fontWeight: 700 },
    button: { fontWeight: 700 },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          borderRadius: 10,
          boxShadow: "none",
        },
        contained: {
          boxShadow: "0 6px 16px -4px rgba(226,63,29,0.4)",
          "&:hover": { boxShadow: "0 8px 20px -4px rgba(226,63,29,0.45)" },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
      },
      defaultProps: {
        elevation: 0,
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          border: `1px solid ${alpha(INK, 0.07)}`,
          boxShadow: "0 1px 2px rgba(15,23,42,0.04)",
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 700,
          fontSize: "0.72rem",
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          color: "#6B7488",
          borderBottom: `1px solid ${alpha(INK, 0.08)}`,
        },
        body: {
          borderBottom: `1px solid ${alpha(INK, 0.06)}`,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 700,
          borderRadius: 8,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: { borderRadius: 18 },
      },
    },
  },
});

export default theme;
