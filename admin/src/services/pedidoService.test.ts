import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./apiClient", () => ({
  apiFetch: vi.fn(),
  tratarResposta: vi.fn(),
}));

import { apiFetch, tratarResposta } from "./apiClient";
import { pedidoService } from "./pedidoService";

describe("pedidoService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (apiFetch as ReturnType<typeof vi.fn>).mockResolvedValue("r");
    (tratarResposta as ReturnType<typeof vi.fn>).mockResolvedValue({});
  });

  it("listar sem filtro não inclui query string", async () => {
    await pedidoService.listar();
    expect(apiFetch).toHaveBeenCalledWith("/pedidos");
  });

  it("listar com status monta a query string", async () => {
    await pedidoService.listar("em_preparo");
    expect(apiFetch).toHaveBeenCalledWith("/pedidos?status_pedido=em_preparo");
  });

  it("aprovar chama o endpoint correto", async () => {
    await pedidoService.aprovar("p1");
    expect(apiFetch).toHaveBeenCalledWith("/pedidos/p1/aprovar", { method: "POST" });
  });

  it("cancelar chama o endpoint correto", async () => {
    await pedidoService.cancelar("p1");
    expect(apiFetch).toHaveBeenCalledWith("/pedidos/p1/cancelar", { method: "POST" });
  });

  it("marcarPronto chama o endpoint correto", async () => {
    await pedidoService.marcarPronto("p1");
    expect(apiFetch).toHaveBeenCalledWith("/pedidos/p1/pronto", { method: "POST" });
  });

  it("marcarSaiuParaEntrega chama o endpoint correto", async () => {
    await pedidoService.marcarSaiuParaEntrega("p1");
    expect(apiFetch).toHaveBeenCalledWith("/pedidos/p1/saiu-para-entrega", { method: "POST" });
  });

  it("finalizar chama o endpoint correto", async () => {
    await pedidoService.finalizar("p1");
    expect(apiFetch).toHaveBeenCalledWith("/pedidos/p1/finalizar", { method: "POST" });
  });

  it("criarVendaBalcao monta o payload de origem balcao", async () => {
    await pedidoService.criarVendaBalcao({
      tipoEntrega: "consumo_local",
      formaPagamento: "Dinheiro",
      itens: [{ produto_id: "p1", quantidade: 1, preco_unitario_cobrado: 10 }],
    });

    const [, options] = (apiFetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const corpo = JSON.parse(options.body);
    expect(corpo.origem).toBe("balcao");
    expect(corpo.endereco_entrega).toBeNull();
  });
});
