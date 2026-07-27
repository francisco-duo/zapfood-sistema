import { useNavigate } from "react-router-dom";
import { Stack, Typography, Button, Box } from "@mui/material";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";

export default function OrderConfirmedPage() {
  const navigate = useNavigate();

  return (
    <Stack spacing={2} sx={{ alignItems: "center", py: 10, textAlign: "center" }}>
      <Box
        sx={{
          width: 88,
          height: 88,
          borderRadius: "28px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #34D399 0%, #1FAA6D 100%)",
          boxShadow: "0 12px 28px -8px rgba(31,170,109,0.55)",
          mb: 1,
        }}
      >
        <CheckRoundedIcon sx={{ fontSize: 46, color: "#fff" }} />
      </Box>
      <Typography variant="h5" sx={{ letterSpacing: "-0.01em", fontWeight: 800 }}>
        Pedido enviado com sucesso!
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 280 }}>
        Assim que o restaurante aprovar, você será notificado sobre o andamento do preparo.
      </Typography>
      <Button variant="contained" onClick={() => navigate("/")} sx={{ mt: 1 }}>
        Voltar ao cardápio
      </Button>
    </Stack>
  );
}
