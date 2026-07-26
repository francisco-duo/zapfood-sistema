import { createTheme, alpha } from "@mui/material/styles";

/**
 * RNF003: tela pensada para tablets/monitores horizontais na cozinha,
 * lida a até 2 metros de distância — fundo escuro, alto contraste,
 * tipografia bem maior que o padrão de um app de tela de mão.
 */
const theme = createTheme({
  palette: {
    mode: "dark",
    background: {
      default: "#080B12",
      paper: "#12161F",
    },
    primary: {
      main: "#5DB3FF",
    },
    warning: {
      main: "#FFC53D",
    },
    error: {
      main: "#FF5C57",
    },
    success: {
      main: "#3DDC84",
    },
    text: {
      primary: "#F5F7FA",
      secondary: "#8992A6",
    },
    divider: alpha("#FFFFFF", 0.08),
  },
  shape: {
    borderRadius: 16,
  },
  typography: {
    fontFamily: "'Plus Jakarta Sans', 'Inter', 'Helvetica', 'Arial', sans-serif",
    h1: { fontSize: "2rem", fontWeight: 800, letterSpacing: "-0.01em" },
    h2: { fontSize: "1.5rem", fontWeight: 700 },
    h6: { fontSize: "1.25rem", fontWeight: 700 },
    body1: { fontSize: "1.15rem" },
    body2: { fontSize: "1.05rem" },
    caption: { fontSize: "0.95rem" },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundImage:
            "radial-gradient(circle at 15% 0%, rgba(93,179,255,0.08), transparent 40%), radial-gradient(circle at 85% 100%, rgba(255,197,61,0.05), transparent 40%)",
          backgroundAttachment: "fixed",
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
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 700,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 800,
          borderRadius: 12,
        },
      },
    },
  },
});

export default theme;
