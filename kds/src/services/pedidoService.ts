import { API_BASE_URL } from "./config";
import type { Pedido } from "../types";

export const pedidoService = {
  async marcarPronto(pedidoId: string): Promise<Pedido> {
    const response = await fetch(`${API_BASE_URL}/pedidos/${pedidoId}/pronto`, { method: "POST" });
    if (!response.ok) {
      throw new Error("Não foi possível marcar o pedido como pronto.");
    }
    return response.json();
  },
};
