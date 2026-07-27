import { Paper, Box, Typography, Chip, Button, Stack } from "@mui/material";
import LocationOnRoundedIcon from "@mui/icons-material/LocationOnRounded";
import DeliveryDiningRoundedIcon from "@mui/icons-material/DeliveryDiningRounded";
import StorefrontRoundedIcon from "@mui/icons-material/StorefrontRounded";
import RestaurantRoundedIcon from "@mui/icons-material/RestaurantRounded";
import type { Pedido, StatusPedido } from "../../types";

const formatador = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

const ROTULO_STATUS: Record<StatusPedido, string> = {
  aguardando_aprovacao: "Aguardando aprovação",
  em_preparo: "Em preparo",
  pronto_entrega: "Pronto para entrega",
  pronto_retirada: "Pronto para retirada",
  finalizado: "Finalizado",
  cancelado: "Cancelado",
};

const COR_STATUS: Record<StatusPedido, "warning" | "info" | "success" | "default" | "error"> = {
  aguardando_aprovacao: "warning",
  em_preparo: "info",
  pronto_entrega: "success",
  pronto_retirada: "success",
  finalizado: "default",
  cancelado: "error",
};

const ICONE_ENTREGA = {
  delivery: DeliveryDiningRoundedIcon,
  retirada: StorefrontRoundedIcon,
  consumo_local: RestaurantRoundedIcon,
};

const ROTULO_ENTREGA = {
  delivery: "Delivery",
  retirada: "Retirada",
  consumo_local: "Consumo local",
};

interface PedidoCardProps {
  pedido: Pedido;
  ocupado: boolean;
  nomesProdutos: Map<string, string>;
  onAceitar: (id: string) => void;
  onCancelar: (id: string) => void;
  onMarcarPronto: (id: string) => void;
  onSaiuParaEntrega: (id: string) => void;
  onFinalizar: (id: string) => void;
}

export default function PedidoCard({
  pedido,
  ocupado,
  nomesProdutos,
  onAceitar,
  onCancelar,
  onMarcarPronto,
  onSaiuParaEntrega,
  onFinalizar,
}: PedidoCardProps) {
  const IconeEntrega = ICONE_ENTREGA[pedido.tipo_entrega];

  return (
    <Paper sx={{ p: 2.25, borderRadius: "16px" }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.5 }}>
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
            #{pedido.id.slice(0, 8)}
          </Typography>
          <Stack direction="row" spacing={0.5} sx={{ alignItems: "center", mt: 0.25 }}>
            <IconeEntrega sx={{ fontSize: 14, color: "text.secondary" }} />
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
              {pedido.origem === "balcao" ? "Balcão" : "Online"} · {ROTULO_ENTREGA[pedido.tipo_entrega]}
            </Typography>
          </Stack>
        </Box>
        <Chip label={ROTULO_STATUS[pedido.status]} color={COR_STATUS[pedido.status]} size="small" />
      </Box>

      <Stack spacing={0.5} sx={{ mb: 1.5, p: 1.25, borderRadius: "12px", bgcolor: "background.default" }}>
        {pedido.itens.map((item) => (
          <Typography key={item.id} variant="body2" sx={{ fontWeight: 500 }}>
            <Box component="span" sx={{ fontWeight: 800, color: "primary.main" }}>
              {item.quantidade}x
            </Box>{" "}
            {nomesProdutos.get(item.produto_id) ?? `Produto ${item.produto_id.slice(0, 8)}`}
            {item.observacao ? ` — ${item.observacao}` : ""}
          </Typography>
        ))}
      </Stack>

      {pedido.tipo_entrega === "delivery" && pedido.endereco_entrega && (
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
            gap: 0.75,
            mb: 1.5,
            p: 1.1,
            borderRadius: "10px",
            bgcolor: "rgba(255,90,54,0.06)",
            border: "1px solid rgba(255,90,54,0.15)",
          }}
        >
          <LocationOnRoundedIcon fontSize="small" sx={{ color: "primary.main", mt: "1px" }} />
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
            {pedido.endereco_entrega}
          </Typography>
        </Box>
      )}

      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.75 }}>
        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
          {pedido.forma_pagamento}
        </Typography>
        <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
          {formatador.format(pedido.valor_total)}
        </Typography>
      </Box>

      <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>
        {pedido.status === "aguardando_aprovacao" && (
          <>
            <Button
              size="small"
              variant="contained"
              disabled={ocupado}
              onClick={() => onAceitar(pedido.id)}
            >
              Aceitar
            </Button>
            <Button
              size="small"
              variant="outlined"
              color="error"
              disabled={ocupado}
              onClick={() => onCancelar(pedido.id)}
              sx={{ borderColor: "divider" }}
            >
              Cancelar
            </Button>
          </>
        )}
        {pedido.status === "em_preparo" && (
          <Button size="small" variant="contained" disabled={ocupado} onClick={() => onMarcarPronto(pedido.id)}>
            Marcar como pronto
          </Button>
        )}
        {pedido.status === "pronto_entrega" && (
          <Button
            size="small"
            variant="contained"
            disabled={ocupado}
            onClick={() => onSaiuParaEntrega(pedido.id)}
          >
            Saiu para entrega
          </Button>
        )}
        {(pedido.status === "pronto_entrega" || pedido.status === "pronto_retirada") && (
          <Button
            size="small"
            variant="outlined"
            disabled={ocupado}
            onClick={() => onFinalizar(pedido.id)}
            sx={{ borderColor: "divider" }}
          >
            Finalizar
          </Button>
        )}
      </Stack>
    </Paper>
  );
}
