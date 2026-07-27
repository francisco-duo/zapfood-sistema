import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { describe, expect, it } from "vitest";
import OrderConfirmedPage from "./OrderConfirmedPage";

describe("OrderConfirmedPage", () => {
  it("mostra a mensagem de sucesso e volta ao cardápio ao clicar", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/pedido-confirmado"]}>
        <Routes>
          <Route path="/pedido-confirmado" element={<OrderConfirmedPage />} />
          <Route path="/" element={<div>cardápio</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("Pedido enviado com sucesso!")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Voltar ao cardápio" }));
    expect(screen.getByText("cardápio")).toBeInTheDocument();
  });
});
