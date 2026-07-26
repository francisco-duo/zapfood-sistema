import { apiFetch, tratarResposta } from "./apiClient";
import { registrarLog } from "./logService";
import type { Categoria, Produto } from "../types";

const formatador = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

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

function categoriaDaApi(c: CategoriaApi): Categoria {
  return { id: c.id, nome: c.nome, ativa: c.ativa };
}

function produtoDaApi(p: ProdutoApi): Produto {
  return {
    id: p.id,
    categoriaId: p.categoria_id,
    nome: p.nome,
    descricao: p.descricao,
    preco: p.preco,
    precoPromocional: p.preco_promocional,
    imagemUrl: p.imagem_url,
    ativo: p.ativo,
  };
}

export const catalogoService = {
  async listarCategorias(): Promise<Categoria[]> {
    const response = await apiFetch("/categorias");
    const dados = await tratarResposta<CategoriaApi[]>(response, "Não foi possível carregar as categorias.");
    return dados.map(categoriaDaApi);
  },

  async criarCategoria(nome: string): Promise<Categoria> {
    const response = await apiFetch("/categorias", {
      method: "POST",
      body: JSON.stringify({ nome }),
    });
    const criada = await tratarResposta<CategoriaApi>(response, "Não foi possível criar a categoria.");
    registrarLog("catalogo", `Categoria "${nome}" criada.`);
    return categoriaDaApi(criada);
  },

  async listarProdutos(): Promise<Produto[]> {
    const response = await apiFetch("/produtos");
    const dados = await tratarResposta<ProdutoApi[]>(response, "Não foi possível carregar os produtos.");
    return dados.map(produtoDaApi);
  },

  async criarProduto(dados: Omit<Produto, "id" | "ativo">): Promise<Produto> {
    const response = await apiFetch("/produtos", {
      method: "POST",
      body: JSON.stringify({
        categoria_id: dados.categoriaId,
        nome: dados.nome,
        descricao: dados.descricao,
        preco: dados.preco,
        preco_promocional: dados.precoPromocional ?? null,
        imagem_url: dados.imagemUrl,
      }),
    });
    const novo = await tratarResposta<ProdutoApi>(response, "Não foi possível criar o produto.");
    registrarLog("catalogo", `Produto "${novo.nome}" criado (${formatador.format(novo.preco)}).`);
    return produtoDaApi(novo);
  },

  async atualizarProduto(id: string, dados: Partial<Omit<Produto, "id">>): Promise<Produto> {
    const response = await apiFetch(`/produtos/${id}`, {
      method: "PUT",
      body: JSON.stringify({
        ...(dados.categoriaId !== undefined && { categoria_id: dados.categoriaId }),
        ...(dados.nome !== undefined && { nome: dados.nome }),
        ...(dados.descricao !== undefined && { descricao: dados.descricao }),
        ...(dados.preco !== undefined && { preco: dados.preco }),
        ...(dados.precoPromocional !== undefined && { preco_promocional: dados.precoPromocional }),
        ...(dados.imagemUrl !== undefined && { imagem_url: dados.imagemUrl }),
      }),
    });
    const atualizado = await tratarResposta<ProdutoApi>(response, "Não foi possível atualizar o produto.");
    const produto = produtoDaApi(atualizado);

    const houvePrecoAlterado = dados.preco !== undefined || dados.precoPromocional !== undefined;
    if (houvePrecoAlterado) {
      registrarLog(
        "preco",
        `Preço de "${produto.nome}" alterado para ${formatador.format(produto.preco)}` +
          (produto.precoPromocional
            ? ` (promocional: ${formatador.format(produto.precoPromocional)})`
            : ".")
      );
    } else {
      registrarLog("catalogo", `Produto "${produto.nome}" atualizado.`);
    }

    return produto;
  },

  async alternarAtivo(id: string): Promise<Produto> {
    const response = await apiFetch(`/produtos/${id}/alternar-ativo`, { method: "PATCH" });
    const atualizado = await tratarResposta<ProdutoApi>(response, "Não foi possível alterar o status do produto.");
    const produto = produtoDaApi(atualizado);
    registrarLog("catalogo", `Produto "${produto.nome}" ${produto.ativo ? "reativado" : "desativado"}.`);
    return produto;
  },
};
