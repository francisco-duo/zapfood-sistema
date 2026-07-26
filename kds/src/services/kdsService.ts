import { apiFetch, tratarResposta } from "./apiClient";
import type { Pedido } from "../types";

export const kdsService = {
  async obterFilaAtual(): Promise<Pedido[]> {
    const response = await apiFetch("/kds/fila");
    return tratarResposta(response, "Não foi possível carregar a fila da cozinha.");
  },
};
