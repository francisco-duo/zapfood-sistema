import { beforeEach, describe, expect, it } from "vitest";
import { logService, registrarLog } from "./logService";

describe("logService", () => {
  beforeEach(() => localStorage.clear());

  it("registrarLog cria uma entrada com id, categoria e mensagem", () => {
    const entrada = registrarLog("catalogo", "Produto criado.");
    expect(entrada.categoria).toBe("catalogo");
    expect(entrada.mensagem).toBe("Produto criado.");
    expect(entrada.autor).toBe("admin");
    expect(entrada.id).toBeTruthy();
  });

  it("listar retorna os logs do mais recente pro mais antigo", () => {
    registrarLog("catalogo", "Primeiro");
    registrarLog("preco", "Segundo");

    const logs = logService.listar();
    expect(logs).toHaveLength(2);
    expect(logs[0].mensagem).toBe("Segundo");
    expect(logs[1].mensagem).toBe("Primeiro");
  });

  it("listar retorna array vazio quando não há nada salvo", () => {
    expect(logService.listar()).toEqual([]);
  });
});
