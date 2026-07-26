import { useEffect, useRef, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  Stack,
  Typography,
  Card,
  CardContent,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  TextField,
  MenuItem,
  Button,
  Alert,
  Box,
} from "@mui/material";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { pedidoService } from "../services/pedidoService";
import type { EnderecoEntrega, TipoEntrega } from "../types";

const formatador = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

const enderecoVazio: EnderecoEntrega = {
  cep: "",
  rua: "",
  numero: "",
  bairro: "",
  cidade: "",
  complemento: "",
};

export default function CheckoutPage() {
  const { itens, valorTotal, limparCarrinho } = useCart();
  const { estaAutenticado } = useAuth();
  const navigate = useNavigate();

  const [tipoEntrega, setTipoEntrega] = useState<TipoEntrega>("delivery");
  const [endereco, setEndereco] = useState<EnderecoEntrega>(enderecoVazio);
  const [formaPagamento, setFormaPagamento] = useState("Pix");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const pedidoConcluido = useRef(false);

  useEffect(() => {
    if (pedidoConcluido.current) return;
    if (!estaAutenticado) {
      navigate("/carrinho", { replace: true });
    } else if (itens.length === 0) {
      navigate("/", { replace: true });
    }
  }, [estaAutenticado, itens.length, navigate]);

  if (!pedidoConcluido.current && (!estaAutenticado || itens.length === 0)) {
    return null;
  }

  function atualizarEndereco<K extends keyof EnderecoEntrega>(campo: K, valor: string) {
    setEndereco((atual) => ({ ...atual, [campo]: valor }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setErro(null);
    setEnviando(true);
    try {
      await pedidoService.enviar({
        itens,
        valorTotal,
        checkout: {
          tipoEntrega,
          formaPagamento,
          endereco: tipoEntrega === "delivery" ? endereco : undefined,
        },
      });
      pedidoConcluido.current = true;
      limparCarrinho();
      navigate("/pedido-confirmado", { replace: true });
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível concluir o pedido.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Stack component="form" spacing={2.5} onSubmit={handleSubmit}>
      <Typography variant="h1" sx={{ fontSize: "1.4rem" }}>
        Finalizar pedido
      </Typography>

      {erro && <Alert severity="error">{erro}</Alert>}

      <Card sx={{ borderRadius: "18px" }}>
        <CardContent>
          <FormControl fullWidth>
            <FormLabel id="tipo-entrega-label">Como deseja receber?</FormLabel>
            <RadioGroup
              aria-labelledby="tipo-entrega-label"
              value={tipoEntrega}
              onChange={(e) => setTipoEntrega(e.target.value as TipoEntrega)}
            >
              <FormControlLabel value="delivery" control={<Radio />} label="Receber em casa (delivery)" />
              <FormControlLabel value="retirada" control={<Radio />} label="Retirar no local" />
            </RadioGroup>
          </FormControl>

          {tipoEntrega === "delivery" && (
            <Stack spacing={2} sx={{ mt: 2 }}>
              <TextField
                label="CEP"
                value={endereco.cep}
                onChange={(e) => atualizarEndereco("cep", e.target.value)}
                required
                fullWidth
              />
              <Stack direction="row" spacing={2}>
                <TextField
                  label="Rua"
                  value={endereco.rua}
                  onChange={(e) => atualizarEndereco("rua", e.target.value)}
                  required
                  fullWidth
                  sx={{ flex: 2 }}
                />
                <TextField
                  label="Número"
                  value={endereco.numero}
                  onChange={(e) => atualizarEndereco("numero", e.target.value)}
                  required
                  sx={{ flex: 1 }}
                />
              </Stack>
              <TextField
                label="Bairro"
                value={endereco.bairro}
                onChange={(e) => atualizarEndereco("bairro", e.target.value)}
                required
                fullWidth
              />
              <TextField
                label="Cidade"
                value={endereco.cidade}
                onChange={(e) => atualizarEndereco("cidade", e.target.value)}
                required
                fullWidth
              />
              <TextField
                label="Complemento (opcional)"
                value={endereco.complemento}
                onChange={(e) => atualizarEndereco("complemento", e.target.value)}
                fullWidth
              />
            </Stack>
          )}
        </CardContent>
      </Card>

      <Card sx={{ borderRadius: "18px" }}>
        <CardContent>
          <TextField
            select
            label="Forma de pagamento"
            value={formaPagamento}
            onChange={(e) => setFormaPagamento(e.target.value)}
            fullWidth
            required
          >
            <MenuItem value="Pix">Pix</MenuItem>
            <MenuItem value="Cartão de Crédito">Cartão de Crédito</MenuItem>
            <MenuItem value="Cartão de Débito">Cartão de Débito</MenuItem>
            <MenuItem value="Dinheiro">Dinheiro</MenuItem>
          </TextField>
        </CardContent>
      </Card>

      <Box sx={{ borderRadius: "18px", p: 2, bgcolor: "secondary.main", color: "#fff" }}>
        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
          <Typography sx={{ opacity: 0.7, fontWeight: 600 }}>Total do pedido</Typography>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            {formatador.format(valorTotal)}
          </Typography>
        </Stack>
        <Button
          type="submit"
          variant="contained"
          size="large"
          fullWidth
          disabled={enviando}
          endIcon={!enviando && <ArrowForwardRoundedIcon />}
        >
          {enviando ? "Enviando pedido..." : "Confirmar Pedido"}
        </Button>
      </Box>
    </Stack>
  );
}
