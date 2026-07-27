import { useState, type FormEvent } from "react";
import { Box, Paper, Stack, TextField, Button, Typography, Alert } from "@mui/material";
import LockResetRoundedIcon from "@mui/icons-material/LockResetRounded";
import { authService } from "../services/authService";

interface EsqueciSenhaPageProps {
  onVoltar: () => void;
}

export default function EsqueciSenhaPage({ onVoltar }: EsqueciSenhaPageProps) {
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
              <LockResetRoundedIcon sx={{ color: "#fff", fontSize: 32 }} />
            </Box>
            <Typography variant="h1" sx={{ fontSize: "1.4rem", textAlign: "center" }}>
              Esqueceu sua senha?
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center" }}>
              Informe o e-mail cadastrado e enviaremos um link de redefinição.
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
          <Button type="submit" variant="contained" size="large" disabled={carregando} fullWidth sx={{ py: 1.5 }}>
            {carregando ? "Enviando..." : "Enviar link de redefinição"}
          </Button>
          <Button variant="text" color="inherit" onClick={onVoltar}>
            Voltar para o login
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}
