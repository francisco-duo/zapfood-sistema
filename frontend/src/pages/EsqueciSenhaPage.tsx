import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Stack, Typography, Button, Box, Alert, TextField } from "@mui/material";
import LockResetRoundedIcon from "@mui/icons-material/LockResetRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
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
    <Stack spacing={2.5} sx={{ alignItems: "center", py: 10, textAlign: "center", px: 3 }}>
      <Box
        sx={{
          width: 84,
          height: 84,
          borderRadius: "24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #FF8563 0%, #E23F1D 100%)",
        }}
      >
        <LockResetRoundedIcon sx={{ fontSize: 38, color: "#fff" }} />
      </Box>
      <Typography variant="h6">Esqueceu sua senha?</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 340 }}>
        Informe o e-mail cadastrado e enviaremos um link para você criar uma nova senha.
      </Typography>

      <Stack
        component="form"
        onSubmit={handleSubmit}
        spacing={1.5}
        sx={{ width: "100%", maxWidth: 340 }}
      >
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
        <Button
          variant="text"
          color="inherit"
          startIcon={<ArrowBackRoundedIcon />}
          onClick={() => navigate("/")}
        >
          Voltar
        </Button>
      </Stack>
    </Stack>
  );
}
