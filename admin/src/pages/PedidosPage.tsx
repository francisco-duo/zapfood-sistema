import { useCallback, useEffect, useMemo, useState } from "react";
import { Box, Typography, Grid, CircularProgress, Alert, Snackbar, Tabs, Tab } from "@mui/material";
import { pedidoService } from "../services/pedidoService";
import { catalogoService } from "../services/catalogoService";
import { registrarLog } from "../services/logService";
import PedidoCard from "../components/pedidos/PedidoCard";
import type { Pedido, Produto } from "../types";

const ABAS = [
  { value: "ativos", label: "Ativos" },
  { value: "todos", label: "Todos" },
] as const;

export default function PedidosPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [pedidoOcupado, setPedidoOcupado] = useState<string | null>(null);
  const [aba, setAba] = useState<(typeof ABAS)[number]["value"]>("ativos");
  const [mensagem, setMensagem] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    try {
      const dados = await pedidoService.listar();
      setPedidos(dados);
    } catch {
      setErro("Não foi possível carregar a fila de pedidos.");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
    const intervalo = setInterval(carregar, 8000);
    return () => clearInterval(intervalo);
  }, [carregar]);

  useEffect(() => {
    catalogoService.listarProdutos().then(setProdutos).catch(() => {});
  }, []);

  const nomesProdutos = useMemo(
    () => new Map(produtos.map((p) => [p.id, p.nome])),
    [produtos]
  );

  async function executarAcao(
    pedidoId: string,
    acao: (id: string) => Promise<Pedido>,
    mensagemLog: string
  ) {
    setPedidoOcupado(pedidoId);
    try {
      await acao(pedidoId);
      registrarLog("pedido", mensagemLog);
      setMensagem("Ação aplicada com sucesso.");
      await carregar();
    } catch (err) {
      setMensagem(err instanceof Error ? err.message : "Não foi possível concluir a ação.");
    } finally {
      setPedidoOcupado(null);
    }
  }

  const pedidosExibidos =
    aba === "ativos"
      ? pedidos.filter((p) => !["finalizado", "cancelado"].includes(p.status))
      : pedidos;

  return (
    <Box>
      <Typography variant="h1" sx={{ mb: 1 }}>
        Fila de pedidos
      </Typography>
      <Tabs value={aba} onChange={(_, valor) => setAba(valor)} sx={{ mb: 2 }}>
        {ABAS.map((item) => (
          <Tab key={item.value} value={item.value} label={item.label} />
        ))}
      </Tabs>

      {erro && <Alert severity="error" sx={{ mb: 2 }}>{erro}</Alert>}

      {carregando ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress />
        </Box>
      ) : pedidosExibidos.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          Nenhum pedido nesta visualização.
        </Typography>
      ) : (
        <Grid container spacing={2}>
          {pedidosExibidos.map((pedido) => (
            <Grid key={pedido.id} size={{ xs: 12, sm: 6, lg: 4 }}>
              <PedidoCard
                pedido={pedido}
                ocupado={pedidoOcupado === pedido.id}
                nomesProdutos={nomesProdutos}
                onAceitar={(id) =>
                  executarAcao(id, pedidoService.aprovar, `Pedido #${id.slice(0, 8)} aceito.`)
                }
                onCancelar={(id) =>
                  executarAcao(id, pedidoService.cancelar, `Pedido #${id.slice(0, 8)} cancelado.`)
                }
                onMarcarPronto={(id) =>
                  executarAcao(id, pedidoService.marcarPronto, `Pedido #${id.slice(0, 8)} marcado como pronto.`)
                }
                onSaiuParaEntrega={(id) =>
                  executarAcao(
                    id,
                    pedidoService.marcarSaiuParaEntrega,
                    `Pedido #${id.slice(0, 8)} saiu para entrega.`
                  )
                }
                onFinalizar={(id) =>
                  executarAcao(id, pedidoService.finalizar, `Pedido #${id.slice(0, 8)} finalizado.`)
                }
              />
            </Grid>
          ))}
        </Grid>
      )}

      <Snackbar
        open={!!mensagem}
        autoHideDuration={3000}
        onClose={() => setMensagem(null)}
        message={mensagem}
      />
    </Box>
  );
}
