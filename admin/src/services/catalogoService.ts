import type { Categoria, Produto } from "../types";
import { registrarLog } from "./logService";

const formatador = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

const CATEGORIAS_KEY = "zapfood_admin_categorias";
const PRODUTOS_KEY = "zapfood_admin_produtos";

const CATEGORIAS_SEED: Categoria[] = [
  { id: "cat-lanches", nome: "Lanches", ativa: true },
  { id: "cat-porcoes", nome: "Porções", ativa: true },
  { id: "cat-bebidas", nome: "Bebidas", ativa: true },
  { id: "cat-sobremesas", nome: "Sobremesas", ativa: true },
];

const PRODUTOS_SEED: Produto[] = [
  {
    id: "a1111111-1111-4111-8111-111111111111",
    categoriaId: "cat-lanches",
    nome: "Zap Burger Clássico",
    descricao: "Pão brioche, blend 160g, queijo cheddar, alface, tomate e maionese da casa.",
    preco: 28.9,
    precoPromocional: 22.9,
    imagemUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80",
    ativo: true,
  },
  {
    id: "a2222222-2222-4222-8222-222222222222",
    categoriaId: "cat-lanches",
    nome: "Duplo Bacon",
    descricao: "Dois blends 120g, bacon crocante, queijo prato e barbecue.",
    preco: 34.9,
    precoPromocional: null,
    imagemUrl: "https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=600&q=80",
    ativo: true,
  },
  {
    id: "a4444444-4444-4444-8444-444444444444",
    categoriaId: "cat-porcoes",
    nome: "Batata Frita Grande",
    descricao: "Porção generosa de batatas crocantes com sal e orégano.",
    preco: 24.9,
    precoPromocional: 18.9,
    imagemUrl: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=600&q=80",
    ativo: true,
  },
  {
    id: "a6666666-6666-4666-8666-666666666666",
    categoriaId: "cat-bebidas",
    nome: "Refrigerante Lata",
    descricao: "350ml, gelado. Diversos sabores disponíveis.",
    preco: 6.5,
    precoPromocional: null,
    imagemUrl: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600&q=80",
    ativo: true,
  },
  {
    id: "a8888888-8888-4888-8888-888888888888",
    categoriaId: "cat-sobremesas",
    nome: "Brownie com Sorvete",
    descricao: "Brownie de chocolate meio amargo com bola de sorvete de creme.",
    preco: 18.9,
    precoPromocional: null,
    imagemUrl: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600&q=80",
    ativo: true,
  },
];

function ler<T>(chave: string, seed: T[]): T[] {
  const raw = localStorage.getItem(chave);
  if (!raw) {
    localStorage.setItem(chave, JSON.stringify(seed));
    return seed;
  }
  return JSON.parse(raw);
}

function salvar<T>(chave: string, dados: T[]): void {
  localStorage.setItem(chave, JSON.stringify(dados));
}

export const catalogoService = {
  listarCategorias(): Categoria[] {
    return ler(CATEGORIAS_KEY, CATEGORIAS_SEED);
  },

  criarCategoria(nome: string): Categoria {
    const categorias = ler(CATEGORIAS_KEY, CATEGORIAS_SEED);
    const nova: Categoria = { id: crypto.randomUUID(), nome, ativa: true };
    salvar(CATEGORIAS_KEY, [...categorias, nova]);
    registrarLog("catalogo", `Categoria "${nome}" criada.`);
    return nova;
  },

  listarProdutos(): Produto[] {
    return ler(PRODUTOS_KEY, PRODUTOS_SEED);
  },

  criarProduto(dados: Omit<Produto, "id" | "ativo">): Produto {
    const produtos = ler(PRODUTOS_KEY, PRODUTOS_SEED);
    const novo: Produto = { ...dados, id: crypto.randomUUID(), ativo: true };
    salvar(PRODUTOS_KEY, [...produtos, novo]);
    registrarLog("catalogo", `Produto "${novo.nome}" criado (${formatador.format(novo.preco)}).`);
    return novo;
  },

  atualizarProduto(id: string, dados: Partial<Omit<Produto, "id">>): Produto {
    const produtos = ler(PRODUTOS_KEY, PRODUTOS_SEED);
    const atual = produtos.find((p) => p.id === id);
    if (!atual) throw new Error("Produto não encontrado.");

    const houvePrecoAlterado =
      dados.preco !== undefined && dados.preco !== atual.preco ||
      dados.precoPromocional !== undefined && dados.precoPromocional !== atual.precoPromocional;

    const atualizado = { ...atual, ...dados };
    salvar(
      PRODUTOS_KEY,
      produtos.map((p) => (p.id === id ? atualizado : p))
    );

    if (houvePrecoAlterado) {
      registrarLog(
        "preco",
        `Preço de "${atualizado.nome}" alterado para ${formatador.format(atualizado.preco)}` +
          (atualizado.precoPromocional
            ? ` (promocional: ${formatador.format(atualizado.precoPromocional)})`
            : ".")
      );
    } else {
      registrarLog("catalogo", `Produto "${atualizado.nome}" atualizado.`);
    }

    return atualizado;
  },

  alternarAtivo(id: string): Produto {
    const produtos = ler(PRODUTOS_KEY, PRODUTOS_SEED);
    const atual = produtos.find((p) => p.id === id);
    if (!atual) throw new Error("Produto não encontrado.");
    const atualizado = { ...atual, ativo: !atual.ativo };
    salvar(
      PRODUTOS_KEY,
      produtos.map((p) => (p.id === id ? atualizado : p))
    );
    registrarLog(
      "catalogo",
      `Produto "${atualizado.nome}" ${atualizado.ativo ? "reativado" : "desativado"}.`
    );
    return atualizado;
  },
};
