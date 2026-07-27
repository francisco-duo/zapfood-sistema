import { describe, expect, it } from "vitest";
import { authStorage } from "./authStorage";
import type { Usuario } from "../types";

const usuario: Usuario = {
  id: "u1",
  nome: "Admin",
  email: "admin@zapfood.com",
  perfil: "admin",
};

describe("authStorage (admin)", () => {
  it("começa sem sessão", () => {
    expect(authStorage.obterToken()).toBeNull();
    expect(authStorage.obterUsuario()).toBeNull();
  });

  it("salva e recupera token e usuário", () => {
    authStorage.salvar("token-abc", usuario);
    expect(authStorage.obterToken()).toBe("token-abc");
    expect(authStorage.obterUsuario()).toEqual(usuario);
  });

  it("limpar remove tudo", () => {
    authStorage.salvar("token-abc", usuario);
    authStorage.limpar();
    expect(authStorage.obterToken()).toBeNull();
    expect(authStorage.obterUsuario()).toBeNull();
  });
});
