import { LogicRound } from "@/lib/game-core/types";

type UiLanguage = "vi" | "en";

interface LogicGenerationOptions {
  maxStep?: number;
  allowMultiplyPattern?: boolean;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function generateLogicRound(limit: number, options: LogicGenerationOptions = {}): LogicRound {
  const safeLimit = Math.max(12, Math.round(limit));
  const safeStep = Math.max(2, Math.min(10, options.maxStep ?? 5));
  const allowMultiply = options.allowMultiplyPattern ?? safeLimit >= 50;
  const useMultiply = allowMultiply && Math.random() < 0.35;

  let sequence: number[] = [];
  let answer = 0;

  if (useMultiply) {
    const factor = Math.random() < 0.5 ? 2 : 3;
    const start = randomInt(2, Math.max(4, Math.floor(safeLimit / (factor * factor * factor))));
    sequence = [start, start * factor, start * factor * factor];
    answer = start * factor * factor * factor;
  } else {
    const step = randomInt(1, safeStep);
    const maxStart = Math.max(3, safeLimit - step * 4);
    const start = randomInt(1, maxStart);
    sequence = [start, start + step, start + step * 2];
    answer = start + step * 3;
  }

  const choices = new Set<number>([answer]);
  while (choices.size < 4) {
    const candidate = Math.max(0, answer + randomInt(-safeStep * 2, safeStep * 2));
    if (candidate !== answer) {
      choices.add(candidate);
    }
  }

  return {
    sequence,
    answer,
    choices: shuffle(Array.from(choices)),
  };
}

export function getLogicHint(round: LogicRound, language: UiLanguage = "vi"): string {
  const [first, second, third] = round.sequence;
  const deltaA = second - first;
  const deltaB = third - second;
  if (language === "en") {
    if (deltaA === deltaB) {
      return `Hint: the sequence increases by ${deltaA} each step.`;
    }
    return "Hint: check if each number is multiplied by the same factor.";
  }
  if (deltaA === deltaB) {
    return `Goi y: day so tang them ${deltaA} moi buoc.`;
  }
  return "Goi y: thu kiem tra xem moi so co nhan cung 1 he so hay khong.";
}
