import { useEffect, useState } from "react";
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
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import RemoveCircleIcon from "@mui/icons-material/RemoveCircle";
import PrintIcon from "@mui/icons-material/Print";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { catalogoService } from "../services/catalogoService";
import { pedidoService } from "../services/pedidoService";
import { registrarLog } from "../services/logService";
import { imprimirRecibo, type DadosRecibo } from "../utils/imprimirRecibo";
import type { Produto, TipoEntrega } from "../types";

const formatador = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

const ROTULO_ENTREGA: Record<TipoEntrega, string> = {
  consumo_local: "Consumo local",
  retirada: "Retirada",
  delivery: "Delivery",
};

const ENDERECO_VAZIO = { cep: "", rua: "", numero: "", bairro: "", cidade: "", complemento: "" };

interface ItemCarrinhoPdv {
  produtoId: string;
  nome: string;
  precoUnitario: number;
  quantidade: number;
}

export default function PdvPage() {
  const [produtos, setProdutos] = useState<Produto[] | null>(null);
  const [carrinho, setCarrinho] = useState<ItemCarrinhoPdv[]>([]);
  const [tipoEntrega, setTipoEntrega] = useState<TipoEntrega>("consumo_local");
  const [endereco, setEndereco] = useState(ENDERECO_VAZIO);
  const [formaPagamento, setFormaPagamento] = useState("Dinheiro");
  const [enviando, setEnviando] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [reciboAtual, setReciboAtual] = useState<DadosRecibo | null>(null);

  useEffect(() => {
    catalogoService
      .listarProdutos()
      .then((lista) => setProdutos(lista.filter((p) => p.ativo)))
      .catch(() => setMensagem("Não foi possível carregar os produtos."));
  }, []);

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

  function montarEnderecoTexto(): string | null {
    if (tipoEntrega !== "delivery") return null;
    const { rua, numero, bairro, cidade, cep, complemento } = endereco;
    if (!rua || !numero || !bairro || !cidade) return null;
    return `${rua}, ${numero} - ${bairro}, ${cidade} (${cep})${complemento ? " - " + complemento : ""}`;
  }

  async function finalizarVenda() {
    if (carrinho.length === 0) return;

    const enderecoTexto = montarEnderecoTexto();
    if (tipoEntrega === "delivery" && !enderecoTexto) {
      setMensagem("Preencha o endereço de entrega para vendas em delivery.");
      return;
    }

    setEnviando(true);
    try {
      const pedido = await pedidoService.criarVendaBalcao({
        tipoEntrega,
        formaPagamento,
        enderecoEntrega: enderecoTexto,
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
      setReciboAtual({
        pedidoId: pedido.id,
        itens: carrinho.map((item) => ({
          nome: item.nome,
          quantidade: item.quantidade,
          precoUnitario: item.precoUnitario,
        })),
        total,
        formaPagamento,
        tipoEntregaRotulo: ROTULO_ENTREGA[tipoEntrega],
        enderecoEntrega: enderecoTexto,
        dataHora: new Date(),
      });
      setCarrinho([]);
      setEndereco(ENDERECO_VAZIO);
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
          {produtos === null ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
              <CircularProgress />
            </Box>
          ) : (
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
          )}
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

              {tipoEntrega === "delivery" && (
                <Stack spacing={1.5}>
                  <TextField
                    label="CEP"
                    value={endereco.cep}
                    onChange={(e) => setEndereco((f) => ({ ...f, cep: e.target.value }))}
                    size="small"
                    fullWidth
                  />
                  <Stack direction="row" spacing={1.5}>
                    <TextField
                      label="Rua"
                      value={endereco.rua}
                      onChange={(e) => setEndereco((f) => ({ ...f, rua: e.target.value }))}
                      size="small"
                      fullWidth
                      required
                      sx={{ flex: 2 }}
                    />
                    <TextField
                      label="Número"
                      value={endereco.numero}
                      onChange={(e) => setEndereco((f) => ({ ...f, numero: e.target.value }))}
                      size="small"
                      required
                      sx={{ flex: 1 }}
                    />
                  </Stack>
                  <TextField
                    label="Bairro"
                    value={endereco.bairro}
                    onChange={(e) => setEndereco((f) => ({ ...f, bairro: e.target.value }))}
                    size="small"
                    fullWidth
                    required
                  />
                  <TextField
                    label="Cidade"
                    value={endereco.cidade}
                    onChange={(e) => setEndereco((f) => ({ ...f, cidade: e.target.value }))}
                    size="small"
                    fullWidth
                    required
                  />
                  <TextField
                    label="Complemento (opcional)"
                    value={endereco.complemento}
                    onChange={(e) => setEndereco((f) => ({ ...f, complemento: e.target.value }))}
                    size="small"
                    fullWidth
                  />
                </Stack>
              )}

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

      <Dialog open={!!reciboAtual} onClose={() => setReciboAtual(null)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <CheckCircleIcon color="success" />
          Venda registrada!
        </DialogTitle>
        <DialogContent>
          {reciboAtual && (
            <Stack spacing={1}>
              <Typography variant="body2" color="text.secondary">
                Pedido #{reciboAtual.pedidoId.slice(0, 8)} enviado direto para a cozinha.
              </Typography>
              <Divider sx={{ my: 1 }} />
              {reciboAtual.itens.map((item, indice) => (
                <Box key={indice} sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="body2">
                    {item.quantidade}x {item.nome}
                  </Typography>
                  <Typography variant="body2">
                    {formatador.format(item.quantidade * item.precoUnitario)}
                  </Typography>
                </Box>
              ))}
              <Divider sx={{ my: 1 }} />
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="subtitle1" fontWeight={700}>
                  Total
                </Typography>
                <Typography variant="subtitle1" fontWeight={700}>
                  {formatador.format(reciboAtual.total)}
                </Typography>
              </Box>
              {reciboAtual.enderecoEntrega && (
                <Typography variant="body2" color="text.secondary">
                  Entrega: {reciboAtual.enderecoEntrega}
                </Typography>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setReciboAtual(null)}>Fechar</Button>
          <Button
            variant="contained"
            startIcon={<PrintIcon />}
            onClick={() => reciboAtual && imprimirRecibo(reciboAtual)}
          >
            Imprimir recibo
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
