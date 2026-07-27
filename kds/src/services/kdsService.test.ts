import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./apiClient", () => ({
  apiFetch: vi.fn(),
  tratarResposta: vi.fn(),
}));

import { apiFetch, tratarResposta } from "./apiClient";
import { kdsService } from "./kdsService";

describe("kdsService", () => {
  beforeEach(() => vi.clearAllMocks());

  it("obterFilaAtual busca a fila da cozinha", async () => {
    (apiFetch as ReturnType<typeof vi.fn>).mockResolvedValue("r");
    (tratarResposta as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    await kdsService.obterFilaAtual();
    expect(apiFetch).toHaveBeenCalledWith("/kds/fila");
  });
});
