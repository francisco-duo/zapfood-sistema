import { useEffect, useState } from "react";
import { Box, Typography, Stack, CircularProgress, Alert, Chip } from "@mui/material";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import { buscarCardapio } from "../services/menuService";
import ProductCard from "../components/menu/ProductCard";
import type { Categoria, Produto } from "../types";

export default function MenuPage() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    buscarCardapio()
      .then((dados) => {
        setCategorias(dados.categorias);
        setProdutos(dados.produtos);
      })
      .catch(() => setErro("Não foi possível carregar o cardápio agora. Tente novamente em instantes."))
      .finally(() => setCarregando(false));
  }, []);

  if (carregando) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (erro) {
    return <Alert severity="error">{erro}</Alert>;
  }

  const produtosEmPromocao = produtos.filter(
    (produto) => produto.precoPromocional != null && produto.precoPromocional < produto.preco
  );

  return (
    <Stack spacing={3}>
      {produtosEmPromocao.length > 0 && (
        <Box component="section">
          <Chip
            icon={<LocalOfferIcon />}
            label="Promoções"
            color="error"
            sx={{ mb: 1.5, fontWeight: 600 }}
          />
          <Stack spacing={1.5}>
            {produtosEmPromocao.map((produto) => (
              <ProductCard key={produto.id} produto={produto} />
            ))}
          </Stack>
        </Box>
      )}

      {categorias.map((categoria) => {
        const produtosDaCategoria = produtos.filter((p) => p.categoriaId === categoria.id);
        if (produtosDaCategoria.length === 0) return null;
        return (
          <Box component="section" key={categoria.id}>
            <Typography variant="h2" sx={{ mb: 1.5 }}>
              {categoria.nome}
            </Typography>
            <Stack spacing={1.5}>
              {produtosDaCategoria.map((produto) => (
                <ProductCard key={produto.id} produto={produto} />
              ))}
            </Stack>
          </Box>
        );
      })}
    </Stack>
  );
}
