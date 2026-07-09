import { useCallback, useEffect, useState } from "react";
import { Box, Typography, Chip, CircularProgress, Alert } from "@mui/material";
import WifiIcon from "@mui/icons-material/Wifi";
import WifiOffIcon from "@mui/icons-material/WifiOff";
import { kdsService } from "./services/kdsService";
import { pedidoService } from "./services/pedidoService";
import { useKdsSocket } from "./hooks/useKdsSocket";
import { useBeep } from "./hooks/useBeep";
import PedidoCard from "./components/PedidoCard";
import type { MensagemKds, Pedido, PedidoNaFila } from "./types";

function paraPedidoNaFila(pedido: Pedido): PedidoNaFila {
  return { ...pedido, entrouNaFilaEm: new Date(pedido.criado_em).getTime() };
}

export default function App() {
  const [fila, setFila] = useState<PedidoNaFila[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [pedidoOcupado, setPedidoOcupado] = useState<string | null>(null);
  const tocarBeep = useBeep();

  useEffect(() => {
    kdsService
      .obterFilaAtual()
      .then((pedidos) => setFila(pedidos.map(paraPedidoNaFila)))
      .catch(() => setErro("Não foi possível carregar a fila da cozinha."));
  }, []);

  const handleMensagem = useCallback(
    (mensagem: MensagemKds) => {
      if (mensagem.tipo === "pedido_em_preparo") {
        setFila((atual) => {
          const base = atual ?? [];
          if (base.some((p) => p.id === mensagem.pedido.id)) return base;
          return [...base, { ...mensagem.pedido, entrouNaFilaEm: Date.now() }];
        });
        tocarBeep();
      } else if (mensagem.tipo === "pedido_removido") {
        setFila((atual) => (atual ?? []).filter((p) => p.id !== mensagem.pedido_id));
      }
    },
    [tocarBeep]
  );

  const { conectado } = useKdsSocket(handleMensagem);

  async function handleMarcarPronto(pedidoId: string) {
    setPedidoOcupado(pedidoId);
    try {
      await pedidoService.marcarPronto(pedidoId);
      // A remoção do card é conduzida pelo evento "pedido_removido" via WebSocket,
      // mantendo uma única fonte de verdade para o estado da fila.
    } catch {
      setErro("Não foi possível marcar o pedido como pronto. Tente novamente.");
    } finally {
      setPedidoOcupado(null);
    }
  }

  return (
    <Box sx={{ minHeight: "100dvh", p: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h1">Cozinha — Fila de Preparo</Typography>
        <Chip
          icon={conectado ? <WifiIcon /> : <WifiOffIcon />}
          label={conectado ? "Conectado em tempo real" : "Reconectando..."}
          color={conectado ? "success" : "warning"}
          sx={{ fontSize: "1rem", height: 40, px: 1 }}
        />
      </Box>

      {erro && (
        <Alert severity="error" sx={{ mb: 2, fontSize: "1.05rem" }} onClose={() => setErro(null)}>
          {erro}
        </Alert>
      )}

      {fila === null ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress size={48} />
        </Box>
      ) : fila.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 10 }}>
          <Typography variant="h2" color="text.secondary">
            Nenhum pedido em preparo no momento.
          </Typography>
        </Box>
      ) : (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
            gap: 3,
          }}
        >
          {fila.map((pedido) => (
            <PedidoCard
              key={pedido.id}
              pedido={pedido}
              ocupado={pedidoOcupado === pedido.id}
              onMarcarPronto={handleMarcarPronto}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}
