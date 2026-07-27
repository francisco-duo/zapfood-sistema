import { describe, expect, it } from "vitest";
import theme from "./index";

describe("theme (admin)", () => {
  it("define a paleta de cores", () => {
    expect(theme.palette.primary.main).toBeTruthy();
  });
});
