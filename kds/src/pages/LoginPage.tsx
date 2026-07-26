import { useState, type FormEvent } from "react";
import { Box, Paper, Stack, TextField, Button, Typography, Alert } from "@mui/material";
import SoupKitchenIcon from "@mui/icons-material/SoupKitchen";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

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
      }}
    >
      <Paper elevation={4} sx={{ p: 4, width: "100%", maxWidth: 420 }}>
        <Stack spacing={3} component="form" onSubmit={handleSubmit}>
          <Stack spacing={1} sx={{ alignItems: "center" }}>
            <SoupKitchenIcon color="primary" sx={{ fontSize: 48 }} />
            <Typography variant="h1" sx={{ fontSize: "1.5rem" }}>
              zapFood — Painel da Cozinha
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center" }}>
              Acesso restrito à equipe de cozinha e administradores.
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
            size="medium"
          />
          <TextField
            label="Senha"
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
            fullWidth
          />
          <Button type="submit" variant="contained" size="large" disabled={carregando} fullWidth sx={{ py: 1.5 }}>
            {carregando ? "Entrando..." : "Entrar"}
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}
