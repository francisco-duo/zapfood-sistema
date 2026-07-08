import { Card, CardMedia, CardContent, Typography, Box, IconButton, Chip, Stack } from "@mui/material";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import RemoveCircleIcon from "@mui/icons-material/RemoveCircle";
import { useCart } from "../../context/CartContext";
import type { Produto } from "../../types";

const formatador = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export default function ProductCard({ produto }: { produto: Produto }) {
  const { itens, adicionarItem, alterarQuantidade } = useCart();
  const emPromocao = produto.precoPromocional != null && produto.precoPromocional < produto.preco;
  const itemNoCarrinho = itens.find((item) => item.produtoId === produto.id);

  return (
    <Card sx={{ display: "flex", overflow: "hidden", position: "relative" }}>
      <CardMedia
        component="img"
        image={produto.imagemUrl}
        alt={produto.nome}
        sx={{ width: 112, height: 112, flexShrink: 0, objectFit: "cover" }}
      />
      {emPromocao && (
        <Chip
          label="Promoção"
          color="error"
          size="small"
          sx={{ position: "absolute", top: 8, left: 8 }}
        />
      )}
      <CardContent sx={{ flex: 1, py: 1.25, "&:last-child": { pb: 1.25 }, minWidth: 0 }}>
        <Stack spacing={0.25}>
          <Typography variant="subtitle1" fontWeight={600} noWrap>
            {produto.nome}
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {produto.descricao}
          </Typography>

          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mt: 0.5 }}>
            <Box>
              {emPromocao ? (
                <Stack direction="row" spacing={1} sx={{ alignItems: "baseline" }}>
                  <Typography variant="body2" sx={{ textDecoration: "line-through" }} color="text.disabled">
                    {formatador.format(produto.preco)}
                  </Typography>
                  <Typography variant="subtitle1" color="error.main" fontWeight={700}>
                    {formatador.format(produto.precoPromocional!)}
                  </Typography>
                </Stack>
              ) : (
                <Typography variant="subtitle1" fontWeight={700}>
                  {formatador.format(produto.preco)}
                </Typography>
              )}
            </Box>

            {itemNoCarrinho ? (
              <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
                <IconButton
                  size="small"
                  color="primary"
                  aria-label={`Diminuir quantidade de ${produto.nome}`}
                  onClick={() => alterarQuantidade(produto.id, itemNoCarrinho.quantidade - 1)}
                >
                  <RemoveCircleIcon />
                </IconButton>
                <Typography variant="body1" fontWeight={600} sx={{ minWidth: 20, textAlign: "center" }}>
                  {itemNoCarrinho.quantidade}
                </Typography>
                <IconButton
                  size="small"
                  color="primary"
                  aria-label={`Aumentar quantidade de ${produto.nome}`}
                  onClick={() => adicionarItem(produto)}
                >
                  <AddCircleIcon />
                </IconButton>
              </Stack>
            ) : (
              <IconButton
                color="primary"
                aria-label={`Adicionar ${produto.nome} ao carrinho`}
                onClick={() => adicionarItem(produto)}
              >
                <AddCircleIcon fontSize="large" />
              </IconButton>
            )}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}
