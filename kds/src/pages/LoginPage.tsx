import { useState, type FormEvent } from "react";
import { Box, Paper, Stack, TextField, Button, Typography, Alert } from "@mui/material";
import SoupKitchenRoundedIcon from "@mui/icons-material/SoupKitchenRounded";
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
      <Paper
        sx={{
          p: { xs: 3, sm: 5 },
          width: "100%",
          maxWidth: 440,
          border: "1px solid",
          borderColor: "divider",
          boxShadow: "0 30px 70px -20px rgba(0,0,0,0.55)",
        }}
      >
        <Stack spacing={3} component="form" onSubmit={handleSubmit}>
          <Stack spacing={1.5} sx={{ alignItems: "center" }}>
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: "18px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "linear-gradient(135deg, #5DB3FF 0%, #2E7FDB 100%)",
                boxShadow: "0 12px 28px -8px rgba(93,179,255,0.55)",
                mb: 0.5,
              }}
            >
              <SoupKitchenRoundedIcon sx={{ color: "#fff", fontSize: 32 }} />
            </Box>
            <Typography variant="h1" sx={{ fontSize: "1.4rem", textAlign: "center" }}>
              Painel da Cozinha
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
