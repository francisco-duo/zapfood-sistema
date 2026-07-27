import { describe, expect, it } from "vitest";
import theme from "./index";

describe("theme (kds)", () => {
  it("define a paleta de cores em modo escuro", () => {
    expect(theme.palette.mode).toBe("dark");
    expect(theme.palette.primary.main).toBeTruthy();
  });
});
