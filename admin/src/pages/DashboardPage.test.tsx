import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../services/metricsService", () => ({ calcularMetricasDoDia: vi.fn() }));

import { calcularMetricasDoDia } from "../services/metricsService";
import DashboardPage from "./DashboardPage";

describe("DashboardPage", () => {
  it("mostra as métricas e o ranking de produtos", async () => {
    (calcularMetricasDoDia as ReturnType<typeof vi.fn>).mockResolvedValue({
      faturamentoBruto: 500,
      ticketMedio: 50,
      totalPedidos: 10,
      rankingProdutos: [{ produtoId: "p1", nome: "X-Burger", quantidade: 5, total: 100 }],
    });

    render(<DashboardPage />);

    expect(await screen.findByText("X-Burger")).toBeInTheDocument();
    expect(screen.getByText("R$ 500,00")).toBeInTheDocument();
  });

  it("mostra mensagem quando não há vendas hoje", async () => {
    (calcularMetricasDoDia as ReturnType<typeof vi.fn>).mockResolvedValue({
      faturamentoBruto: 0,
      ticketMedio: 0,
      totalPedidos: 0,
      rankingProdutos: [],
    });

    render(<DashboardPage />);
    expect(await screen.findByText("Nenhum item vendido hoje ainda.")).toBeInTheDocument();
  });

  it("mostra erro quando o cálculo das métricas falha", async () => {
    (calcularMetricasDoDia as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("falhou"));
    render(<DashboardPage />);
    expect(await screen.findByText("Não foi possível carregar as métricas do dia.")).toBeInTheDocument();
  });
});
