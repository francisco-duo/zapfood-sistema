import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useKdsSocket } from "./useKdsSocket";
import { authStorage } from "../services/authStorage";

class WebSocketFalso {
  static instancias: WebSocketFalso[] = [];
  url: string;
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: (() => void) | null = null;
  fechado = false;

  constructor(url: string) {
    this.url = url;
    WebSocketFalso.instancias.push(this);
  }

  close() {
    this.fechado = true;
    this.onclose?.();
  }
}

describe("useKdsSocket", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    WebSocketFalso.instancias = [];
    vi.stubGlobal("WebSocket", WebSocketFalso);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    authStorage.limpar();
  });

  it("não conecta quando não há token salvo", () => {
    renderHook(() => useKdsSocket(vi.fn()));
    expect(WebSocketFalso.instancias).toHaveLength(0);
  });

  it("conecta usando o token na query string e fica 'conectado' no onopen", () => {
    authStorage.salvar("meu-token", { id: "u1", nome: "Cozinha", email: "c@c.com", perfil: "cozinha" });
    const { result } = renderHook(() => useKdsSocket(vi.fn()));

    expect(WebSocketFalso.instancias).toHaveLength(1);
    expect(WebSocketFalso.instancias[0].url).toContain("token=meu-token");
    expect(result.current.conectado).toBe(false);

    act(() => WebSocketFalso.instancias[0].onopen?.());
    expect(result.current.conectado).toBe(true);
  });

  it("repassa mensagens recebidas já parseadas pro callback", () => {
    authStorage.salvar("meu-token", { id: "u1", nome: "Cozinha", email: "c@c.com", perfil: "cozinha" });
    const onMensagem = vi.fn();
    renderHook(() => useKdsSocket(onMensagem));

    const mensagem = { tipo: "pedido_removido", pedido_id: "p1" };
    act(() => WebSocketFalso.instancias[0].onmessage?.({ data: JSON.stringify(mensagem) }));

    expect(onMensagem).toHaveBeenCalledWith(mensagem);
  });

  it("ignora mensagens que não são JSON válido", () => {
    authStorage.salvar("meu-token", { id: "u1", nome: "Cozinha", email: "c@c.com", perfil: "cozinha" });
    const onMensagem = vi.fn();
    renderHook(() => useKdsSocket(onMensagem));

    act(() => WebSocketFalso.instancias[0].onmessage?.({ data: "não é json" }));
    expect(onMensagem).not.toHaveBeenCalled();
  });

  it("reconecta automaticamente depois que a conexão cai", () => {
    authStorage.salvar("meu-token", { id: "u1", nome: "Cozinha", email: "c@c.com", perfil: "cozinha" });
    renderHook(() => useKdsSocket(vi.fn()));

    act(() => WebSocketFalso.instancias[0].onclose?.());
    expect(WebSocketFalso.instancias).toHaveLength(1); // ainda não reconectou

    act(() => vi.advanceTimersByTime(2000));
    expect(WebSocketFalso.instancias).toHaveLength(2);
  });

  it("erro no socket força o fechamento da conexão", () => {
    authStorage.salvar("meu-token", { id: "u1", nome: "Cozinha", email: "c@c.com", perfil: "cozinha" });
    renderHook(() => useKdsSocket(vi.fn()));

    act(() => WebSocketFalso.instancias[0].onerror?.());
    expect(WebSocketFalso.instancias[0].fechado).toBe(true);
  });

  it("desmontar fecha o socket e não agenda reconexão", () => {
    authStorage.salvar("meu-token", { id: "u1", nome: "Cozinha", email: "c@c.com", perfil: "cozinha" });
    const { unmount } = renderHook(() => useKdsSocket(vi.fn()));

    unmount();
    expect(WebSocketFalso.instancias[0].fechado).toBe(true);

    vi.advanceTimersByTime(5000);
    expect(WebSocketFalso.instancias).toHaveLength(1); // não reconectou após desmontar
  });
});
