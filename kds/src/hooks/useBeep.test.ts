import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useBeep } from "./useBeep";

function instalarAudioContextFalso() {
  const oscilador = {
    type: "",
    frequency: { value: 0 },
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
  };
  const ganho = {
    gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
    connect: vi.fn(),
  };
  const contexto = {
    state: "running",
    currentTime: 0,
    resume: vi.fn(),
    createOscillator: vi.fn(() => oscilador),
    createGain: vi.fn(() => ganho),
    destination: {},
  };
  const construtor = vi.fn(() => contexto);
  vi.stubGlobal("AudioContext", construtor);
  return { contexto, oscilador, ganho, construtor };
}

describe("useBeep", () => {
  beforeEach(() => {
    instalarAudioContextFalso();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("toca um beep criando osciladores conectados ao destino", () => {
    const { result } = renderHook(() => useBeep());
    result.current();

    const AudioContextFalso = window.AudioContext as unknown as ReturnType<typeof vi.fn>;
    expect(AudioContextFalso).toHaveBeenCalledTimes(1);
  });

  it("toca o beep de novo sem lançar numa segunda chamada", () => {
    const { result } = renderHook(() => useBeep());
    result.current();
    expect(() => result.current()).not.toThrow();
  });

  it("não lança quando o navegador não suporta Web Audio", () => {
    vi.stubGlobal("AudioContext", undefined);
    const { result } = renderHook(() => useBeep());
    expect(() => result.current()).not.toThrow();
  });
});
