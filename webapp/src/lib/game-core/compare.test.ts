import { describe, expect, it } from "vitest";
import { generateCompareRound, getCompareHint } from "@/lib/game-core/compare";

describe("compare game", () => {
  it("generates a valid compare round", () => {
    const round = generateCompareRound(60, { minValue: 5, maxValue: 60 });
    expect(round.choices).toHaveLength(4);
    expect(round.choices).toContain(round.answer);
    expect(round.answer).toBe(Math.max(round.left, round.right));
  });

  it("returns localized compare hint", () => {
    const round = { left: 12, right: 19, answer: 19, choices: [19, 17, 14, 22] };
    expect(getCompareHint(round, "vi")).toContain("19");
    expect(getCompareHint(round, "en")).toContain("19");
  });
});

