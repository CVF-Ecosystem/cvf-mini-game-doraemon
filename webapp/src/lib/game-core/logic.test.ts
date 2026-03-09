import { describe, expect, it } from "vitest";
import { generateLogicRound } from "@/lib/game-core/logic";

describe("logic game core", () => {
  it("generates sequence with valid choices", () => {
    const round = generateLogicRound(50);
    expect(round.sequence).toHaveLength(3);
    expect(round.choices).toHaveLength(4);
    expect(round.choices).toContain(round.answer);
  });

  it("respects smaller step configuration", () => {
    const round = generateLogicRound(20, { maxStep: 2, allowMultiplyPattern: false });
    const [first, second, third] = round.sequence;
    const stepA = second - first;
    const stepB = third - second;
    expect(stepA).toBe(stepB);
    expect(stepA).toBeLessThanOrEqual(2);
  });
});
