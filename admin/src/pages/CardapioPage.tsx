import { useState } from "react";
import {
  Box,
  Typography,
  Button,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Avatar,
  Chip,
  IconButton,
  Snackbar,
  Paper,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import ToggleOnIcon from "@mui/icons-material/ToggleOn";
import ToggleOffIcon from "@mui/icons-material/ToggleOff";
import { catalogoService } from "../services/catalogoService";
import ProductFormDialog from "../components/catalogo/ProductFormDialog";
import type { Produto } from "../types";

const formatador = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export default function CardapioPage() {
  const [produtos, setProdutos] = useState(() => catalogoService.listarProdutos());
  const categorias = catalogoService.listarCategorias();
  const [dialogAberto, setDialogAberto] = useState(false);
  const [produtoEmEdicao, setProdutoEmEdicao] = useState<Produto | null>(null);
  const [mensagem, setMensagem] = useState<string | null>(null);

  function nomeCategoria(categoriaId: string) {
    return categorias.find((c) => c.id === categoriaId)?.nome ?? "—";
  }

  function abrirNovo() {
    setProdutoEmEdicao(null);
    setDialogAberto(true);
  }

  function abrirEdicao(produto: Produto) {
    setProdutoEmEdicao(produto);
    setDialogAberto(true);
  }

  function salvar(dados: Omit<Produto, "id" | "ativo">, idExistente: string | null) {
    if (idExistente) {
      catalogoService.atualizarProduto(idExistente, dados);
      setMensagem("Produto atualizado.");
    } else {
      catalogoService.criarProduto(dados);
      setMensagem("Produto criado.");
    }
    setProdutos(catalogoService.listarProdutos());
    setDialogAberto(false);
  }

  function alternarAtivo(produto: Produto) {
    catalogoService.alternarAtivo(produto.id);
    setProdutos(catalogoService.listarProdutos());
    setMensagem(produto.ativo ? "Produto desativado." : "Produto reativado.");
  }

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h1">Cardápio</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={abrirNovo}>
          Novo produto
        </Button>
      </Box>

      <Paper sx={{ overflowX: "auto" }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Produto</TableCell>
              <TableCell>Categoria</TableCell>
              <TableCell align="right">Preço</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {produtos.map((produto) => (
              <TableRow key={produto.id} sx={{ opacity: produto.ativo ? 1 : 0.5 }}>
                <TableCell>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Avatar src={produto.imagemUrl} variant="rounded" />
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        {produto.nome}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {produto.descricao.slice(0, 50)}
                        {produto.descricao.length > 50 ? "…" : ""}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>{nomeCategoria(produto.categoriaId)}</TableCell>
                <TableCell align="right">
                  {produto.precoPromocional ? (
                    <>
                      <Typography variant="body2" sx={{ textDecoration: "line-through" }} color="text.disabled">
                        {formatador.format(produto.preco)}
                      </Typography>
                      <Typography variant="body2" color="secondary.main" fontWeight={700}>
                        {formatador.format(produto.precoPromocional)}
                      </Typography>
                    </>
                  ) : (
                    formatador.format(produto.preco)
                  )}
                </TableCell>
                <TableCell>
                  <Chip
                    label={produto.ativo ? "Ativo" : "Inativo"}
                    color={produto.ativo ? "success" : "default"}
                    size="small"
                  />
                </TableCell>
                <TableCell align="right">
                  <IconButton size="small" onClick={() => abrirEdicao(produto)} aria-label="Editar">
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => alternarAtivo(produto)}
                    aria-label={produto.ativo ? "Desativar" : "Reativar"}
                  >
                    {produto.ativo ? (
                      <ToggleOnIcon fontSize="small" color="success" />
                    ) : (
                      <ToggleOffIcon fontSize="small" />
                    )}
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      <ProductFormDialog
        open={dialogAberto}
        categorias={categorias}
        produtoEmEdicao={produtoEmEdicao}
        onClose={() => setDialogAberto(false)}
        onSalvar={salvar}
      />

      <Snackbar open={!!mensagem} autoHideDuration={3000} onClose={() => setMensagem(null)} message={mensagem} />
    </Box>
  );
}
