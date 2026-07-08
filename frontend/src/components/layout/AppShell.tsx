import { type ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  BottomNavigation,
  BottomNavigationAction,
  Badge,
  Container,
} from "@mui/material";
import RestaurantMenuIcon from "@mui/icons-material/RestaurantMenu";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import PersonIcon from "@mui/icons-material/Person";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";

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
      <AppBar position="sticky" elevation={0} color="primary">
        <Toolbar>
          <Typography variant="h1" sx={{ fontSize: "1.25rem", flexGrow: 1 }}>
            zapFood
          </Typography>
          {estaAutenticado && (
            <Typography variant="body2" noWrap sx={{ maxWidth: 140 }}>
              Olá, {usuario?.nome.split(" ")[0]}
            </Typography>
          )}
        </Toolbar>
      </AppBar>

      <Container component="main" sx={{ flex: 1, py: 2, pb: 9 }}>
        {children}
      </Container>

      <BottomNavigation
        showLabels
        value={rotaAtual}
        onChange={(_, valor) => navigate(valor)}
        sx={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          borderTop: "1px solid",
          borderColor: "divider",
        }}
      >
        <BottomNavigationAction label="Cardápio" value="/" icon={<RestaurantMenuIcon />} />
        <BottomNavigationAction
          label="Carrinho"
          value="/carrinho"
          icon={
            <Badge badgeContent={quantidadeTotal} color="error">
              <ShoppingCartIcon />
            </Badge>
          }
        />
        <BottomNavigationAction label="Conta" value="/conta" icon={<PersonIcon />} />
      </BottomNavigation>
    </Box>
  );
}
