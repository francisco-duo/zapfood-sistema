import { useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Divider,
  useMediaQuery,
  useTheme,
  Avatar,
  Chip,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import DashboardIcon from "@mui/icons-material/Dashboard";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import PointOfSaleIcon from "@mui/icons-material/PointOfSale";
import RestaurantMenuIcon from "@mui/icons-material/RestaurantMenu";
import HistoryIcon from "@mui/icons-material/History";
import LogoutIcon from "@mui/icons-material/Logout";
import { useAuth } from "../../context/AuthContext";

const DRAWER_WIDTH = 240;

const ITENS_NAV = [
  { label: "Dashboard", path: "/", icon: <DashboardIcon /> },
  { label: "Fila de Pedidos", path: "/pedidos", icon: <ReceiptLongIcon /> },
  { label: "Venda Balcão (PDV)", path: "/pdv", icon: <PointOfSaleIcon /> },
  { label: "Cardápio", path: "/cardapio", icon: <RestaurantMenuIcon /> },
  { label: "Auditoria de Logs", path: "/logs", icon: <HistoryIcon /> },
];

export default function AdminShell({ children }: { children: ReactNode }) {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const [drawerAberto, setDrawerAberto] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { usuario, logout } = useAuth();

  const conteudoDrawer = (
    <Box sx={{ width: DRAWER_WIDTH, display: "flex", flexDirection: "column", height: "100%" }}>
      <Toolbar>
        <Typography variant="h6" color="primary.main" fontWeight={700}>
          zapFood Admin
        </Typography>
      </Toolbar>
      <Divider />
      <List sx={{ flex: 1 }}>
        {ITENS_NAV.map((item) => (
          <ListItemButton
            key={item.path}
            selected={location.pathname === item.path}
            onClick={() => {
              navigate(item.path);
              if (!isDesktop) setDrawerAberto(false);
            }}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
      </List>
      <Divider />
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
          <Avatar sx={{ bgcolor: "secondary.main" }}>{usuario?.nome[0]}</Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" fontWeight={600} noWrap>
              {usuario?.nome}
            </Typography>
            <Chip
              label={usuario?.perfil === "admin" ? "Administrador" : "Funcionário"}
              size="small"
              color={usuario?.perfil === "admin" ? "primary" : "default"}
              sx={{ height: 18, fontSize: "0.65rem" }}
            />
          </Box>
        </Box>
        <ListItemButton onClick={logout} sx={{ borderRadius: 1 }}>
          <ListItemIcon>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText primary="Sair" />
        </ListItemButton>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100dvh" }}>
      <AppBar
        position="fixed"
        color="inherit"
        elevation={0}
        sx={{
          borderBottom: "1px solid",
          borderColor: "divider",
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
        }}
      >
        <Toolbar>
          {!isDesktop && (
            <IconButton edge="start" onClick={() => setDrawerAberto(true)} sx={{ mr: 1 }}>
              <MenuIcon />
            </IconButton>
          )}
          <Typography variant="h6">
            {ITENS_NAV.find((item) => item.path === location.pathname)?.label ?? "zapFood Admin"}
          </Typography>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
        {isDesktop ? (
          <Drawer
            variant="permanent"
            sx={{
              "& .MuiDrawer-paper": { width: DRAWER_WIDTH, boxSizing: "border-box" },
            }}
            open
          >
            {conteudoDrawer}
          </Drawer>
        ) : (
          <Drawer
            variant="temporary"
            open={drawerAberto}
            onClose={() => setDrawerAberto(false)}
            ModalProps={{ keepMounted: true }}
            sx={{
              "& .MuiDrawer-paper": { width: DRAWER_WIDTH, boxSizing: "border-box" },
            }}
          >
            {conteudoDrawer}
          </Drawer>
        )}
      </Box>

      <Box
        component="main"
        sx={{
          flex: 1,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          p: { xs: 2, md: 3 },
        }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
}
