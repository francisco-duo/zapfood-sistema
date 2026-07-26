import { apiFetch, tratarResposta } from "./apiClient";
import type { Pedido } from "../types";

export const pedidoService = {
  async marcarPronto(pedidoId: string): Promise<Pedido> {
    const response = await apiFetch(`/pedidos/${pedidoId}/pronto`, { method: "POST" });
    return tratarResposta(response, "Não foi possível marcar o pedido como pronto.");
  },
};
