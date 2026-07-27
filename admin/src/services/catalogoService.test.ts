import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./apiClient", () => ({
  apiFetch: vi.fn(),
  tratarResposta: vi.fn(),
}));
vi.mock("./logService", () => ({ registrarLog: vi.fn() }));

import { apiFetch, tratarResposta } from "./apiClient";
import { registrarLog } from "./logService";
import { catalogoService } from "./catalogoService";

const categoriaApi = { id: "c1", nome: "Lanches", ativa: true };
const produtoApi = {
  id: "p1",
  categoria_id: "c1",
  nome: "X-Burger",
  descricao: "d",
  preco: 20,
  preco_promocional: null,
  imagem_url: "url",
  ativo: true,
};

describe("catalogoService", () => {
  beforeEach(() => vi.clearAllMocks());

  it("listarCategorias converte do formato da API", async () => {
    (apiFetch as ReturnType<typeof vi.fn>).mockResolvedValue("r");
    (tratarResposta as ReturnType<typeof vi.fn>).mockResolvedValue([categoriaApi]);

    const resultado = await catalogoService.listarCategorias();
    expect(resultado).toEqual([{ id: "c1", nome: "Lanches", ativa: true }]);
  });

  it("criarCategoria registra log e devolve a categoria criada", async () => {
    (apiFetch as ReturnType<typeof vi.fn>).mockResolvedValue("r");
    (tratarResposta as ReturnType<typeof vi.fn>).mockResolvedValue(categoriaApi);

    const resultado = await catalogoService.criarCategoria("Lanches");

    expect(resultado.nome).toBe("Lanches");
    expect(registrarLog).toHaveBeenCalledWith("catalogo", expect.stringContaining("Lanches"));
  });

  it("listarProdutos converte do formato da API", async () => {
    (apiFetch as ReturnType<typeof vi.fn>).mockResolvedValue("r");
    (tratarResposta as ReturnType<typeof vi.fn>).mockResolvedValue([produtoApi]);

    const resultado = await catalogoService.listarProdutos();
    expect(resultado[0]).toEqual({
      id: "p1",
      categoriaId: "c1",
      nome: "X-Burger",
      descricao: "d",
      preco: 20,
      precoPromocional: null,
      imagemUrl: "url",
      ativo: true,
    });
  });

  it("criarProduto envia o payload no formato da API e registra log", async () => {
    (apiFetch as ReturnType<typeof vi.fn>).mockResolvedValue("r");
    (tratarResposta as ReturnType<typeof vi.fn>).mockResolvedValue(produtoApi);

    await catalogoService.criarProduto({
      categoriaId: "c1",
      nome: "X-Burger",
      descricao: "d",
      preco: 20,
      imagemUrl: "url",
    });

    const [, options] = (apiFetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const corpo = JSON.parse(options.body);
    expect(corpo.categoria_id).toBe("c1");
    expect(registrarLog).toHaveBeenCalledWith("catalogo", expect.stringContaining("X-Burger"));
  });

  it("atualizarProduto registra log de categoria 'preco' quando o preço muda", async () => {
    (apiFetch as ReturnType<typeof vi.fn>).mockResolvedValue("r");
    (tratarResposta as ReturnType<typeof vi.fn>).mockResolvedValue({ ...produtoApi, preco: 25 });

    await catalogoService.atualizarProduto("p1", { preco: 25 });

    expect(registrarLog).toHaveBeenCalledWith("preco", expect.stringContaining("X-Burger"));
  });

  it("atualizarProduto registra log de categoria 'catalogo' quando não é o preço", async () => {
    (apiFetch as ReturnType<typeof vi.fn>).mockResolvedValue("r");
    (tratarResposta as ReturnType<typeof vi.fn>).mockResolvedValue(produtoApi);

    await catalogoService.atualizarProduto("p1", { nome: "Novo nome" });

    expect(registrarLog).toHaveBeenCalledWith("catalogo", expect.stringContaining("atualizado"));
  });

  it("atualizarProduto mostra o preço promocional no log quando existe", async () => {
    (apiFetch as ReturnType<typeof vi.fn>).mockResolvedValue("r");
    (tratarResposta as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...produtoApi,
      preco: 25,
      preco_promocional: 19.9,
    });

    await catalogoService.atualizarProduto("p1", { preco: 25 });

    expect(registrarLog).toHaveBeenCalledWith("preco", expect.stringContaining("promocional"));
  });

  it("alternarAtivo registra 'desativado' quando o produto fica inativo", async () => {
    (apiFetch as ReturnType<typeof vi.fn>).mockResolvedValue("r");
    (tratarResposta as ReturnType<typeof vi.fn>).mockResolvedValue({ ...produtoApi, ativo: false });

    await catalogoService.alternarAtivo("p1");

    expect(registrarLog).toHaveBeenCalledWith("catalogo", expect.stringContaining("desativado"));
  });

  it("alternarAtivo registra 'reativado' quando o produto fica ativo", async () => {
    (apiFetch as ReturnType<typeof vi.fn>).mockResolvedValue("r");
    (tratarResposta as ReturnType<typeof vi.fn>).mockResolvedValue({ ...produtoApi, ativo: true });

    await catalogoService.alternarAtivo("p1");

    expect(registrarLog).toHaveBeenCalledWith("catalogo", expect.stringContaining("reativado"));
  });
});
