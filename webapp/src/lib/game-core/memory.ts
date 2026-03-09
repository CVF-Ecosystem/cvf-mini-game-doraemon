import { MemoryRound } from "@/lib/game-core/types";

type UiLanguage = "vi" | "en";

const SYMBOL_POOL = ["🚀", "🛰️", "🌟", "🪐", "🔭", "🧪", "🧠", "⚡", "🛸", "📡"];

interface MemoryGenerationOptions {
  symbolPool?: string[];
  complexityOverride?: number;
  revealSecondsOverride?: number;
  minAnswerCount?: number;
  maxAnswerCount?: number;
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

function pickDistinctSymbols(count: number, symbolPool: string[]): string[] {
  return shuffle(symbolPool).slice(0, count);
}

export function generateMemoryRound(limit: number, options: MemoryGenerationOptions = {}): MemoryRound {
  const defaultComplexity = limit <= 20 ? 5 : limit <= 50 ? 6 : 7;
  const complexity = Math.max(4, options.complexityOverride ?? defaultComplexity);
  const defaultReveal = limit <= 20 ? 4 : limit <= 50 ? 3 : 2;
  const revealSeconds = Math.max(1, options.revealSecondsOverride ?? defaultReveal);
  const usablePool = Array.isArray(options.symbolPool) && options.symbolPool.length >= 4
    ? options.symbolPool
    : SYMBOL_POOL;

  const choicesPool = pickDistinctSymbols(4, usablePool);
  const answer = choicesPool[randomInt(0, choicesPool.length - 1)];

  const minAnswerCount = Math.max(2, Math.min(complexity - 1, options.minAnswerCount ?? 2));
  const maxAnswerCount = Math.max(minAnswerCount, Math.min(complexity - 1, options.maxAnswerCount ?? Math.max(3, Math.floor(complexity / 2) + 1)));
  const answerCount = randomInt(minAnswerCount, maxAnswerCount);
  const sequence: string[] = Array(answerCount).fill(answer);

  while (sequence.length < complexity) {
    const distractor = choicesPool[randomInt(0, choicesPool.length - 1)];
    if (distractor !== answer) {
      sequence.push(distractor);
    }
  }

  return {
    sequence: shuffle(sequence),
    choices: shuffle(choicesPool),
    answer,
    revealSeconds,
  };
}

export function getMemoryHint(answer: string, language: UiLanguage = "vi"): string {
  if (language === "en") {
    return `Hint: the correct symbol is ${answer}.`;
  }
  return `Goi y: Ky hieu dung la ${answer}.`;
}
