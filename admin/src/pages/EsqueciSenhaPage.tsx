import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Paper, Stack, TextField, Button, Typography, Alert } from "@mui/material";
import LockResetRoundedIcon from "@mui/icons-material/LockResetRounded";
import { authService } from "../services/authService";

export default function EsqueciSenhaPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setErro(null);
    setMensagem(null);
    setCarregando(true);
    try {
      const resposta = await authService.esqueciSenha(email);
      setMensagem(resposta.mensagem);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível processar a solicitação.");
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
              <LockResetRoundedIcon sx={{ color: "#fff", fontSize: 28 }} />
            </Box>
            <Typography variant="h1">Esqueceu sua senha?</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center" }}>
              Informe o e-mail cadastrado no backoffice e enviaremos um link de redefinição.
            </Typography>
          </Stack>

          {mensagem && <Alert severity="success">{mensagem}</Alert>}
          {erro && <Alert severity="error">{erro}</Alert>}

          <TextField
            label="E-mail cadastrado"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            fullWidth
          />
          <Button type="submit" variant="contained" size="large" disabled={carregando} fullWidth>
            {carregando ? "Enviando..." : "Enviar link de redefinição"}
          </Button>
          <Button variant="text" color="inherit" onClick={() => navigate("/login")}>
            Voltar para o login
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}
