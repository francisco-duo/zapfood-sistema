import { Paper, Box, Typography, Chip, Stack, Button } from "@mui/material";
import DeliveryDiningRoundedIcon from "@mui/icons-material/DeliveryDiningRounded";
import StorefrontRoundedIcon from "@mui/icons-material/StorefrontRounded";
import RestaurantRoundedIcon from "@mui/icons-material/RestaurantRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import { useCronometro, formatarTempo } from "../hooks/useCronometro";
import { TEMPO_PADRAO_PREPARO_MINUTOS } from "../services/config";
import type { PedidoNaFila } from "../types";

const ICONE_ENTREGA = {
  delivery: <DeliveryDiningRoundedIcon fontSize="inherit" />,
  retirada: <StorefrontRoundedIcon fontSize="inherit" />,
  consumo_local: <RestaurantRoundedIcon fontSize="inherit" />,
};

const ROTULO_ENTREGA = {
  delivery: "Delivery",
  retirada: "Retirada",
  consumo_local: "Consumo local",
};

interface PedidoCardProps {
  pedido: PedidoNaFila;
  ocupado: boolean;
  nomesProdutos: Map<string, string>;
  onMarcarPronto: (id: string) => void;
}

export default function PedidoCard({ pedido, ocupado, nomesProdutos, onMarcarPronto }: PedidoCardProps) {
  const segundosDecorridos = useCronometro(pedido.entrouNaFilaEm);
  const minutosDecorridos = segundosDecorridos / 60;

  const tempoPadrao = TEMPO_PADRAO_PREPARO_MINUTOS;
  const nivel =
    minutosDecorridos >= tempoPadrao * 1.5
      ? "vermelho"
      : minutosDecorridos >= tempoPadrao
        ? "amarelo"
        : "normal";

  const corPorNivel = {
    normal: "primary.main",
    amarelo: "warning.main",
    vermelho: "error.main",
  } as const;

  const glowPorNivel = {
    normal: "0 0 0 rgba(93,179,255,0)",
    amarelo: "0 0 24px -4px rgba(255,197,61,0.45)",
    vermelho: "0 0 28px -2px rgba(255,92,87,0.55)",
  } as const;

  return (
    <Paper
      sx={{
        p: 2.5,
        bgcolor: "background.paper",
        border: "2px solid",
        borderColor: nivel === "normal" ? "divider" : corPorNivel[nivel],
        boxShadow: glowPorNivel[nivel],
        transition: "border-color 0.4s ease, box-shadow 0.4s ease",
      }}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
        <Typography variant="h2" sx={{ fontVariantNumeric: "tabular-nums" }}>
          #{pedido.id.slice(0, 8)}
        </Typography>
        <Chip
          icon={ICONE_ENTREGA[pedido.tipo_entrega]}
          label={ROTULO_ENTREGA[pedido.tipo_entrega]}
          sx={{ fontSize: "1rem", height: 36, bgcolor: "action.hover" }}
        />
      </Box>

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          py: 1.25,
          mb: 1.5,
          borderRadius: "12px",
          bgcolor: "rgba(255,255,255,0.03)",
        }}
      >
        <Typography
          variant="h1"
          sx={{ fontVariantNumeric: "tabular-nums", color: corPorNivel[nivel], letterSpacing: "0.02em" }}
        >
          {formatarTempo(segundosDecorridos)}
        </Typography>
      </Box>

      <Stack spacing={0.85} sx={{ mb: 2.25, p: 1.5, borderRadius: "12px", bgcolor: "rgba(255,255,255,0.03)" }}>
        {pedido.itens.map((item) => (
          <Typography key={item.id} variant="body1">
            <Box component="span" sx={{ color: "primary.main", fontWeight: 800 }}>
              {item.quantidade}x
            </Box>{" "}
            {nomesProdutos.get(item.produto_id) ?? `Produto ${item.produto_id.slice(0, 8)}`}
            {item.observacao ? ` — ${item.observacao}` : ""}
          </Typography>
        ))}
      </Stack>

      <Button
        variant="contained"
        color="success"
        size="large"
        fullWidth
        disabled={ocupado}
        onClick={() => onMarcarPronto(pedido.id)}
        startIcon={<CheckRoundedIcon />}
        sx={{ fontSize: "1.1rem", py: 1.4 }}
      >
        Marcar como pronto
      </Button>
    </Paper>
  );
}
