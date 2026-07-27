import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../services/authService", () => ({
  authService: {
    obterSessao: vi.fn().mockReturnValue(null),
    login: vi.fn(),
    cadastrar: vi.fn(),
    logout: vi.fn(),
    me: vi.fn(),
  },
}));

import { authService } from "../../services/authService";
import { AuthProvider } from "../../context/AuthContext";
import AuthDialog from "./AuthDialog";

function renderDialog(onSucesso = vi.fn(), onClose = vi.fn()) {
  render(
    <MemoryRouter>
      <AuthProvider>
        <AuthDialog open onClose={onClose} onSucesso={onSucesso} />
      </AuthProvider>
    </MemoryRouter>
  );
  return { onSucesso, onClose };
}

describe("AuthDialog", () => {
  beforeEach(() => vi.clearAllMocks());

  it("faz login com e-mail e senha preenchidos", async () => {
    (authService.login as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "u1",
      nome: "Ana",
      email: "ana@example.com",
      perfil: "cliente",
      email_verificado: true,
    });
    const user = userEvent.setup();
    const { onSucesso } = renderDialog();

    await user.type(screen.getByLabelText("E-mail", { exact: false }), "ana@example.com");
    await user.type(screen.getByLabelText("Senha", { exact: false }), "senha12345");
    await user.click(screen.getByRole("button", { name: "Entrar" }));

    expect(authService.login).toHaveBeenCalledWith({ email: "ana@example.com", senha: "senha12345" });
    expect(onSucesso).toHaveBeenCalled();
  });

  it("mostra a mensagem de erro quando o login falha", async () => {
    (authService.login as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("E-mail ou senha inválidos.")
    );
    const user = userEvent.setup();
    renderDialog();

    await user.type(screen.getByLabelText("E-mail", { exact: false }), "ana@example.com");
    await user.type(screen.getByLabelText("Senha", { exact: false }), "senhaErrada");
    await user.click(screen.getByRole("button", { name: "Entrar" }));

    expect(await screen.findByText("E-mail ou senha inválidos.")).toBeInTheDocument();
  });

  it("aba de cadastro mostra os campos nome e telefone", async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.click(screen.getByRole("tab", { name: "Criar conta" }));

    expect(screen.getByLabelText("Nome completo", { exact: false })).toBeInTheDocument();
    expect(screen.getByLabelText("Telefone (opcional)")).toBeInTheDocument();
    expect(screen.queryByText("Esqueci minha senha")).not.toBeInTheDocument();
  });

  it("cadastra um novo cliente com os dados do formulário", async () => {
    (authService.cadastrar as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "u2",
      nome: "Bia",
      email: "bia@example.com",
      perfil: "cliente",
      email_verificado: false,
    });
    const user = userEvent.setup();
    const { onSucesso } = renderDialog();

    await user.click(screen.getByRole("tab", { name: "Criar conta" }));
    await user.type(screen.getByLabelText("Nome completo", { exact: false }), "Bia");
    await user.type(screen.getByLabelText("E-mail", { exact: false }), "bia@example.com");
    await user.type(screen.getByLabelText("Senha", { exact: false }), "senha12345");
    await user.click(screen.getByRole("button", { name: "Criar conta" }));

    expect(authService.cadastrar).toHaveBeenCalledWith({
      nome: "Bia",
      email: "bia@example.com",
      senha: "senha12345",
      telefone: undefined,
    });
    expect(onSucesso).toHaveBeenCalled();
  });

  it("fechar o diálogo pelo X chama onClose", async () => {
    const user = userEvent.setup();
    const { onClose } = renderDialog();

    await user.click(screen.getByRole("button", { name: "Fechar" }));

    expect(onClose).toHaveBeenCalled();
  });

  it("esqueci minha senha fecha o diálogo e navega pra tela de recuperação", async () => {
    const user = userEvent.setup();
    const { onClose } = renderDialog();

    await user.click(screen.getByText("Esqueci minha senha"));

    expect(onClose).toHaveBeenCalled();
  });
});
