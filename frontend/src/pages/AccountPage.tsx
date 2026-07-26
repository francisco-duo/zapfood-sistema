import { useState } from "react";
import { Stack, Typography, Button, Card, CardContent, Avatar, Box } from "@mui/material";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import { useAuth } from "../context/AuthContext";
import AuthDialog from "../components/auth/AuthDialog";

export default function AccountPage() {
  const { usuario, estaAutenticado, logout } = useAuth();
  const [authAberto, setAuthAberto] = useState(false);

  if (!estaAutenticado) {
    return (
      <Stack spacing={2} sx={{ alignItems: "center", py: 10, textAlign: "center" }}>
        <Box
          sx={{
            width: 84,
            height: 84,
            borderRadius: "24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "action.hover",
          }}
        >
          <PersonRoundedIcon sx={{ fontSize: 38, color: "text.disabled" }} />
        </Box>
        <Typography variant="h6">Você ainda não entrou na sua conta</Typography>
        <Button variant="contained" onClick={() => setAuthAberto(true)} sx={{ mt: 1 }}>
          Entrar ou criar conta
        </Button>
        <AuthDialog open={authAberto} onClose={() => setAuthAberto(false)} onSucesso={() => setAuthAberto(false)} />
      </Stack>
    );
  }

  return (
    <Stack spacing={2.5}>
      <Typography variant="h1" sx={{ fontSize: "1.4rem" }}>
        Minha conta
      </Typography>
      <Card sx={{ borderRadius: "18px" }}>
        <CardContent sx={{ display: "flex", alignItems: "center", gap: 2, py: 2.5 }}>
          <Avatar
            sx={{
              width: 52,
              height: 52,
              fontWeight: 800,
              background: "linear-gradient(135deg, #FF8563 0%, #E23F1D 100%)",
            }}
          >
            {usuario!.nome[0]}
          </Avatar>
          <Stack sx={{ minWidth: 0 }}>
            <Typography fontWeight={700} noWrap>
              {usuario!.nome}
            </Typography>
            <Typography variant="body2" color="text.secondary" noWrap>
              {usuario!.email}
            </Typography>
          </Stack>
        </CardContent>
      </Card>
      <Button
        variant="outlined"
        color="error"
        onClick={logout}
        startIcon={<LogoutRoundedIcon />}
        sx={{ borderRadius: "14px" }}
      >
        Sair
      </Button>
    </Stack>
  );
}
