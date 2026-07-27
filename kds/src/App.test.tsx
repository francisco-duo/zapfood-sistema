import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

let estaAutenticado = false;
vi.mock("./context/AuthContext", () => ({ useAuth: () => ({ estaAutenticado }) }));
vi.mock("./pages/RedefinirSenhaPage", () => ({ default: () => <div>Redefinir tela</div> }));
vi.mock("./components/KdsBoard", () => ({ default: () => <div>Board da cozinha</div> }));

import App from "./App";

function irPara(pathname: string) {
  window.history.pushState({}, "", pathname);
}

describe("App (kds)", () => {
  beforeEach(() => {
    estaAutenticado = false;
    irPara("/");
  });

  afterEach(() => {
    irPara("/");
  });

  it("mostra a tela de redefinir senha quando o caminho é /redefinir-senha", () => {
    irPara("/redefinir-senha");
    render(<App />);
    expect(screen.getByText("Redefinir tela")).toBeInTheDocument();
  });

  it("mostra a tela de login quando não autenticado", () => {
    render(<App />);
    expect(screen.getByText("Painel da Cozinha")).toBeInTheDocument();
  });

  it("alterna para a tela de esqueci senha e volta para o login", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByText("Esqueci minha senha"));
    expect(screen.getByText("Esqueceu sua senha?")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Voltar para o login" }));
    expect(screen.getByText("Painel da Cozinha")).toBeInTheDocument();
  });

  it("mostra o board da cozinha quando autenticado", () => {
    estaAutenticado = true;
    render(<App />);
    expect(screen.getByText("Board da cozinha")).toBeInTheDocument();
  });
});
