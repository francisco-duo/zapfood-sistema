import { useCallback, useEffect, useMemo, useState } from "react";
import { Box, Typography, Chip, CircularProgress, Alert, IconButton, Tooltip } from "@mui/material";
import WifiRoundedIcon from "@mui/icons-material/WifiRounded";
import WifiOffRoundedIcon from "@mui/icons-material/WifiOffRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import SoupKitchenRoundedIcon from "@mui/icons-material/SoupKitchenRounded";
import RestaurantRoundedIcon from "@mui/icons-material/RestaurantRounded";
import { kdsService } from "../services/kdsService";
import { pedidoService } from "../services/pedidoService";
import { cardapioService } from "../services/cardapioService";
import { useKdsSocket } from "../hooks/useKdsSocket";
import { useBeep } from "../hooks/useBeep";
import { useAuth } from "../context/AuthContext";
import PedidoCard from "./PedidoCard";
import type { MensagemKds, Pedido, PedidoNaFila } from "../types";

function paraPedidoNaFila(pedido: Pedido): PedidoNaFila {
  return { ...pedido, entrouNaFilaEm: new Date(pedido.criado_em).getTime() };
}

export default function KdsBoard() {
  const [fila, setFila] = useState<PedidoNaFila[] | null>(null);
  const [produtos, setProdutos] = useState<{ id: string; nome: string }[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [pedidoOcupado, setPedidoOcupado] = useState<string | null>(null);
  const tocarBeep = useBeep();
  const { logout } = useAuth();

  useEffect(() => {
    kdsService
      .obterFilaAtual()
      .then((pedidos) => setFila(pedidos.map(paraPedidoNaFila)))
      .catch(() => setErro("Não foi possível carregar a fila da cozinha."));
  }, []);

  useEffect(() => {
    cardapioService.listarProdutos().then(setProdutos).catch(() => {});
  }, []);

  const nomesProdutos = useMemo(() => new Map(produtos.map((p) => [p.id, p.nome])), [produtos]);

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
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
          pb: 2.5,
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              width: 46,
              height: 46,
              borderRadius: "14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "linear-gradient(135deg, #5DB3FF 0%, #2E7FDB 100%)",
              boxShadow: "0 8px 20px -6px rgba(93,179,255,0.5)",
            }}
          >
            <SoupKitchenRoundedIcon sx={{ color: "#fff", fontSize: 24 }} />
          </Box>
          <Box>
            <Typography variant="h1" sx={{ fontSize: "1.5rem", lineHeight: 1.1 }}>
              Fila de Preparo
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
              {fila?.length ?? 0} pedido{fila?.length === 1 ? "" : "s"} em andamento
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Chip
            icon={conectado ? <WifiRoundedIcon /> : <WifiOffRoundedIcon />}
            label={conectado ? "Ao vivo" : "Reconectando..."}
            color={conectado ? "success" : "warning"}
            variant={conectado ? "filled" : "outlined"}
            sx={{
              fontSize: "0.95rem",
              height: 40,
              px: 1,
              ...(conectado && { bgcolor: "rgba(61,220,132,0.15)", color: "success.main" }),
            }}
          />
          <Tooltip title="Sair">
            <IconButton
              onClick={logout}
              size="large"
              sx={{ color: "text.secondary", bgcolor: "background.paper", "&:hover": { color: "error.main" } }}
            >
              <LogoutRoundedIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {erro && (
        <Alert severity="error" sx={{ mb: 2, fontSize: "1.05rem", borderRadius: "12px" }} onClose={() => setErro(null)}>
          {erro}
        </Alert>
      )}

      {fila === null ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress size={48} />
        </Box>
      ) : fila.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 12 }}>
          <Box
            sx={{
              width: 96,
              height: 96,
              borderRadius: "28px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: "background.paper",
              mx: "auto",
              mb: 2,
            }}
          >
            <RestaurantRoundedIcon sx={{ fontSize: 44, color: "text.secondary" }} />
          </Box>
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
              nomesProdutos={nomesProdutos}
              onMarcarPronto={handleMarcarPronto}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}
