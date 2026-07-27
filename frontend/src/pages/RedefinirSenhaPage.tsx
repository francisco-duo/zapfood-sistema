import { useState, type FormEvent } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Stack, Typography, Button, Box, Alert, TextField } from "@mui/material";
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
      <Typography variant="h6">Criar nova senha</Typography>

      {mensagem ? (
        <Stack spacing={1.5} sx={{ width: "100%", maxWidth: 340 }}>
          <Alert severity="success">{mensagem}</Alert>
          <Button variant="contained" onClick={() => navigate("/")}>
            Ir para o login
          </Button>
        </Stack>
      ) : (
        <Stack
          component="form"
          onSubmit={handleSubmit}
          spacing={1.5}
          sx={{ width: "100%", maxWidth: 340 }}
        >
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
  );
}
