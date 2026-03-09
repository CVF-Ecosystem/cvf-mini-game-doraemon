import { CompareRound } from "@/lib/game-core/types";

type UiLanguage = "vi" | "en";

interface CompareGenerationOptions {
  minValue?: number;
  maxValue?: number;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let idx = arr.length - 1; idx > 0; idx -= 1) {
    const pick = Math.floor(Math.random() * (idx + 1));
    [arr[idx], arr[pick]] = [arr[pick], arr[idx]];
  }
  return arr;
}

export function generateCompareRound(limit: number, options: CompareGenerationOptions = {}): CompareRound {
  const safeMax = Math.max(12, Math.min(120, Math.round(options.maxValue ?? limit)));
  const safeMin = Math.max(1, Math.min(safeMax - 2, Math.round(options.minValue ?? 1)));

  const left = randomInt(safeMin, safeMax);
  let right = randomInt(safeMin, safeMax);
  if (right === left) {
    right = Math.max(safeMin, Math.min(safeMax, right + (Math.random() < 0.5 ? -1 : 1)));
  }

  const answer = Math.max(left, right);
  const spread = Math.max(3, Math.ceil((safeMax - safeMin) * 0.08));
  const choices = new Set<number>([answer]);

  while (choices.size < 4) {
    const candidate = Math.max(safeMin, Math.min(safeMax, answer + randomInt(-spread * 2, spread * 2)));
    if (candidate !== answer) {
      choices.add(candidate);
    }
  }

  return {
    left,
    right,
    answer,
    choices: shuffle(Array.from(choices)),
  };
}

export function getCompareHint(round: CompareRound, language: UiLanguage = "vi"): string {
  const bigger = Math.max(round.left, round.right);
  if (language === "en") {
    return `Hint: pick the larger value, which is ${bigger}.`;
  }
  return `Goi y: chon so lon hon, do la ${bigger}.`;
}

