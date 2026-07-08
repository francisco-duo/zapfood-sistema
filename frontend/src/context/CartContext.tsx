import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { ItemCarrinho, Produto } from "../types";

const CART_STORAGE_KEY = "zapfood_cart";

interface CartContextValue {
  itens: ItemCarrinho[];
  quantidadeTotal: number;
  valorTotal: number;
  adicionarItem: (produto: Produto, quantidade?: number) => void;
  removerItem: (produtoId: string) => void;
  alterarQuantidade: (produtoId: string, quantidade: number) => void;
  limparCarrinho: () => void;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

function carregarCarrinho(): ItemCarrinho[] {
  const raw = localStorage.getItem(CART_STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [itens, setItens] = useState<ItemCarrinho[]>(carregarCarrinho);

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(itens));
  }, [itens]);

  function adicionarItem(produto: Produto, quantidade = 1) {
    setItens((atual) => {
      const precoUnitario = produto.precoPromocional ?? produto.preco;
      const existente = atual.find((item) => item.produtoId === produto.id);
      if (existente) {
        return atual.map((item) =>
          item.produtoId === produto.id
            ? { ...item, quantidade: item.quantidade + quantidade }
            : item
        );
      }
      return [
        ...atual,
        {
          produtoId: produto.id,
          nome: produto.nome,
          precoUnitario,
          quantidade,
          imagemUrl: produto.imagemUrl,
        },
      ];
    });
  }

  function removerItem(produtoId: string) {
    setItens((atual) => atual.filter((item) => item.produtoId !== produtoId));
  }

  function alterarQuantidade(produtoId: string, quantidade: number) {
    if (quantidade <= 0) {
      removerItem(produtoId);
      return;
    }
    setItens((atual) =>
      atual.map((item) => (item.produtoId === produtoId ? { ...item, quantidade } : item))
    );
  }

  function limparCarrinho() {
    setItens([]);
  }

  const quantidadeTotal = useMemo(
    () => itens.reduce((soma, item) => soma + item.quantidade, 0),
    [itens]
  );

  const valorTotal = useMemo(
    () => itens.reduce((soma, item) => soma + item.quantidade * item.precoUnitario, 0),
    [itens]
  );

  return (
    <CartContext.Provider
      value={{ itens, quantidadeTotal, valorTotal, adicionarItem, removerItem, alterarQuantidade, limparCarrinho }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart deve ser usado dentro de um CartProvider.");
  }
  return context;
}
