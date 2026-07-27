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
  useMediaQuery,
  useTheme,
  Avatar,
  Chip,
} from "@mui/material";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import PointOfSaleRoundedIcon from "@mui/icons-material/PointOfSaleRounded";
import RestaurantMenuRoundedIcon from "@mui/icons-material/RestaurantMenuRounded";
import HistoryRoundedIcon from "@mui/icons-material/HistoryRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import GroupRoundedIcon from "@mui/icons-material/GroupRounded";
import StorefrontRoundedIcon from "@mui/icons-material/StorefrontRounded";
import { useAuth } from "../../context/AuthContext";

const DRAWER_WIDTH = 264;
const INK = "#0F172A";

const ITENS_NAV = [
  { label: "Dashboard", path: "/", icon: DashboardRoundedIcon, somenteAdmin: true },
  { label: "Fila de Pedidos", path: "/pedidos", icon: ReceiptLongRoundedIcon, somenteAdmin: false },
  { label: "Venda Balcão (PDV)", path: "/pdv", icon: PointOfSaleRoundedIcon, somenteAdmin: false },
  { label: "Cardápio", path: "/cardapio", icon: RestaurantMenuRoundedIcon, somenteAdmin: true },
  { label: "Auditoria de Logs", path: "/logs", icon: HistoryRoundedIcon, somenteAdmin: true },
  { label: "Usuários", path: "/usuarios", icon: GroupRoundedIcon, somenteAdmin: true },
];

export default function AdminShell({ children }: { children: ReactNode }) {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const [drawerAberto, setDrawerAberto] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { usuario, logout } = useAuth();

  const conteudoDrawer = (
    <Box
      sx={{
        width: DRAWER_WIDTH,
        display: "flex",
        flexDirection: "column",
        height: "100%",
        bgcolor: INK,
        color: "#fff",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, px: 3, py: 3 }}>
        <Box
          sx={{
            width: 34,
            height: 34,
            borderRadius: "10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, #FF8563 0%, #E23F1D 100%)",
            flexShrink: 0,
          }}
        >
          <StorefrontRoundedIcon sx={{ color: "#fff", fontSize: 18 }} />
        </Box>
        <Typography sx={{ fontWeight: 800, fontSize: "1.05rem", letterSpacing: "-0.01em" }}>
          zapFood
        </Typography>
      </Box>

      <List sx={{ flex: 1, px: 1.5, overflowY: "auto" }}>
        {ITENS_NAV.filter((item) => !item.somenteAdmin || usuario?.perfil === "admin").map((item) => {
          const ativo = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <ListItemButton
              key={item.path}
              selected={ativo}
              onClick={() => {
                navigate(item.path);
                if (!isDesktop) setDrawerAberto(false);
              }}
              sx={{
                flexGrow: 0,
                borderRadius: "10px",
                mb: 0.5,
                color: ativo ? "#fff" : "rgba(255,255,255,0.65)",
                bgcolor: ativo ? "rgba(255,90,54,0.16)" : "transparent",
                "&:hover": { bgcolor: ativo ? "rgba(255,90,54,0.2)" : "rgba(255,255,255,0.06)" },
                "&.Mui-selected": { bgcolor: "rgba(255,90,54,0.16)" },
                "&.Mui-selected:hover": { bgcolor: "rgba(255,90,54,0.2)" },
              }}
            >
              <ListItemIcon sx={{ color: ativo ? "primary.main" : "inherit", minWidth: 38 }}>
                <Icon fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                slotProps={{ primary: { sx: { fontSize: "0.88rem", fontWeight: ativo ? 700 : 600 } } }}
              />
            </ListItemButton>
          );
        })}
      </List>

      <Box sx={{ p: 2, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5, px: 0.5 }}>
          <Avatar sx={{ bgcolor: "primary.main", width: 36, height: 36, fontSize: "0.9rem" }}>
            {usuario?.nome[0]}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" noWrap sx={{ color: "#fff", fontWeight: 700 }}>
              {usuario?.nome}
            </Typography>
            <Chip
              label={usuario?.perfil === "admin" ? "Administrador" : "Funcionário"}
              size="small"
              sx={{
                height: 18,
                fontSize: "0.62rem",
                bgcolor: "rgba(255,90,54,0.18)",
                color: "primary.main",
                fontWeight: 700,
              }}
            />
          </Box>
        </Box>
        <ListItemButton
          onClick={logout}
          sx={{ borderRadius: "10px", color: "rgba(255,255,255,0.65)", "&:hover": { bgcolor: "rgba(255,255,255,0.06)" } }}
        >
          <ListItemIcon sx={{ minWidth: 38, color: "inherit" }}>
            <LogoutRoundedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Sair" slotProps={{ primary: { sx: { fontSize: "0.88rem", fontWeight: 600 } } }} />
        </ListItemButton>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100dvh", bgcolor: "background.default" }}>
      <AppBar
        position="fixed"
        color="inherit"
        elevation={0}
        sx={{
          bgcolor: "rgba(245,246,249,0.82)",
          backdropFilter: "blur(10px)",
          borderBottom: "1px solid",
          borderColor: "divider",
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
        }}
      >
        <Toolbar>
          {!isDesktop && (
            <IconButton edge="start" onClick={() => setDrawerAberto(true)} sx={{ mr: 1 }}>
              <MenuRoundedIcon />
            </IconButton>
          )}
          <Typography variant="h6" sx={{ fontSize: "1.05rem" }}>
            {ITENS_NAV.find((item) => item.path === location.pathname)?.label ?? "zapFood Admin"}
          </Typography>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
        {isDesktop ? (
          <Drawer
            variant="permanent"
            sx={{
              "& .MuiDrawer-paper": { width: DRAWER_WIDTH, boxSizing: "border-box", border: "none" },
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
              "& .MuiDrawer-paper": { width: DRAWER_WIDTH, boxSizing: "border-box", border: "none" },
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
          p: { xs: 2, md: 3.5 },
        }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
}

