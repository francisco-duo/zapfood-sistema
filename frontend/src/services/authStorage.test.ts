import { describe, expect, it } from "vitest";
import { authStorage } from "./authStorage";
import type { Usuario } from "../types";

const usuario: Usuario = {
  id: "u1",
  nome: "Ana",
  email: "ana@example.com",
  perfil: "cliente",
  email_verificado: true,
};

describe("authStorage", () => {
  it("começa sem token nem usuário", () => {
    expect(authStorage.obterToken()).toBeNull();
    expect(authStorage.obterUsuario()).toBeNull();
  });

  it("salva e recupera token e usuário", () => {
    authStorage.salvar("token-abc", usuario);
    expect(authStorage.obterToken()).toBe("token-abc");
    expect(authStorage.obterUsuario()).toEqual(usuario);
  });

  it("atualizarUsuario troca o usuário sem mexer no token", () => {
    authStorage.salvar("token-abc", usuario);
    const atualizado = { ...usuario, email_verificado: true, nome: "Ana Silva" };
    authStorage.atualizarUsuario(atualizado);

    expect(authStorage.obterToken()).toBe("token-abc");
    expect(authStorage.obterUsuario()).toEqual(atualizado);
  });

  it("limpar remove token e usuário", () => {
    authStorage.salvar("token-abc", usuario);
    authStorage.limpar();
    expect(authStorage.obterToken()).toBeNull();
    expect(authStorage.obterUsuario()).toBeNull();
  });
});
