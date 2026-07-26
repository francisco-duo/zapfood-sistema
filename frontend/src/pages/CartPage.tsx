import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Stack,
  Typography,
  IconButton,
  Card,
  CardContent,
  Button,
  Avatar,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import RemoveRoundedIcon from "@mui/icons-material/RemoveRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import ShoppingBagRoundedIcon from "@mui/icons-material/ShoppingBagRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import AuthDialog from "../components/auth/AuthDialog";

const formatador = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export default function CartPage() {
  const { itens, valorTotal, alterarQuantidade, removerItem } = useCart();
  const { estaAutenticado } = useAuth();
  const [authAberto, setAuthAberto] = useState(false);
  const navigate = useNavigate();

  function handleFinalizarPedido() {
    if (!estaAutenticado) {
      setAuthAberto(true);
      return;
    }
    navigate("/checkout");
  }

  if (itens.length === 0) {
    return (
      <Stack spacing={2} sx={{ alignItems: "center", py: 10, textAlign: "center" }}>
        <Box
          sx={{
            width: 84,
            height: 84,
            borderRadius: "24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "action.hover",
          }}
        >
          <ShoppingBagRoundedIcon sx={{ fontSize: 38, color: "text.disabled" }} />
        </Box>
        <Typography variant="h6">Seu carrinho está vazio</Typography>
        <Typography variant="body2" color="text.secondary">
          Adicione itens do cardápio para começar seu pedido.
        </Typography>
        <Button variant="contained" onClick={() => navigate("/")} sx={{ mt: 1 }}>
          Ver cardápio
        </Button>
      </Stack>
    );
  }

  return (
    <Stack spacing={2.5}>
      <Typography variant="h1" sx={{ fontSize: "1.4rem" }}>
        Seu carrinho
      </Typography>

      <Stack spacing={1.25}>
        {itens.map((item) => (
          <Card key={item.produtoId} sx={{ borderRadius: "16px" }}>
            <CardContent sx={{ display: "flex", alignItems: "center", gap: 1.5, "&:last-child": { pb: 2 } }}>
              <Avatar src={item.imagemUrl} variant="rounded" sx={{ width: 52, height: 52, borderRadius: "12px" }} />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="subtitle2" fontWeight={700} noWrap>
                  {item.nome}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatador.format(item.precoUnitario)} un.
                </Typography>
              </Box>
              <Stack
                direction="row"
                spacing={0}
                sx={{ alignItems: "center", bgcolor: "action.hover", borderRadius: 999, px: 0.25 }}
              >
                <IconButton
                  size="small"
                  onClick={() => alterarQuantidade(item.produtoId, item.quantidade - 1)}
                  aria-label={`Diminuir quantidade de ${item.nome}`}
                >
                  <RemoveRoundedIcon fontSize="small" />
                </IconButton>
                <Typography fontWeight={700} sx={{ minWidth: 16, textAlign: "center", fontSize: "0.85rem" }}>
                  {item.quantidade}
                </Typography>
                <IconButton
                  size="small"
                  color="primary"
                  onClick={() => alterarQuantidade(item.produtoId, item.quantidade + 1)}
                  aria-label={`Aumentar quantidade de ${item.nome}`}
                >
                  <AddRoundedIcon fontSize="small" />
                </IconButton>
              </Stack>
              <IconButton
                size="small"
                onClick={() => removerItem(item.produtoId)}
                aria-label={`Remover ${item.nome} do carrinho`}
                sx={{ color: "text.disabled", "&:hover": { color: "error.main" } }}
              >
                <DeleteOutlineRoundedIcon fontSize="small" />
              </IconButton>
            </CardContent>
          </Card>
        ))}
      </Stack>

      <Box
        sx={{
          borderRadius: "18px",
          p: 2,
          bgcolor: "secondary.main",
          color: "#fff",
        }}
      >
        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
          <Typography sx={{ opacity: 0.7, fontWeight: 600 }}>Total do pedido</Typography>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            {formatador.format(valorTotal)}
          </Typography>
        </Stack>
        <Button
          variant="contained"
          size="large"
          fullWidth
          onClick={handleFinalizarPedido}
          endIcon={<ArrowForwardRoundedIcon />}
        >
          Finalizar Pedido
        </Button>
      </Box>

      <AuthDialog
        open={authAberto}
        onClose={() => setAuthAberto(false)}
        onSucesso={() => {
          setAuthAberto(false);
          navigate("/checkout");
        }}
      />
    </Stack>
  );
}
