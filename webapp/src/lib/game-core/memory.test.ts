import { describe, expect, it } from "vitest";
import { generateMemoryRound } from "@/lib/game-core/memory";

describe("memory game core", () => {
  it("generates valid memory round", () => {
    const round = generateMemoryRound(50);

    expect(round.choices).toHaveLength(4);
    expect(round.choices).toContain(round.answer);
    expect(round.sequence.length).toBeGreaterThanOrEqual(5);
    expect(round.sequence.includes(round.answer)).toBe(true);
  });

  it("supports age-profile memory options", () => {
    const round = generateMemoryRound(100, {
      complexityOverride: 7,
      minAnswerCount: 3,
      maxAnswerCount: 3,
    });
    const answerCount = round.sequence.filter((item) => item === round.answer).length;

    expect(round.sequence).toHaveLength(7);
    expect(answerCount).toBe(3);
  });
});
