import { createTheme, alpha } from "@mui/material/styles";

const CORAL = "#FF5A36";
const CORAL_DARK = "#E23F1D";
const INK = "#171418";

const theme = createTheme({
  palette: {
    primary: {
      main: CORAL,
      dark: CORAL_DARK,
      light: "#FF8563",
      contrastText: "#FFFFFF",
    },
    secondary: {
      main: INK,
      contrastText: "#FFFFFF",
    },
    error: {
      main: "#E23F1D",
    },
    success: {
      main: "#1FAA6D",
    },
    background: {
      default: "#FBF9F7",
      paper: "#FFFFFF",
    },
    text: {
      primary: "#1A1618",
      secondary: "#7A7178",
    },
    divider: alpha(INK, 0.08),
  },
  shape: {
    borderRadius: 20,
  },
  typography: {
    fontFamily: "'Plus Jakarta Sans', 'Inter', 'Helvetica', 'Arial', sans-serif",
    h1: { fontSize: "1.65rem", fontWeight: 800, letterSpacing: "-0.02em" },
    h2: { fontSize: "1.2rem", fontWeight: 800, letterSpacing: "-0.01em" },
    h6: { fontWeight: 700 },
    subtitle1: { fontWeight: 700 },
    subtitle2: { fontWeight: 700 },
    body2: { color: "#7A7178" },
    button: { fontWeight: 700 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundImage:
            "radial-gradient(circle at 100% 0%, rgba(255,90,54,0.07), transparent 45%)",
          backgroundAttachment: "fixed",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          minHeight: 46,
          textTransform: "none",
          borderRadius: 14,
          boxShadow: "none",
        },
        contained: {
          boxShadow: "0 8px 20px -6px rgba(226,63,29,0.55)",
          "&:hover": { boxShadow: "0 10px 24px -6px rgba(226,63,29,0.6)" },
          "&:active": { transform: "translateY(1px)" },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          minWidth: 40,
          minHeight: 40,
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
          border: `1px solid ${alpha(INK, 0.06)}`,
          boxShadow: "0 1px 2px rgba(23,20,24,0.04)",
          transition: "transform 0.18s ease, box-shadow 0.18s ease",
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 700,
          borderRadius: 999,
        },
      },
    },
    MuiContainer: {
      defaultProps: {
        maxWidth: "sm",
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 24,
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          height: 3,
          borderRadius: 3,
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 700,
        },
      },
    },
  },
});

export default theme;
