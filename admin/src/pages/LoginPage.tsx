import { useState, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { Box, Paper, Stack, TextField, Button, Typography, Alert } from "@mui/material";
import StorefrontRoundedIcon from "@mui/icons-material/StorefrontRounded";
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
        p: 2,
        background: "radial-gradient(circle at 20% 20%, #1E293B 0%, #0F172A 55%, #0B1120 100%)",
      }}
    >
      <Paper
        sx={{
          p: { xs: 3, sm: 5 },
          width: "100%",
          maxWidth: 420,
          borderRadius: "24px",
          boxShadow: "0 24px 60px -16px rgba(0,0,0,0.35)",
        }}
      >
        <Stack spacing={3} component="form" onSubmit={handleSubmit}>
          <Stack spacing={1.25} sx={{ alignItems: "center" }}>
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: "16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "linear-gradient(135deg, #FF8563 0%, #E23F1D 100%)",
                boxShadow: "0 10px 24px -6px rgba(226,63,29,0.55)",
                mb: 0.5,
              }}
            >
              <StorefrontRoundedIcon sx={{ color: "#fff", fontSize: 28 }} />
            </Box>
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
        </Stack>
      </Paper>
    </Box>
  );
}
