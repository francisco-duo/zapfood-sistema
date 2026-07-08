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
  Divider,
  Avatar,
} from "@mui/material";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import RemoveCircleIcon from "@mui/icons-material/RemoveCircle";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlineOutlined";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
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
      <Stack spacing={2} sx={{ alignItems: "center", py: 8, textAlign: "center" }}>
        <ShoppingCartOutlinedIcon sx={{ fontSize: 64, color: "text.disabled" }} />
        <Typography variant="h6">Seu carrinho está vazio</Typography>
        <Typography variant="body2" color="text.secondary">
          Adicione itens do cardápio para começar seu pedido.
        </Typography>
        <Button variant="contained" onClick={() => navigate("/")}>
          Ver cardápio
        </Button>
      </Stack>
    );
  }

  return (
    <Stack spacing={2}>
      <Typography variant="h1" sx={{ fontSize: "1.5rem" }}>
        Seu carrinho
      </Typography>

      <Stack spacing={1.5}>
        {itens.map((item) => (
          <Card key={item.produtoId}>
            <CardContent sx={{ display: "flex", alignItems: "center", gap: 1.5, "&:last-child": { pb: 2 } }}>
              <Avatar src={item.imagemUrl} variant="rounded" sx={{ width: 56, height: 56 }} />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="subtitle2" fontWeight={600} noWrap>
                  {item.nome}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {formatador.format(item.precoUnitario)} un.
                </Typography>
              </Box>
              <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
                <IconButton
                  size="small"
                  onClick={() => alterarQuantidade(item.produtoId, item.quantidade - 1)}
                  aria-label={`Diminuir quantidade de ${item.nome}`}
                >
                  <RemoveCircleIcon />
                </IconButton>
                <Typography sx={{ minWidth: 18, textAlign: "center" }}>{item.quantidade}</Typography>
                <IconButton
                  size="small"
                  color="primary"
                  onClick={() => alterarQuantidade(item.produtoId, item.quantidade + 1)}
                  aria-label={`Aumentar quantidade de ${item.nome}`}
                >
                  <AddCircleIcon />
                </IconButton>
              </Stack>
              <IconButton
                size="small"
                color="error"
                onClick={() => removerItem(item.produtoId)}
                aria-label={`Remover ${item.nome} do carrinho`}
              >
                <DeleteOutlineIcon />
              </IconButton>
            </CardContent>
          </Card>
        ))}
      </Stack>

      <Divider />

      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="h6">Total</Typography>
        <Typography variant="h6" color="primary.main">
          {formatador.format(valorTotal)}
        </Typography>
      </Stack>

      <Button variant="contained" size="large" fullWidth onClick={handleFinalizarPedido}>
        Finalizar Pedido
      </Button>

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
