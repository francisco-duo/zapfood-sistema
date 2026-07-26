import { Paper, Box, Typography, Chip, Button, Stack, Divider } from "@mui/material";
import LocationOnIcon from "@mui/icons-material/LocationOn";
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
  return (
    <Paper sx={{ p: 2 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
        <Box>
          <Typography variant="subtitle2" fontWeight={700}>
            Pedido #{pedido.id.slice(0, 8)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {pedido.origem === "balcao" ? "Venda de balcão" : "Pedido online"} ·{" "}
            {pedido.tipo_entrega === "delivery"
              ? "Delivery"
              : pedido.tipo_entrega === "retirada"
                ? "Retirada"
                : "Consumo local"}
          </Typography>
        </Box>
        <Chip label={ROTULO_STATUS[pedido.status]} color={COR_STATUS[pedido.status]} size="small" />
      </Box>

      <Divider sx={{ my: 1 }} />

      <Stack spacing={0.5} sx={{ mb: 1.5 }}>
        {pedido.itens.map((item) => (
          <Typography key={item.id} variant="body2">
            {item.quantidade}x {nomesProdutos.get(item.produto_id) ?? `Produto ${item.produto_id.slice(0, 8)}`}
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
            p: 1,
            borderRadius: 1,
            bgcolor: "action.hover",
          }}
        >
          <LocationOnIcon fontSize="small" color="action" sx={{ mt: "1px" }} />
          <Typography variant="body2" color="text.secondary">
            {pedido.endereco_entrega}
          </Typography>
        </Box>
      )}

      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
        <Typography variant="body2" color="text.secondary">
          {pedido.forma_pagamento}
        </Typography>
        <Typography variant="subtitle1" fontWeight={700}>
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
          <Button size="small" variant="outlined" disabled={ocupado} onClick={() => onFinalizar(pedido.id)}>
            Finalizar
          </Button>
        )}
      </Stack>
    </Paper>
  );
}
