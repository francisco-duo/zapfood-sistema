import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./apiClient", () => ({
  apiFetch: vi.fn(),
  tratarResposta: vi.fn(),
}));

import { apiFetch, tratarResposta } from "./apiClient";
import { pedidoService } from "./pedidoService";

describe("pedidoService (kds)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("marcarPronto chama o endpoint correto", async () => {
    (apiFetch as ReturnType<typeof vi.fn>).mockResolvedValue("r");
    (tratarResposta as ReturnType<typeof vi.fn>).mockResolvedValue({});

    await pedidoService.marcarPronto("p1");
    expect(apiFetch).toHaveBeenCalledWith("/pedidos/p1/pronto", { method: "POST" });
  });
});
