import { createTheme } from "@mui/material/styles";

/**
 * RNF003: tela pensada para tablets/monitores horizontais na cozinha,
 * lida a até 2 metros de distância — fundo escuro, alto contraste,
 * tipografia bem maior que o padrão de um app de tela de mão.
 */
const theme = createTheme({
  palette: {
    mode: "dark",
    background: {
      default: "#0B0E14",
      paper: "#161B26",
    },
    primary: {
      main: "#4DA3FF",
    },
    warning: {
      main: "#FFC53D",
    },
    error: {
      main: "#FF5449",
    },
    success: {
      main: "#3DDC84",
    },
    text: {
      primary: "#F5F7FA",
      secondary: "#B6C0D3",
    },
  },
  shape: {
    borderRadius: 14,
  },
  typography: {
    fontFamily: "'Inter', 'Roboto', 'Helvetica', 'Arial', sans-serif",
    h1: { fontSize: "2rem", fontWeight: 800 },
    h2: { fontSize: "1.5rem", fontWeight: 700 },
    h6: { fontSize: "1.25rem", fontWeight: 700 },
    body1: { fontSize: "1.15rem" },
    body2: { fontSize: "1.05rem" },
    caption: { fontSize: "0.95rem" },
  },
});

export default theme;
