import { useMemo, useState } from "react";
import {
  Box,
  Typography,
  Grid,
  Paper,
  Card,
  CardContent,
  Stack,
  IconButton,
  Button,
  TextField,
  MenuItem,
  Divider,
  Alert,
  Snackbar,
} from "@mui/material";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import RemoveCircleIcon from "@mui/icons-material/RemoveCircle";
import { catalogoService } from "../services/catalogoService";
import { pedidoService } from "../services/pedidoService";
import { registrarLog } from "../services/logService";
import type { TipoEntrega } from "../types";

const formatador = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

interface ItemCarrinhoPdv {
  produtoId: string;
  nome: string;
  precoUnitario: number;
  quantidade: number;
}

export default function PdvPage() {
  const produtos = useMemo(() => catalogoService.listarProdutos().filter((p) => p.ativo), []);
  const [carrinho, setCarrinho] = useState<ItemCarrinhoPdv[]>([]);
  const [tipoEntrega, setTipoEntrega] = useState<TipoEntrega>("consumo_local");
  const [formaPagamento, setFormaPagamento] = useState("Dinheiro");
  const [enviando, setEnviando] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);

  const total = carrinho.reduce((soma, item) => soma + item.precoUnitario * item.quantidade, 0);

  function adicionar(produtoId: string, nome: string, precoUnitario: number) {
    setCarrinho((atual) => {
      const existente = atual.find((i) => i.produtoId === produtoId);
      if (existente) {
        return atual.map((i) => (i.produtoId === produtoId ? { ...i, quantidade: i.quantidade + 1 } : i));
      }
      return [...atual, { produtoId, nome, precoUnitario, quantidade: 1 }];
    });
  }

  function alterarQuantidade(produtoId: string, quantidade: number) {
    setCarrinho((atual) =>
      quantidade <= 0
        ? atual.filter((i) => i.produtoId !== produtoId)
        : atual.map((i) => (i.produtoId === produtoId ? { ...i, quantidade } : i))
    );
  }

  async function finalizarVenda() {
    if (carrinho.length === 0) return;
    setEnviando(true);
    try {
      const pedido = await pedidoService.criarVendaBalcao({
        tipoEntrega,
        formaPagamento,
        itens: carrinho.map((item) => ({
          produto_id: item.produtoId,
          quantidade: item.quantidade,
          preco_unitario_cobrado: item.precoUnitario,
        })),
      });
      registrarLog(
        "pedido",
        `Venda de balcão registrada (#${pedido.id.slice(0, 8)}) — ${formatador.format(total)}.`
      );
      setMensagem("Venda registrada e enviada direto para a cozinha!");
      setCarrinho([]);
    } catch (err) {
      setMensagem(err instanceof Error ? err.message : "Não foi possível registrar a venda.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Box>
      <Typography variant="h1" sx={{ mb: 1 }}>
        Venda de balcão (PDV)
      </Typography>
      <Alert severity="info" sx={{ mb: 2 }}>
        Pedidos lançados aqui pulam a aprovação manual e vão direto para a cozinha.
      </Alert>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Grid container spacing={1.5}>
            {produtos.map((produto) => (
              <Grid key={produto.id} size={{ xs: 12, sm: 6 }}>
                <Card
                  variant="outlined"
                  sx={{ cursor: "pointer" }}
                  onClick={() =>
                    adicionar(produto.id, produto.nome, produto.precoPromocional ?? produto.preco)
                  }
                >
                  <CardContent>
                    <Typography variant="subtitle2" fontWeight={600} noWrap>
                      {produto.nome}
                    </Typography>
                    <Typography variant="body2" color="primary.main" fontWeight={700}>
                      {formatador.format(produto.precoPromocional ?? produto.preco)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Grid>

        <Grid size={{ xs: 12, md: 5 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 1.5 }}>
              Comanda
            </Typography>

            {carrinho.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                Clique nos produtos ao lado para adicionar.
              </Typography>
            ) : (
              <Stack spacing={1} sx={{ mb: 2 }}>
                {carrinho.map((item) => (
                  <Box
                    key={item.produtoId}
                    sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}
                  >
                    <Typography variant="body2" sx={{ flex: 1 }} noWrap>
                      {item.nome}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => alterarQuantidade(item.produtoId, item.quantidade - 1)}
                    >
                      <RemoveCircleIcon fontSize="small" />
                    </IconButton>
                    <Typography variant="body2" sx={{ minWidth: 16, textAlign: "center" }}>
                      {item.quantidade}
                    </Typography>
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => alterarQuantidade(item.produtoId, item.quantidade + 1)}
                    >
                      <AddCircleIcon fontSize="small" />
                    </IconButton>
                    <Typography variant="body2" fontWeight={600} sx={{ minWidth: 70, textAlign: "right" }}>
                      {formatador.format(item.precoUnitario * item.quantidade)}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            )}

            <Divider sx={{ my: 1.5 }} />

            <Stack spacing={2}>
              <TextField
                select
                label="Modalidade"
                value={tipoEntrega}
                onChange={(e) => setTipoEntrega(e.target.value as TipoEntrega)}
                fullWidth
                size="small"
              >
                <MenuItem value="consumo_local">Consumo local</MenuItem>
                <MenuItem value="retirada">Retirada</MenuItem>
                <MenuItem value="delivery">Delivery</MenuItem>
              </TextField>
              <TextField
                select
                label="Forma de pagamento"
                value={formaPagamento}
                onChange={(e) => setFormaPagamento(e.target.value)}
                fullWidth
                size="small"
              >
                <MenuItem value="Dinheiro">Dinheiro</MenuItem>
                <MenuItem value="Pix">Pix</MenuItem>
                <MenuItem value="Cartão de Crédito">Cartão de Crédito</MenuItem>
                <MenuItem value="Cartão de Débito">Cartão de Débito</MenuItem>
              </TextField>

              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="h6">Total</Typography>
                <Typography variant="h6" color="primary.main">
                  {formatador.format(total)}
                </Typography>
              </Box>

              <Button
                variant="contained"
                size="large"
                disabled={carrinho.length === 0 || enviando}
                onClick={finalizarVenda}
              >
                {enviando ? "Enviando..." : "Enviar para a cozinha"}
              </Button>
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      <Snackbar open={!!mensagem} autoHideDuration={3000} onClose={() => setMensagem(null)} message={mensagem} />
    </Box>
  );
}
