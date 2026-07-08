import { useState } from "react";
import { Stack, Typography, Button, Card, CardContent, Avatar } from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import { useAuth } from "../context/AuthContext";
import AuthDialog from "../components/auth/AuthDialog";

export default function AccountPage() {
  const { usuario, estaAutenticado, logout } = useAuth();
  const [authAberto, setAuthAberto] = useState(false);

  if (!estaAutenticado) {
    return (
      <Stack spacing={2} sx={{ alignItems: "center", py: 6, textAlign: "center" }}>
        <PersonIcon sx={{ fontSize: 64, color: "text.disabled" }} />
        <Typography variant="h6">Você ainda não entrou na sua conta</Typography>
        <Button variant="contained" onClick={() => setAuthAberto(true)}>
          Entrar ou criar conta
        </Button>
        <AuthDialog open={authAberto} onClose={() => setAuthAberto(false)} onSucesso={() => setAuthAberto(false)} />
      </Stack>
    );
  }

  return (
    <Stack spacing={2}>
      <Typography variant="h1" sx={{ fontSize: "1.5rem" }}>
        Minha conta
      </Typography>
      <Card>
        <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Avatar sx={{ bgcolor: "primary.main" }}>{usuario!.nome[0]}</Avatar>
          <Stack>
            <Typography fontWeight={600}>{usuario!.nome}</Typography>
            <Typography variant="body2" color="text.secondary">
              {usuario!.email}
            </Typography>
          </Stack>
        </CardContent>
      </Card>
      <Button variant="outlined" color="error" onClick={logout}>
        Sair
      </Button>
    </Stack>
  );
}
