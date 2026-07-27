import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

const login = vi.fn();
vi.mock("../context/AuthContext", () => ({ useAuth: () => ({ login }) }));

import LoginPage from "./LoginPage";

describe("LoginPage (kds)", () => {
  it("faz login com e-mail e senha preenchidos", async () => {
    login.mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<LoginPage onEsqueciSenha={vi.fn()} />);

    await user.type(screen.getByLabelText("E-mail", { exact: false }), "cozinha@zapfood.com");
    await user.type(screen.getByLabelText("Senha", { exact: false }), "senha123");
    await user.click(screen.getByRole("button", { name: "Entrar" }));

    expect(login).toHaveBeenCalledWith("cozinha@zapfood.com", "senha123");
  });

  it("mostra mensagem de erro quando o login falha", async () => {
    login.mockRejectedValue(new Error("Credenciais inválidas."));
    const user = userEvent.setup();
    render(<LoginPage onEsqueciSenha={vi.fn()} />);

    await user.type(screen.getByLabelText("E-mail", { exact: false }), "cozinha@zapfood.com");
    await user.type(screen.getByLabelText("Senha", { exact: false }), "errada");
    await user.click(screen.getByRole("button", { name: "Entrar" }));

    expect(await screen.findByText("Credenciais inválidas.")).toBeInTheDocument();
  });

  it("chama onEsqueciSenha ao clicar no link", async () => {
    const onEsqueciSenha = vi.fn();
    const user = userEvent.setup();
    render(<LoginPage onEsqueciSenha={onEsqueciSenha} />);

    await user.click(screen.getByText("Esqueci minha senha"));
    expect(onEsqueciSenha).toHaveBeenCalled();
  });
});
