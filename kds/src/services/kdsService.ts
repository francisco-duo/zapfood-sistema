import { API_BASE_URL } from "./config";
import type { Pedido } from "../types";

export const kdsService = {
  async obterFilaAtual(): Promise<Pedido[]> {
    const response = await fetch(`${API_BASE_URL}/kds/fila`);
    if (!response.ok) {
      throw new Error("Não foi possível carregar a fila da cozinha.");
    }
    return response.json();
  },
};
