import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../services/authService", () => ({
  authService: { redefinirSenha: vi.fn() },
}));

import { authService } from "../services/authService";
import RedefinirSenhaPage from "./RedefinirSenhaPage";

function irPara(search: string) {
  window.history.pushState({}, "", `/redefinir-senha${search}`);
}

describe("RedefinirSenhaPage (kds)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    irPara("?token=abc123");
  });

  it("mostra erro se o link não tiver token", async () => {
    irPara("");
    const user = userEvent.setup();
    render(<RedefinirSenhaPage />);

    await user.type(screen.getByLabelText(/^Nova senha/), "12345678");
    await user.type(screen.getByLabelText(/^Confirmar nova senha/), "12345678");
    await user.click(screen.getByRole("button", { name: "Redefinir senha" }));

    expect(await screen.findByText("Link de redefinição inválido.")).toBeInTheDocument();
    expect(authService.redefinirSenha).not.toHaveBeenCalled();
  });

  it("mostra erro se as senhas não coincidirem", async () => {
    const user = userEvent.setup();
    render(<RedefinirSenhaPage />);

    await user.type(screen.getByLabelText(/^Nova senha/), "12345678");
    await user.type(screen.getByLabelText(/^Confirmar nova senha/), "diferente");
    await user.click(screen.getByRole("button", { name: "Redefinir senha" }));

    expect(await screen.findByText("As senhas não coincidem.")).toBeInTheDocument();
    expect(authService.redefinirSenha).not.toHaveBeenCalled();
  });

  it("redefine a senha com sucesso e mostra a mensagem", async () => {
    (authService.redefinirSenha as ReturnType<typeof vi.fn>).mockResolvedValue({
      mensagem: "Senha redefinida com sucesso.",
    });
    const user = userEvent.setup();
    render(<RedefinirSenhaPage />);

    await user.type(screen.getByLabelText(/^Nova senha/), "12345678");
    await user.type(screen.getByLabelText(/^Confirmar nova senha/), "12345678");
    await user.click(screen.getByRole("button", { name: "Redefinir senha" }));

    expect(await screen.findByText("Senha redefinida com sucesso.")).toBeInTheDocument();
    expect(authService.redefinirSenha).toHaveBeenCalledWith("abc123", "12345678");
    expect(screen.getByRole("button", { name: "Ir para o login" })).toBeInTheDocument();
  });

  it("mostra erro quando o link é inválido ou expirado", async () => {
    (authService.redefinirSenha as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("Link expirado."));
    const user = userEvent.setup();
    render(<RedefinirSenhaPage />);

    await user.type(screen.getByLabelText(/^Nova senha/), "12345678");
    await user.type(screen.getByLabelText(/^Confirmar nova senha/), "12345678");
    await user.click(screen.getByRole("button", { name: "Redefinir senha" }));

    expect(await screen.findByText("Link expirado.")).toBeInTheDocument();
  });
});
