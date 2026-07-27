import { useEffect, useRef, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Stack, Typography, Button, Box, Alert, CircularProgress } from "@mui/material";
import MarkEmailReadRoundedIcon from "@mui/icons-material/MarkEmailReadRounded";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import { useAuth } from "../context/AuthContext";
import { authService } from "../services/authService";

type Estado = "verificando" | "sucesso" | "erro";

export default function VerifyEmailConfirmPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { estaAutenticado, atualizarUsuario } = useAuth();
  const [estado, setEstado] = useState<Estado>("verificando");
  const [mensagem, setMensagem] = useState("");
  const executouRef = useRef(false);

  useEffect(() => {
    if (executouRef.current) return;
    executouRef.current = true;

    const token = searchParams.get("token");
    if (!token) {
      setEstado("erro");
      setMensagem("Link de confirmação inválido.");
      return;
    }

    authService
      .verificarEmail(token)
      .then(async (resposta) => {
        setEstado("sucesso");
        setMensagem(resposta.mensagem);
        if (estaAutenticado) {
          await atualizarUsuario().catch(() => undefined);
        }
      })
      .catch((err) => {
        setEstado("erro");
        setMensagem(err instanceof Error ? err.message : "Este link é inválido ou já expirou.");
      });
  }, [searchParams, estaAutenticado, atualizarUsuario]);

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
          background:
            estado === "erro"
              ? "linear-gradient(135deg, #FF8563 0%, #E23F1D 100%)"
              : "linear-gradient(135deg, #22C55E 0%, #16A34A 100%)",
        }}
      >
        {estado === "erro" ? (
          <ErrorOutlineRoundedIcon sx={{ fontSize: 38, color: "#fff" }} />
        ) : (
          <MarkEmailReadRoundedIcon sx={{ fontSize: 38, color: "#fff" }} />
        )}
      </Box>

      {estado === "verificando" && (
        <>
          <Typography variant="h6">Confirmando seu e-mail...</Typography>
          <CircularProgress size={22} thickness={5} sx={{ color: "text.disabled" }} />
        </>
      )}

      {estado === "sucesso" && (
        <>
          <Typography variant="h6">E-mail confirmado!</Typography>
          <Alert severity="success" sx={{ width: "100%", maxWidth: 340 }}>
            {mensagem}
          </Alert>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 340 }}>
            Se você abriu este link em outro dispositivo ou aba, pode voltar para a tela onde
            estava — ela vai liberar o acesso automaticamente.
          </Typography>
          <Button variant="contained" onClick={() => navigate("/")}>
            Ir para o zapFood
          </Button>
        </>
      )}

      {estado === "erro" && (
        <>
          <Typography variant="h6">Não foi possível confirmar</Typography>
          <Alert severity="error" sx={{ width: "100%", maxWidth: 340 }}>
            {mensagem}
          </Alert>
          <Button variant="contained" onClick={() => navigate("/")}>
            Voltar para o zapFood
          </Button>
        </>
      )}
    </Stack>
  );
}
