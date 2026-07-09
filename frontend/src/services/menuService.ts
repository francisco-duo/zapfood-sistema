import { API_BASE_URL } from "./config";
import type { Categoria, Produto } from "../types";

interface CategoriaApi {
  id: string;
  nome: string;
  ativa: boolean;
}

interface ProdutoApi {
  id: string;
  categoria_id: string;
  nome: string;
  descricao: string;
  preco: number;
  preco_promocional: number | null;
  imagem_url: string;
  ativo: boolean;
}

export async function buscarCardapio(): Promise<{ categorias: Categoria[]; produtos: Produto[] }> {
  const response = await fetch(`${API_BASE_URL}/cardapio`);
  if (!response.ok) {
    throw new Error("Não foi possível carregar o cardápio.");
  }
  const dados: { categorias: CategoriaApi[]; produtos: ProdutoApi[] } = await response.json();

  return {
    categorias: dados.categorias.map((c) => ({ id: c.id, nome: c.nome })),
    produtos: dados.produtos.map((p) => ({
      id: p.id,
      categoriaId: p.categoria_id,
      nome: p.nome,
      descricao: p.descricao,
      preco: p.preco,
      precoPromocional: p.preco_promocional ?? undefined,
      imagemUrl: p.imagem_url,
    })),
  };
}
