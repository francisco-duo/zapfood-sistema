import { type ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Badge,
  Container,
  Avatar,
} from "@mui/material";
import RestaurantMenuRoundedIcon from "@mui/icons-material/RestaurantMenuRounded";
import ShoppingBagRoundedIcon from "@mui/icons-material/ShoppingBagRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";

const ITENS_NAV = [
  { label: "Cardápio", path: "/", icon: RestaurantMenuRoundedIcon },
  { label: "Carrinho", path: "/carrinho", icon: ShoppingBagRoundedIcon },
  { label: "Conta", path: "/conta", icon: PersonRoundedIcon },
];

export default function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { quantidadeTotal } = useCart();
  const { estaAutenticado, usuario } = useAuth();

  const rotaAtual = location.pathname.startsWith("/carrinho")
    ? "/carrinho"
    : location.pathname.startsWith("/conta")
      ? "/conta"
      : "/";

  return (
    <Box sx={{ minHeight: "100dvh", display: "flex", flexDirection: "column", bgcolor: "background.default" }}>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: "background.default",
          color: "text.primary",
          borderBottom: "1px solid",
          borderColor: "divider",
          backdropFilter: "blur(10px)",
        }}
      >
        <Toolbar sx={{ gap: 1.25 }}>
          <Box
            sx={{
              width: 34,
              height: 34,
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "linear-gradient(135deg, #FF8563 0%, #E23F1D 100%)",
              boxShadow: "0 4px 12px -2px rgba(226,63,29,0.5)",
              flexShrink: 0,
            }}
          >
            <RestaurantMenuRoundedIcon sx={{ color: "#fff", fontSize: 18 }} />
          </Box>
          <Typography variant="h1" sx={{ fontSize: "1.15rem", flexGrow: 1, letterSpacing: "-0.02em" }}>
            zapFood
          </Typography>
          {estaAutenticado && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
              <Typography variant="body2" noWrap sx={{ maxWidth: 110, fontWeight: 600, color: "text.primary" }}>
                {usuario?.nome.split(" ")[0]}
              </Typography>
              <Avatar sx={{ width: 28, height: 28, fontSize: "0.8rem", bgcolor: "primary.main" }}>
                {usuario?.nome[0]}
              </Avatar>
            </Box>
          )}
        </Toolbar>
      </AppBar>

      <Container component="main" sx={{ flex: 1, py: 2.5, pb: 12 }}>
        {children}
      </Container>

      <Box
        sx={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          pb: "env(safe-area-inset-bottom, 0px)",
          pointerEvents: "none",
        }}
      >
        <Box
          sx={{
            pointerEvents: "auto",
            display: "flex",
            gap: 0.5,
            m: 2,
            p: 0.75,
            borderRadius: 999,
            bgcolor: "rgba(255,255,255,0.85)",
            backdropFilter: "blur(16px)",
            border: "1px solid",
            borderColor: "divider",
            boxShadow: "0 12px 32px -8px rgba(23,20,24,0.18)",
            width: "min(360px, calc(100vw - 32px))",
          }}
        >
          {ITENS_NAV.map((item) => {
            const ativo = rotaAtual === item.path;
            const Icon = item.icon;
            return (
              <Box
                key={item.path}
                onClick={() => navigate(item.path)}
                sx={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 0.25,
                  py: 1,
                  borderRadius: 999,
                  cursor: "pointer",
                  color: ativo ? "primary.contrastText" : "text.secondary",
                  bgcolor: ativo ? "primary.main" : "transparent",
                  boxShadow: ativo ? "0 6px 16px -4px rgba(226,63,29,0.55)" : "none",
                  transition: "all 0.2s ease",
                }}
              >
                <Badge badgeContent={item.path === "/carrinho" ? quantidadeTotal : 0} color="error">
                  <Icon sx={{ fontSize: 22 }} />
                </Badge>
                <Typography sx={{ fontSize: "0.68rem", fontWeight: 700, lineHeight: 1 }}>
                  {item.label}
                </Typography>
              </Box>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
}
