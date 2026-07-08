import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: {
      main: "#E8541A",
      contrastText: "#FFFFFF",
    },
    secondary: {
      main: "#1B1B1F",
    },
    error: {
      main: "#D32F2F",
    },
    background: {
      default: "#FAFAFA",
    },
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily: "'Inter', 'Roboto', 'Helvetica', 'Arial', sans-serif",
    h1: { fontSize: "1.75rem", fontWeight: 700 },
    h2: { fontSize: "1.5rem", fontWeight: 700 },
    h6: { fontWeight: 600 },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          minHeight: 44,
          textTransform: "none",
          fontWeight: 600,
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
    MuiContainer: {
      defaultProps: {
        maxWidth: "sm",
      },
    },
  },
});

export default theme;
