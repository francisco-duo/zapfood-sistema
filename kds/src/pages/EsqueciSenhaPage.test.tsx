import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

vi.mock("../services/authService", () => ({
  authService: { esqueciSenha: vi.fn() },
}));

import { authService } from "../services/authService";
import EsqueciSenhaPage from "./EsqueciSenhaPage";

describe("EsqueciSenhaPage (kds)", () => {
  it("envia o e-mail e mostra a mensagem de sucesso", async () => {
    (authService.esqueciSenha as ReturnType<typeof vi.fn>).mockResolvedValue({
      mensagem: "Se o e-mail existir, enviaremos um link.",
    });
    const user = userEvent.setup();
    render(<EsqueciSenhaPage onVoltar={vi.fn()} />);

    await user.type(screen.getByLabelText("E-mail cadastrado", { exact: false }), "cozinha@zapfood.com");
    await user.click(screen.getByRole("button", { name: "Enviar link de redefinição" }));

    expect(await screen.findByText("Se o e-mail existir, enviaremos um link.")).toBeInTheDocument();
    expect(authService.esqueciSenha).toHaveBeenCalledWith("cozinha@zapfood.com");
  });

  it("mostra erro quando a solicitação falha", async () => {
    (authService.esqueciSenha as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("Falha ao enviar."));
    const user = userEvent.setup();
    render(<EsqueciSenhaPage onVoltar={vi.fn()} />);

    await user.type(screen.getByLabelText("E-mail cadastrado", { exact: false }), "cozinha@zapfood.com");
    await user.click(screen.getByRole("button", { name: "Enviar link de redefinição" }));

    expect(await screen.findByText("Falha ao enviar.")).toBeInTheDocument();
  });

  it("chama onVoltar ao clicar em voltar para o login", async () => {
    const onVoltar = vi.fn();
    const user = userEvent.setup();
    render(<EsqueciSenhaPage onVoltar={onVoltar} />);

    await user.click(screen.getByRole("button", { name: "Voltar para o login" }));
    expect(onVoltar).toHaveBeenCalled();
  });
});
