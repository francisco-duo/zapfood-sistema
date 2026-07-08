import { useNavigate } from "react-router-dom";
import { Stack, Typography, Button } from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlineOutlined";

export default function OrderConfirmedPage() {
  const navigate = useNavigate();

  return (
    <Stack spacing={2} sx={{ alignItems: "center", py: 8, textAlign: "center" }}>
      <CheckCircleOutlineIcon sx={{ fontSize: 72, color: "success.main" }} />
      <Typography variant="h5" fontWeight={700}>
        Pedido enviado com sucesso!
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Assim que o restaurante aprovar, você será notificado sobre o andamento do preparo.
      </Typography>
      <Button variant="contained" onClick={() => navigate("/")}>
        Voltar ao cardápio
      </Button>
    </Stack>
  );
}
