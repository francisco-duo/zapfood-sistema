import { useEffect, useState } from "react";
import { Box, Typography, Stack, CircularProgress, Alert } from "@mui/material";
import LocalFireDepartmentRoundedIcon from "@mui/icons-material/LocalFireDepartmentRounded";
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
    <Stack spacing={3.5}>
      <Box
        sx={{
          borderRadius: "20px",
          p: 2.5,
          background: "linear-gradient(135deg, #1A1618 0%, #2A2226 100%)",
          color: "#fff",
        }}
      >
        <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, opacity: 0.7, letterSpacing: "0.04em" }}>
          BEM-VINDO
        </Typography>
        <Typography variant="h1" sx={{ fontSize: "1.4rem", mt: 0.25 }}>
          O que vamos pedir hoje?
        </Typography>
      </Box>

      {produtosEmPromocao.length > 0 && (
        <Box component="section">
          <Stack direction="row" spacing={0.75} sx={{ alignItems: "center", mb: 1.5 }}>
            <Box
              sx={{
                width: 26,
                height: 26,
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "linear-gradient(135deg, #FF8563 0%, #E23F1D 100%)",
              }}
            >
              <LocalFireDepartmentRoundedIcon sx={{ fontSize: 16, color: "#fff" }} />
            </Box>
            <Typography variant="h2">Promoções em alta</Typography>
          </Stack>
          <Stack spacing={1.25}>
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
            <Stack spacing={1.25}>
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
