import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { registrarLog } from "../services/logService";
import LogsPage from "./LogsPage";

describe("LogsPage", () => {
  beforeEach(() => localStorage.clear());

  it("mostra mensagem quando não há logs", () => {
    render(<LogsPage />);
    expect(screen.getByText("Nenhum registro encontrado.")).toBeInTheDocument();
  });

  it("lista os logs já registrados", () => {
    registrarLog("catalogo", "Produto X criado.");
    render(<LogsPage />);
    expect(screen.getByText("Produto X criado.")).toBeInTheDocument();
    expect(screen.getByText("Catálogo")).toBeInTheDocument();
  });

  it("filtra os logs por categoria", async () => {
    registrarLog("catalogo", "Produto X criado.");
    registrarLog("preco", "Preço alterado.");
    const user = userEvent.setup();
    render(<LogsPage />);

    await user.click(screen.getByLabelText("Filtrar por categoria", { exact: false }));
    await user.click(screen.getByRole("option", { name: "Alteração de preço" }));

    expect(screen.getByText("Preço alterado.")).toBeInTheDocument();
    expect(screen.queryByText("Produto X criado.")).not.toBeInTheDocument();
  });

  it("registrar abertura/fechamento da loja cria um novo log", async () => {
    const user = userEvent.setup();
    render(<LogsPage />);

    await user.click(screen.getByRole("button", { name: "Registrar abertura da loja" }));
    expect(screen.getByText("Loja aberta para pedidos.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Registrar fechamento" }));
    expect(screen.getByText("Loja fechada para pedidos.")).toBeInTheDocument();
  });
});
