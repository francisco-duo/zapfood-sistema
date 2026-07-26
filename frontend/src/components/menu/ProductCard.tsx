import { Card, CardMedia, CardContent, Typography, Box, IconButton, Stack } from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import RemoveRoundedIcon from "@mui/icons-material/RemoveRounded";
import LocalFireDepartmentRoundedIcon from "@mui/icons-material/LocalFireDepartmentRounded";
import { useCart } from "../../context/CartContext";
import type { Produto } from "../../types";

const formatador = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export default function ProductCard({ produto }: { produto: Produto }) {
  const { itens, adicionarItem, alterarQuantidade } = useCart();
  const emPromocao = produto.precoPromocional != null && produto.precoPromocional < produto.preco;
  const itemNoCarrinho = itens.find((item) => item.produtoId === produto.id);

  return (
    <Card
      sx={{
        display: "flex",
        overflow: "hidden",
        position: "relative",
        borderRadius: "18px",
        "&:hover": { boxShadow: "0 6px 20px -6px rgba(23,20,24,0.15)" },
      }}
    >
      <Box sx={{ position: "relative", width: 104, flexShrink: 0 }}>
        <CardMedia
          component="img"
          image={produto.imagemUrl}
          alt={produto.nome}
          sx={{ width: 104, height: "100%", minHeight: 104, objectFit: "cover" }}
        />
        {emPromocao && (
          <Box
            sx={{
              position: "absolute",
              top: 6,
              left: 6,
              display: "flex",
              alignItems: "center",
              gap: 0.25,
              px: 0.9,
              py: 0.3,
              borderRadius: 999,
              background: "linear-gradient(135deg, #FF8563 0%, #E23F1D 100%)",
              boxShadow: "0 3px 8px -2px rgba(226,63,29,0.6)",
            }}
          >
            <LocalFireDepartmentRoundedIcon sx={{ fontSize: 12, color: "#fff" }} />
            <Typography sx={{ fontSize: "0.62rem", fontWeight: 800, color: "#fff", lineHeight: 1 }}>
              OFERTA
            </Typography>
          </Box>
        )}
      </Box>
      <CardContent sx={{ flex: 1, py: 1.25, "&:last-child": { pb: 1.25 }, minWidth: 0 }}>
        <Stack spacing={0.25}>
          <Typography variant="subtitle1" fontWeight={700} noWrap sx={{ letterSpacing: "-0.01em" }}>
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
              fontSize: "0.8rem",
              lineHeight: 1.35,
            }}
          >
            {produto.descricao}
          </Typography>

          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mt: 0.5 }}>
            <Box>
              {emPromocao ? (
                <Stack direction="row" spacing={0.75} sx={{ alignItems: "baseline" }}>
                  <Typography variant="caption" sx={{ textDecoration: "line-through" }} color="text.disabled">
                    {formatador.format(produto.preco)}
                  </Typography>
                  <Typography variant="subtitle1" color="primary.dark" fontWeight={800}>
                    {formatador.format(produto.precoPromocional!)}
                  </Typography>
                </Stack>
              ) : (
                <Typography variant="subtitle1" fontWeight={800}>
                  {formatador.format(produto.preco)}
                </Typography>
              )}
            </Box>

            {itemNoCarrinho ? (
              <Stack
                direction="row"
                spacing={0}
                sx={{
                  alignItems: "center",
                  bgcolor: "primary.main",
                  borderRadius: 999,
                  px: 0.25,
                }}
              >
                <IconButton
                  size="small"
                  aria-label={`Diminuir quantidade de ${produto.nome}`}
                  onClick={() => alterarQuantidade(produto.id, itemNoCarrinho.quantidade - 1)}
                  sx={{ color: "primary.contrastText" }}
                >
                  <RemoveRoundedIcon fontSize="small" />
                </IconButton>
                <Typography
                  fontWeight={800}
                  sx={{ minWidth: 16, textAlign: "center", color: "primary.contrastText", fontSize: "0.85rem" }}
                >
                  {itemNoCarrinho.quantidade}
                </Typography>
                <IconButton
                  size="small"
                  aria-label={`Aumentar quantidade de ${produto.nome}`}
                  onClick={() => adicionarItem(produto)}
                  sx={{ color: "primary.contrastText" }}
                >
                  <AddRoundedIcon fontSize="small" />
                </IconButton>
              </Stack>
            ) : (
              <IconButton
                aria-label={`Adicionar ${produto.nome} ao carrinho`}
                onClick={() => adicionarItem(produto)}
                sx={{
                  bgcolor: "primary.main",
                  color: "primary.contrastText",
                  width: 34,
                  height: 34,
                  boxShadow: "0 6px 14px -4px rgba(226,63,29,0.6)",
                  "&:hover": { bgcolor: "primary.dark" },
                }}
              >
                <AddRoundedIcon fontSize="small" />
              </IconButton>
            )}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}
