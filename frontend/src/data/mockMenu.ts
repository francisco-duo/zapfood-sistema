import type { Categoria, Produto } from "../types";

export const categorias: Categoria[] = [
  { id: "cat-lanches", nome: "Lanches" },
  { id: "cat-porcoes", nome: "Porções" },
  { id: "cat-bebidas", nome: "Bebidas" },
  { id: "cat-sobremesas", nome: "Sobremesas" },
];

export const produtos: Produto[] = [
  {
    id: "prod-1",
    categoriaId: "cat-lanches",
    nome: "Zap Burger Clássico",
    descricao: "Pão brioche, blend 160g, queijo cheddar, alface, tomate e maionese da casa.",
    preco: 28.9,
    precoPromocional: 22.9,
    imagemUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80",
  },
  {
    id: "prod-2",
    categoriaId: "cat-lanches",
    nome: "Duplo Bacon",
    descricao: "Dois blends 120g, bacon crocante, queijo prato e barbecue.",
    preco: 34.9,
    imagemUrl: "https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=600&q=80",
  },
  {
    id: "prod-3",
    categoriaId: "cat-lanches",
    nome: "Veggie Grelhado",
    descricao: "Hambúrguer de grão-de-bico, rúcula, tomate seco e cream cheese.",
    preco: 26.9,
    imagemUrl: "https://images.unsplash.com/photo-1520072959219-c595dc870360?w=600&q=80",
  },
  {
    id: "prod-4",
    categoriaId: "cat-porcoes",
    nome: "Batata Frita Grande",
    descricao: "Porção generosa de batatas crocantes com sal e orégano.",
    preco: 24.9,
    precoPromocional: 18.9,
    imagemUrl: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=600&q=80",
  },
  {
    id: "prod-5",
    categoriaId: "cat-porcoes",
    nome: "Onion Rings",
    descricao: "Anéis de cebola empanados e fritos, acompanha molho especial.",
    preco: 22.9,
    imagemUrl: "https://images.unsplash.com/photo-1639024471283-03518883512d?w=600&q=80",
  },
  {
    id: "prod-6",
    categoriaId: "cat-bebidas",
    nome: "Refrigerante Lata",
    descricao: "350ml, gelado. Diversos sabores disponíveis.",
    preco: 6.5,
    imagemUrl: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600&q=80",
  },
  {
    id: "prod-7",
    categoriaId: "cat-bebidas",
    nome: "Suco Natural 500ml",
    descricao: "Feito na hora, sem adição de açúcar.",
    preco: 12.9,
    precoPromocional: 9.9,
    imagemUrl: "https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=600&q=80",
  },
  {
    id: "prod-8",
    categoriaId: "cat-sobremesas",
    nome: "Brownie com Sorvete",
    descricao: "Brownie de chocolate meio amargo com bola de sorvete de creme.",
    preco: 18.9,
    imagemUrl: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600&q=80",
  },
];
