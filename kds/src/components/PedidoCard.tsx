import { Paper, Box, Typography, Chip, Stack, Button, Divider } from "@mui/material";
import DeliveryDiningIcon from "@mui/icons-material/DeliveryDining";
import StorefrontIcon from "@mui/icons-material/Storefront";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import { useCronometro, formatarTempo } from "../hooks/useCronometro";
import { TEMPO_PADRAO_PREPARO_MINUTOS } from "../services/config";
import type { PedidoNaFila } from "../types";

const ICONE_ENTREGA = {
  delivery: <DeliveryDiningIcon fontSize="inherit" />,
  retirada: <StorefrontIcon fontSize="inherit" />,
  consumo_local: <RestaurantIcon fontSize="inherit" />,
};

const ROTULO_ENTREGA = {
  delivery: "Delivery",
  retirada: "Retirada",
  consumo_local: "Consumo local",
};

interface PedidoCardProps {
  pedido: PedidoNaFila;
  ocupado: boolean;
  onMarcarPronto: (id: string) => void;
}

export default function PedidoCard({ pedido, ocupado, onMarcarPronto }: PedidoCardProps) {
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

  return (
    <Paper
      elevation={4}
      sx={{
        p: 2.5,
        border: "3px solid",
        borderColor: corPorNivel[nivel],
        transition: "border-color 0.4s ease",
      }}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
        <Typography variant="h2">#{pedido.id.slice(0, 8)}</Typography>
        <Chip
          icon={ICONE_ENTREGA[pedido.tipo_entrega]}
          label={ROTULO_ENTREGA[pedido.tipo_entrega]}
          sx={{ fontSize: "1rem", height: 36 }}
        />
      </Box>

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          py: 1,
          mb: 1.5,
          borderRadius: 2,
          bgcolor: "rgba(255,255,255,0.04)",
        }}
      >
        <Typography
          variant="h1"
          sx={{ fontVariantNumeric: "tabular-nums", color: corPorNivel[nivel] }}
        >
          {formatarTempo(segundosDecorridos)}
        </Typography>
      </Box>

      <Divider sx={{ mb: 1.5, borderColor: "rgba(255,255,255,0.12)" }} />

      <Stack spacing={0.75} sx={{ mb: 2 }}>
        {pedido.itens.map((item) => (
          <Typography key={item.id} variant="body1">
            <strong>{item.quantidade}x</strong> produto {item.produto_id.slice(0, 8)}
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
        sx={{ fontSize: "1.1rem", py: 1.25 }}
      >
        Marcar como pronto
      </Button>
    </Paper>
  );
}
