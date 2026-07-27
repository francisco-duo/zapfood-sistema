import { useState, type FormEvent } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Box, Paper, Stack, TextField, Button, Typography, Alert } from "@mui/material";
import LockResetRoundedIcon from "@mui/icons-material/LockResetRounded";
import { authService } from "../services/authService";

export default function RedefinirSenhaPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") ?? "";

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
        <Stack spacing={3}>
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
              <LockResetRoundedIcon sx={{ color: "#fff", fontSize: 28 }} />
            </Box>
            <Typography variant="h1">Criar nova senha</Typography>
          </Stack>

          {mensagem ? (
            <Stack spacing={2}>
              <Alert severity="success">{mensagem}</Alert>
              <Button variant="contained" onClick={() => navigate("/login")}>
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
              <Button type="submit" variant="contained" size="large" disabled={carregando} fullWidth>
                {carregando ? "Salvando..." : "Redefinir senha"}
              </Button>
            </Stack>
          )}
        </Stack>
      </Paper>
    </Box>
  );
}
