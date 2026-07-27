import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CartProvider, useCart } from "./CartContext";
import type { Produto } from "../types";

const produto: Produto = {
  id: "p1",
  categoriaId: "c1",
  nome: "X-Burger",
  descricao: "Delicioso",
  preco: 20,
  imagemUrl: "https://picsum.photos/200",
};

const produtoEmPromocao: Produto = {
  ...produto,
  id: "p2",
  nome: "X-Salada",
  preco: 25,
  precoPromocional: 19.9,
};

function renderCart() {
  return renderHook(() => useCart(), { wrapper: CartProvider });
}

describe("CartContext", () => {
  it("começa vazio", () => {
    const { result } = renderCart();
    expect(result.current.itens).toHaveLength(0);
    expect(result.current.quantidadeTotal).toBe(0);
    expect(result.current.valorTotal).toBe(0);
  });

  it("adicionarItem inclui um novo item com quantidade 1 por padrão", () => {
    const { result } = renderCart();
    act(() => result.current.adicionarItem(produto));

    expect(result.current.itens).toHaveLength(1);
    expect(result.current.itens[0]).toMatchObject({ produtoId: "p1", quantidade: 1 });
    expect(result.current.quantidadeTotal).toBe(1);
    expect(result.current.valorTotal).toBe(20);
  });

  it("adicionarItem no mesmo produto soma a quantidade em vez de duplicar", () => {
    const { result } = renderCart();
    act(() => result.current.adicionarItem(produto));
    act(() => result.current.adicionarItem(produto, 2));

    expect(result.current.itens).toHaveLength(1);
    expect(result.current.itens[0].quantidade).toBe(3);
  });

  it("usa o preço promocional quando o produto está em promoção", () => {
    const { result } = renderCart();
    act(() => result.current.adicionarItem(produtoEmPromocao));
    expect(result.current.itens[0].precoUnitario).toBe(19.9);
  });

  it("alterarQuantidade atualiza a quantidade de um item existente", () => {
    const { result } = renderCart();
    act(() => result.current.adicionarItem(produto));
    act(() => result.current.alterarQuantidade("p1", 5));
    expect(result.current.itens[0].quantidade).toBe(5);
  });

  it("alterarQuantidade para 0 ou menos remove o item", () => {
    const { result } = renderCart();
    act(() => result.current.adicionarItem(produto));
    act(() => result.current.alterarQuantidade("p1", 0));
    expect(result.current.itens).toHaveLength(0);
  });

  it("removerItem tira o item do carrinho", () => {
    const { result } = renderCart();
    act(() => result.current.adicionarItem(produto));
    act(() => result.current.removerItem("p1"));
    expect(result.current.itens).toHaveLength(0);
  });

  it("limparCarrinho esvazia tudo", () => {
    const { result } = renderCart();
    act(() => result.current.adicionarItem(produto));
    act(() => result.current.adicionarItem(produtoEmPromocao));
    act(() => result.current.limparCarrinho());
    expect(result.current.itens).toHaveLength(0);
  });

  it("valorTotal soma quantidade x preço de todos os itens", () => {
    const { result } = renderCart();
    act(() => result.current.adicionarItem(produto, 2)); // 40
    act(() => result.current.adicionarItem(produtoEmPromocao, 1)); // 19.9
    expect(result.current.valorTotal).toBeCloseTo(59.9);
  });

  it("persiste os itens no localStorage entre montagens", () => {
    const primeira = renderCart();
    act(() => primeira.result.current.adicionarItem(produto));
    primeira.unmount();

    const segunda = renderCart();
    expect(segunda.result.current.itens).toHaveLength(1);
  });

  it("useCart fora do provider lança erro", () => {
    expect(() => renderHook(() => useCart())).toThrow(
      "useCart deve ser usado dentro de um CartProvider."
    );
  });
});
