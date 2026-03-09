import { describe, expect, it } from "vitest";
import { generateVocabRound, getVocabHint } from "@/lib/game-core/vocab";

describe("vocab game", () => {
  it("generates vi->en vocab rounds with valid choices", () => {
    const round = generateVocabRound({ ageGroup: "age_5_6", direction: "vi_to_en" });
    expect(round.direction).toBe("vi_to_en");
    expect(round.choices).toHaveLength(4);
    expect(round.choices).toContain(round.answer);
  });

  it("generates en->vi vocab rounds and localized hint", () => {
    const round = generateVocabRound({ ageGroup: "age_9_10", direction: "en_to_vi" });
    expect(round.direction).toBe("en_to_vi");
    expect(round.choices).toContain(round.answer);
    expect(getVocabHint(round, "vi")).toContain(round.answer);
    expect(getVocabHint(round, "en")).toContain(round.answer);
  });
});

