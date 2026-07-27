import { useState, type FormEvent } from "react";
import { Box, Paper, Stack, TextField, Button, Typography, Alert } from "@mui/material";
import LockResetRoundedIcon from "@mui/icons-material/LockResetRounded";
import { authService } from "../services/authService";

export default function RedefinirSenhaPage() {
  const token = new URLSearchParams(window.location.search).get("token") ?? "";

  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setErro(null);
    setMensagem(null);

    if (!token) {
      setErro("Link de redefinição inválido.");
      return;
    }
    if (senha !== confirmarSenha) {
      setErro("As senhas não coincidem.");
      return;
    }

    setCarregando(true);
    try {
      const resposta = await authService.redefinirSenha(token, senha);
      setMensagem(resposta.mensagem);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Este link é inválido ou já expirou.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <Box sx={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", p: 2 }}>
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
        <Stack spacing={3}>
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
              <LockResetRoundedIcon sx={{ color: "#fff", fontSize: 32 }} />
            </Box>
            <Typography variant="h1" sx={{ fontSize: "1.4rem", textAlign: "center" }}>
              Criar nova senha
            </Typography>
          </Stack>

          {mensagem ? (
            <Stack spacing={2}>
              <Alert severity="success">{mensagem}</Alert>
              <Button variant="contained" onClick={() => (window.location.href = "/")}>
                Ir para o login
              </Button>
            </Stack>
          ) : (
            <Stack spacing={2} component="form" onSubmit={handleSubmit}>
              {erro && <Alert severity="error">{erro}</Alert>}
              <TextField
                label="Nova senha"
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
                fullWidth
                slotProps={{ htmlInput: { minLength: 8 } }}
                helperText="Mínimo de 8 caracteres"
              />
              <TextField
                label="Confirmar nova senha"
                type="password"
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                required
                fullWidth
                slotProps={{ htmlInput: { minLength: 8 } }}
              />
              <Button type="submit" variant="contained" size="large" disabled={carregando} fullWidth sx={{ py: 1.5 }}>
                {carregando ? "Salvando..." : "Redefinir senha"}
              </Button>
            </Stack>
          )}
        </Stack>
      </Paper>
    </Box>
  );
}
