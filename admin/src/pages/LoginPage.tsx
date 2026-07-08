import { useState, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { Box, Paper, Stack, TextField, Button, Typography, Alert } from "@mui/material";
import StorefrontIcon from "@mui/icons-material/Storefront";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { estaAutenticado, login } = useAuth();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  if (estaAutenticado) {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setErro(null);
    setCarregando(true);
    try {
      await login(email, senha);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível entrar.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <Box
      sx={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "primary.main",
        p: 2,
      }}
    >
      <Paper elevation={4} sx={{ p: 4, width: "100%", maxWidth: 400 }}>
        <Stack spacing={3} component="form" onSubmit={handleSubmit}>
          <Stack spacing={1} sx={{ alignItems: "center" }}>
            <StorefrontIcon color="primary" sx={{ fontSize: 40 }} />
            <Typography variant="h1">zapFood Backoffice</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center" }}>
              Acesso restrito a administradores e funcionários.
            </Typography>
          </Stack>

          {erro && <Alert severity="error">{erro}</Alert>}

          <TextField
            label="E-mail"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            fullWidth
          />
          <TextField
            label="Senha"
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
            fullWidth
          />
          <Button type="submit" variant="contained" size="large" disabled={carregando} fullWidth>
            {carregando ? "Entrando..." : "Entrar"}
          </Button>

          <Typography variant="caption" color="text.secondary">
            Demo: admin@zapfood.com / admin123 (proprietário) ou balcao@zapfood.com / balcao123
            (atendente).
          </Typography>
        </Stack>
      </Paper>
    </Box>
  );
}
