import { API_BASE_URL } from "./config";

interface ProdutoApi {
  id: string;
  nome: string;
}

interface CardapioApi {
  produtos: ProdutoApi[];
}

export const cardapioService = {
  async listarProdutos(): Promise<ProdutoApi[]> {
    // Endpoint público (sem autenticação) — cozinha não tem permissão para
    // /produtos (gestão de catálogo), mas só precisa dos nomes para exibir.
    const response = await fetch(`${API_BASE_URL}/cardapio`);
    if (!response.ok) {
      throw new Error("Não foi possível carregar os nomes dos produtos.");
    }
    const dados: CardapioApi = await response.json();
    return dados.produtos;
  },
};
