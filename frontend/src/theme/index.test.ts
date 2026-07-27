import { describe, expect, it } from "vitest";
import theme from "./index";

describe("theme", () => {
  it("define a paleta de cores da marca", () => {
    expect(theme.palette.primary.main).toBe("#FF5A36");
    expect(theme.palette.secondary.main).toBe("#171418");
  });

  it("define o raio de borda padrão", () => {
    expect(theme.shape.borderRadius).toBe(20);
  });
});
