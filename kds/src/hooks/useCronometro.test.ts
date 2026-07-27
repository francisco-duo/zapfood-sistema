import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useCronometro, formatarTempo } from "./useCronometro";

describe("formatarTempo", () => {
  it("formata segundos em mm:ss com zero à esquerda", () => {
    expect(formatarTempo(0)).toBe("00:00");
    expect(formatarTempo(65)).toBe("01:05");
    expect(formatarTempo(600)).toBe("10:00");
  });
});

describe("useCronometro", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("começa com os segundos decorridos desde o início", () => {
    const inicio = Date.now() - 5000;
    const { result } = renderHook(() => useCronometro(inicio));
    expect(result.current).toBe(5);
  });

  it("atualiza a cada segundo", () => {
    const inicio = Date.now();
    const { result } = renderHook(() => useCronometro(inicio));
    expect(result.current).toBe(0);

    act(() => vi.advanceTimersByTime(3000));
    expect(result.current).toBe(3);
  });
});
