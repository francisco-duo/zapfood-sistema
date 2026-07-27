import { useEffect, useRef, useState } from "react";
import { Stack, Typography, Button, Box, Alert, CircularProgress } from "@mui/material";
import MarkEmailUnreadRoundedIcon from "@mui/icons-material/MarkEmailUnreadRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import { useAuth } from "../context/AuthContext";
import { authService } from "../services/authService";

const INTERVALO_POLLING_MS = 4000;

export default function VerifyEmailPendingPage() {
  const { usuario, logout, atualizarUsuario } = useAuth();
  const [reenviando, setReenviando] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const emVooRef = useRef(false);

  useEffect(() => {
    const intervalo = setInterval(async () => {
      if (emVooRef.current) return;
      emVooRef.current = true;
      try {
        await atualizarUsuario();
      } catch {
        // silencioso: a próxima tentativa de polling cobre falhas de rede pontuais
      } finally {
        emVooRef.current = false;
      }
    }, INTERVALO_POLLING_MS);
    return () => clearInterval(intervalo);
  }, [atualizarUsuario]);

  async function handleReenviar() {
    setReenviando(true);
    setMensagem(null);
    setErro(null);
    try {
      const resposta = await authService.reenviarVerificacao();
      setMensagem(resposta.mensagem);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível reenviar o e-mail.");
    } finally {
      setReenviando(false);
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
        <MarkEmailUnreadRoundedIcon sx={{ fontSize: 38, color: "#fff" }} />
      </Box>
      <Typography variant="h6">Confirme seu e-mail</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 340 }}>
        Enviamos um link de confirmação para <strong>{usuario?.email}</strong>. Abra sua caixa de
        entrada e clique no link — esta página atualiza sozinha assim que confirmar.
      </Typography>
      <CircularProgress size={22} thickness={5} sx={{ color: "text.disabled" }} />
      {mensagem && (
        <Alert severity="success" sx={{ width: "100%", maxWidth: 340 }}>
          {mensagem}
        </Alert>
      )}
      {erro && (
        <Alert severity="error" sx={{ width: "100%", maxWidth: 340 }}>
          {erro}
        </Alert>
      )}
      <Stack spacing={1.25} sx={{ width: "100%", maxWidth: 340, pt: 1 }}>
        <Button variant="contained" onClick={handleReenviar} disabled={reenviando}>
          {reenviando ? "Enviando..." : "Reenviar e-mail de confirmação"}
        </Button>
        <Button variant="text" color="inherit" startIcon={<LogoutRoundedIcon />} onClick={logout}>
          Sair
        </Button>
      </Stack>
    </Stack>
  );
}
