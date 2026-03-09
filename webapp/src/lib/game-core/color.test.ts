import { describe, expect, it } from "vitest";
import {
  generateColorRound,
  getColorEnglishName,
  getColorHexByName,
  getColorHint,
  getColorMarker,
} from "@/lib/game-core/color";

describe("color reflex core", () => {
  it("returns a valid color question", () => {
    const round = generateColorRound();

    expect(round.choices).toHaveLength(4);
    expect(round.choices).toContain(round.answerColorName);
    expect(round.word.length).toBeGreaterThan(0);
    expect(round.wordColorHex.startsWith("#")).toBe(true);
  });

  it("supports configurable word/color match chance", () => {
    const alwaysMatch = generateColorRound({ matchChance: 1 });
    expect(alwaysMatch.word).toBe(alwaysMatch.answerColorName);
  });

  it("supports age-specific palette and vocabulary overrides", () => {
    const round = generateColorRound({
      matchChance: 0,
      palette: [
        { name: "Do", hex: "#ff4d4f" },
        { name: "Xanh Duong", hex: "#1fb6ff" },
        { name: "Vang", hex: "#ffb703" },
        { name: "Xanh La", hex: "#52c41a" },
      ],
      wordPool: ["Do", "Xanh Duong", "Vang", "Xanh La", "Tim"],
    });

    expect(round.choices).toHaveLength(4);
    round.choices.forEach((choice) => {
      expect(["Do", "Xanh Duong", "Vang", "Xanh La"].includes(choice)).toBe(true);
    });
    expect(round.word).not.toBe(round.answerColorName);
  });

  it("falls back safely for short palettes and duplicate word pools", () => {
    const round = generateColorRound({
      matchChance: 0,
      palette: [
        { name: "Do", hex: "#ff4d4f" },
        { name: "Do", hex: "#ff4d4f" },
        { name: "Do", hex: "#ff4d4f" },
      ],
      wordPool: ["Do", "Do"],
    });

    expect(round.choices).toHaveLength(4);
    expect(round.choices).toContain(round.answerColorName);
    expect(round.word.length).toBeGreaterThan(0);
  });

  it("returns helper labels and fallback values", () => {
    expect(getColorHint("Do", "vi")).toContain("dap an la Do");
    expect(getColorHint("Do", "en")).toContain("answer is Red");

    expect(getColorHexByName("Do")).toBe("#ff4d4f");
    expect(getColorHexByName("Unknown")).toBe("#1fb6ff");

    expect(getColorEnglishName("Xanh Duong")).toBe("Blue");
    expect(getColorEnglishName("Unknown")).toBe("Unknown");

    expect(getColorMarker("Hong")).toBe("♥");
    expect(getColorMarker("Unknown")).toBe("●");
  });
});
