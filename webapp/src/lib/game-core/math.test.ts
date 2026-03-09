import { describe, expect, it } from "vitest";
import {
  calculateEarnedScore,
  generateMathQuestion,
  getDetectiveRank,
  getMathHint,
} from "@/lib/game-core/math";

describe("math game core", () => {
  it("generates a question with valid choices and answer", () => {
    const question = generateMathQuestion(20);

    expect(question.choices).toHaveLength(4);
    expect(new Set(question.choices).size).toBe(4);
    expect(question.choices).toContain(question.answer);
  });

  it("applies combo scoring rule", () => {
    expect(calculateEarnedScore(1, 10)).toBe(10);
    expect(calculateEarnedScore(2, 10)).toBe(10);
    expect(calculateEarnedScore(3, 10)).toBe(30);
  });

  it("supports age-profile generation options", () => {
    const question = generateMathQuestion(100, {
      operators: ["+"],
      operandMax: 10,
      answerMax: 20,
    });

    expect(question.operator).toBe("+");
    expect(question.left).toBeLessThanOrEqual(10);
    expect(question.right).toBeLessThanOrEqual(10);
    expect(question.answer).toBeLessThanOrEqual(20);
  });

  it("keeps subtraction questions non-negative", () => {
    for (let index = 0; index < 20; index += 1) {
      const question = generateMathQuestion(30, { operators: ["-"] });
      expect(question.operator).toBe("-");
      expect(question.left).toBeGreaterThanOrEqual(question.right);
      expect(question.answer).toBeGreaterThanOrEqual(0);
    }
  });

  it("clamps addition output by answerMax", () => {
    for (let index = 0; index < 20; index += 1) {
      const question = generateMathQuestion(50, {
        operators: ["+"],
        operandMax: 20,
        answerMax: 5,
      });
      expect(question.answer).toBeLessThanOrEqual(5);
      question.choices.forEach((choice) => {
        expect(choice).toBeGreaterThanOrEqual(0);
      });
    }
  });

  it("returns correct detective rank labels in both languages", () => {
    expect(getDetectiveRank(10, "vi")).toBe("Tham tu Tre");
    expect(getDetectiveRank(100, "vi")).toBe("Tham tu Dong");
    expect(getDetectiveRank(200, "vi")).toBe("Tham tu Bac");
    expect(getDetectiveRank(300, "vi")).toBe("Tham tu Vang");
    expect(getDetectiveRank(500, "vi")).toBe("Sieu Tham tu");

    expect(getDetectiveRank(10, "en")).toBe("Junior Detective");
    expect(getDetectiveRank(100, "en")).toBe("Bronze Detective");
    expect(getDetectiveRank(200, "en")).toBe("Silver Detective");
    expect(getDetectiveRank(300, "en")).toBe("Gold Detective");
    expect(getDetectiveRank(500, "en")).toBe("Super Detective");
  });

  it("returns localized hint content for both operators", () => {
    expect(getMathHint({ left: 8, right: 3, operator: "+", answer: 11, choices: [11, 10, 12, 9] }, "vi"))
      .toContain("lon hon");
    expect(getMathHint({ left: 8, right: 3, operator: "-", answer: 5, choices: [5, 4, 6, 7] }, "vi"))
      .toContain("khong am");

    expect(getMathHint({ left: 8, right: 3, operator: "+", answer: 11, choices: [11, 10, 12, 9] }, "en"))
      .toContain("greater than");
    expect(getMathHint({ left: 8, right: 3, operator: "-", answer: 5, choices: [5, 4, 6, 7] }, "en"))
      .toContain("not negative");
  });
});
