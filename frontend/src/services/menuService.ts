import { categorias, produtos } from "../data/mockMenu";
import { API_BASE_URL, USE_MOCK_BACKEND } from "./config";
import type { Categoria, Produto } from "../types";

export async function buscarCardapio(): Promise<{ categorias: Categoria[]; produtos: Produto[] }> {
  if (USE_MOCK_BACKEND) {
    return { categorias, produtos };
  }

  const response = await fetch(`${API_BASE_URL}/cardapio`);
  if (!response.ok) {
    throw new Error("Não foi possível carregar o cardápio.");
  }
  return response.json();
}
