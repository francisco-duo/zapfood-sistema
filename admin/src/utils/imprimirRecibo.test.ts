import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { imprimirRecibo, type DadosRecibo } from "./imprimirRecibo";

const dados: DadosRecibo = {
  pedidoId: "12345678-abcd",
  itens: [{ nome: "X-Burger <especial>", quantidade: 2, precoUnitario: 20 }],
  total: 40,
  formaPagamento: "Pix",
  tipoEntregaRotulo: "Retirada",
  enderecoEntrega: "Rua A, 10",
  dataHora: new Date("2026-01-01T12:00:00"),
};

describe("imprimirRecibo", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
    document.querySelectorAll("iframe").forEach((el) => el.remove());
  });

  it("cria um iframe oculto, escreve o recibo e chama print no load", () => {
    const printSpy = vi.fn();
    const focusSpy = vi.fn();

    imprimirRecibo(dados);

    const iframe = document.querySelector("iframe") as HTMLIFrameElement;
    expect(iframe).toBeTruthy();

    // jsdom não implementa contentWindow.print(); stub antes de disparar o load.
    Object.defineProperty(iframe.contentWindow, "print", { value: printSpy, configurable: true });
    Object.defineProperty(iframe.contentWindow, "focus", { value: focusSpy, configurable: true });

    iframe.onload?.(new Event("load"));

    expect(printSpy).toHaveBeenCalled();
    expect(focusSpy).toHaveBeenCalled();

    const html = iframe.contentDocument?.documentElement.innerHTML ?? "";
    expect(html).toContain("Pedido #12345678");
    expect(html).toContain("X-Burger &lt;especial&gt;"); // escapado, sem HTML injetado
    expect(html).toContain("Rua A, 10");
  });

  it("remove o iframe depois do timeout de segurança (fallback do afterprint)", () => {
    imprimirRecibo(dados);
    const iframe = document.querySelector("iframe") as HTMLIFrameElement;
    Object.defineProperty(iframe.contentWindow, "print", { value: vi.fn(), configurable: true });
    Object.defineProperty(iframe.contentWindow, "focus", { value: vi.fn(), configurable: true });

    iframe.onload?.(new Event("load"));
    expect(document.querySelector("iframe")).toBeTruthy();

    vi.advanceTimersByTime(2000);
    expect(document.querySelector("iframe")).toBeFalsy();
  });

  it("não quebra quando o pedido não tem endereço de entrega", () => {
    imprimirRecibo({ ...dados, enderecoEntrega: null });
    const iframe = document.querySelector("iframe") as HTMLIFrameElement;
    Object.defineProperty(iframe.contentWindow, "print", { value: vi.fn(), configurable: true });
    Object.defineProperty(iframe.contentWindow, "focus", { value: vi.fn(), configurable: true });
    iframe.onload?.(new Event("load"));

    const html = iframe.contentDocument?.documentElement.innerHTML ?? "";
    expect(html).not.toContain("Endereço:");
  });
});
