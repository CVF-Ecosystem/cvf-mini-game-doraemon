import {
  COLOR_LIBRARY,
  ColorEntry,
  generateCompareRound,
  generateColorRound,
  generateLogicRound,
  generateMathQuestion,
  generateMemoryRound,
  generateVocabRound,
} from "@/lib/game-core";
import { ColorRound, CompareRound, LogicRound, MathQuestion, MemoryRound, MiniGameKey, VocabRound } from "@/lib/game-core/types";

export type WeeklyThemeKey = "space" | "ocean" | "forest" | "robot";
export type ContentAgeGroup = "age_5_6" | "age_7_8" | "age_9_10";

interface WeeklyThemeConfig {
  key: WeeklyThemeKey;
  titleVi: string;
  titleEn: string;
  memorySymbols: string[];
}

export interface ContentBankState {
  weekKey: string;
  theme: WeeklyThemeKey;
  recentKeys: Record<MiniGameKey, string[]>;
}

interface NextRoundResult<T> {
  round: T;
  nextState: ContentBankState;
  usedFallback: boolean;
}

interface AgeGameCopy {
  descriptionVi: string;
  descriptionEn: string;
  focusVi: string;
  focusEn: string;
}

export interface AgeGameCopyLine {
  description: string;
  focus: string;
}

export interface ContentAdaptiveTuning {
  mathLimitDelta?: number;
  mathDeltaMode?: "balanced" | "easy" | "hard";
  memoryComplexityDelta?: number;
  colorMatchDelta?: number;
}

const STORAGE_KEY = "cvf-mini-content-bank-v1";
const HISTORY_WINDOW = 6;
const MAX_ATTEMPTS = 18;

const THEMES: WeeklyThemeConfig[] = [
  {
    key: "space",
    titleVi: "Chu de khong gian",
    titleEn: "Space theme",
    memorySymbols: ["🚀", "🛰️", "🌟", "🪐", "🔭", "🧪", "🧠", "⚡", "🛸", "📡"],
  },
  {
    key: "ocean",
    titleVi: "Chu de dai duong",
    titleEn: "Ocean theme",
    memorySymbols: ["🐬", "🐠", "🐙", "🪸", "🐳", "🦀", "🐡", "🦈", "🐚", "🫧"],
  },
  {
    key: "forest",
    titleVi: "Chu de rung xanh",
    titleEn: "Forest theme",
    memorySymbols: ["🦊", "🐻", "🦉", "🦋", "🌳", "🍄", "🐿️", "🦔", "🌲", "🐸"],
  },
  {
    key: "robot",
    titleVi: "Chu de robot",
    titleEn: "Robot theme",
    memorySymbols: ["🤖", "⚙️", "🔋", "🧩", "💡", "🛰️", "🕹️", "🔧", "📟", "🧠"],
  },
];

const COLOR_LOOKUP = new Map(COLOR_LIBRARY.map((entry) => [entry.name, entry]));

const AGE_GAME_COPY: Record<ContentAgeGroup, Record<MiniGameKey, AgeGameCopy>> = {
  age_5_6: {
    math: {
      descriptionVi: "Dem nhanh so nho va chon dap an dung.",
      descriptionEn: "Count small numbers and pick the right answer.",
      focusVi: "Tap trung vao phep cong de xay nen tang.",
      focusEn: "Focus on addition to build fundamentals.",
    },
    memory: {
      descriptionVi: "Nho chuoi ngan voi bieu tuong than quen.",
      descriptionEn: "Remember short sequences with familiar symbols.",
      focusVi: "Nho ky hieu xuat hien nhieu nhat.",
      focusEn: "Track the symbol that appears most.",
    },
    color: {
      descriptionVi: "Nhan mau co ban: xanh, vang, do, xanh la.",
      descriptionEn: "Practice core colors: blue, yellow, red, green.",
      focusVi: "Doc cham va chon dung mau chu.",
      focusEn: "Read calmly and pick the text color.",
    },
    logic: {
      descriptionVi: "Tim quy luat day so ngan, de doan so tiep theo.",
      descriptionEn: "Find simple sequence rules and guess the next number.",
      focusVi: "Nhan ra quy luat cong them.",
      focusEn: "Recognize addition patterns.",
    },
    compare: {
      descriptionVi: "So sanh 2 so va chon so lon hon.",
      descriptionEn: "Compare 2 numbers and pick the larger one.",
      focusVi: "Nhin nhanh de chon so lon hon.",
      focusEn: "Scan quickly and choose the bigger number.",
    },
    vocab: {
      descriptionVi: "Ghep cap tu Viet-Anh co ban.",
      descriptionEn: "Match basic Vietnamese-English word pairs.",
      focusVi: "Nho nghia tu don gian qua tro choi.",
      focusEn: "Build simple vocabulary through matching.",
    },
  },
  age_7_8: {
    math: {
      descriptionVi: "Cong tru linh hoat voi so vua.",
      descriptionEn: "Mix addition and subtraction with medium numbers.",
      focusVi: "Can bang toc do va do chinh xac.",
      focusEn: "Balance speed and accuracy.",
    },
    memory: {
      descriptionVi: "Nho chuoi trung binh va loai nhieu.",
      descriptionEn: "Memorize medium sequences and filter distractors.",
      focusVi: "Quan sat nhom ky hieu theo cap.",
      focusEn: "Observe symbol groups in pairs.",
    },
    color: {
      descriptionVi: "Phan xa mau voi 6 mau pho bien.",
      descriptionEn: "Color reflex with 6 common colors.",
      focusVi: "Bo qua nghia tu, chi nhin mau chu.",
      focusEn: "Ignore word meaning, track the text color.",
    },
    logic: {
      descriptionVi: "Day so voi quy luat cong/tru ro rang.",
      descriptionEn: "Sequences with clearer add/subtract rules.",
      focusVi: "So sanh 2 buoc lien tiep de tim mau chung.",
      focusEn: "Compare consecutive steps to detect the pattern.",
    },
    compare: {
      descriptionVi: "So sanh so trung binh va chon ket qua hop ly.",
      descriptionEn: "Compare medium numbers and pick the right value.",
      focusVi: "Tang toc do xu ly nhin-so sanh.",
      focusEn: "Improve visual number-comparison speed.",
    },
    vocab: {
      descriptionVi: "Ghep tu vung theo ngu canh hoc vien.",
      descriptionEn: "Match vocabulary in academy context.",
      focusVi: "Luyen song ngu moi ngay voi cap tu ngan.",
      focusEn: "Practice daily bilingual matching with short pairs.",
    },
  },
  age_9_10: {
    math: {
      descriptionVi: "Cong tru toc do cao voi so lon.",
      descriptionEn: "High-speed operations with larger numbers.",
      focusVi: "Uu tien tinh nhanh trong thoi gian ngan.",
      focusEn: "Prioritize fast mental math under time pressure.",
    },
    memory: {
      descriptionVi: "Chuoi dai hon va bo ky hieu rong.",
      descriptionEn: "Longer sequences with broader symbol sets.",
      focusVi: "Nho mau xuat hien giua nhieu lua chon.",
      focusEn: "Recall frequent symbols among more variety.",
    },
    color: {
      descriptionVi: "Phan xa mau nang cao voi palette mo rong.",
      descriptionEn: "Advanced color reflex with an expanded palette.",
      focusVi: "Xu ly nhieu tong mau gan nhau.",
      focusEn: "Differentiate closely related color tones.",
    },
    logic: {
      descriptionVi: "Day so nang cao hon, co ca mau nhan.",
      descriptionEn: "More advanced sequences, including multiply patterns.",
      focusVi: "Nhan dien nhanh cong thuoc tiep theo trong thoi gian ngan.",
      focusEn: "Infer the next rule quickly under time pressure.",
    },
    compare: {
      descriptionVi: "So sanh nhanh so lon trong gioi han thoi gian.",
      descriptionEn: "Rapidly compare larger numbers under time pressure.",
      focusVi: "Toi uu toc do va do chinh xac.",
      focusEn: "Optimize speed while staying accurate.",
    },
    vocab: {
      descriptionVi: "Song ngu nang cao voi tu hanh dong va ky nang.",
      descriptionEn: "Advanced bilingual rounds with action and skill words.",
      focusVi: "Lien ket nghia Viet-Anh nhanh va chinh xac.",
      focusEn: "Map Vietnamese-English meaning quickly and accurately.",
    },
  },
};

const AGE_COLOR_PROFILE: Record<ContentAgeGroup, { palette: ColorEntry[]; wordPool: string[]; matchChance: number }> = {
  age_5_6: {
    palette: pickPalette(["Xanh Duong", "Vang", "Do", "Xanh La"]),
    wordPool: ["Xanh Duong", "Vang", "Do", "Xanh La"],
    matchChance: 0.5,
  },
  age_7_8: {
    palette: pickPalette(["Xanh Duong", "Vang", "Do", "Xanh La", "Cam", "Hong"]),
    wordPool: ["Xanh Duong", "Vang", "Do", "Xanh La", "Cam", "Hong"],
    matchChance: 0.22,
  },
  age_9_10: {
    palette: pickPalette(["Xanh Duong", "Vang", "Do", "Xanh La", "Cam", "Hong", "Tim", "Xanh Ngoc", "Nau"]),
    wordPool: ["Xanh Duong", "Vang", "Do", "Xanh La", "Cam", "Hong", "Tim", "Xanh Ngoc", "Nau"],
    matchChance: 0.08,
  },
};

function pickPalette(names: string[]): ColorEntry[] {
  const picked = names
    .map((name) => COLOR_LOOKUP.get(name))
    .filter((entry): entry is ColorEntry => Boolean(entry));
  return picked.length >= 4 ? picked : COLOR_LIBRARY.slice(0, 4);
}

function getWeekKey(now: Date = new Date()): string {
  const utcDate = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const dayNum = utcDate.getUTCDay() || 7;
  utcDate.setUTCDate(utcDate.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(utcDate.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((utcDate.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${utcDate.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

function getThemeForWeek(weekKey: string): WeeklyThemeConfig {
  let hash = 0;
  for (let idx = 0; idx < weekKey.length; idx += 1) {
    hash = (hash * 31 + weekKey.charCodeAt(idx)) % 100000;
  }
  return THEMES[hash % THEMES.length];
}

function createDefaultRecentKeys(): Record<MiniGameKey, string[]> {
  return {
    math: [],
    memory: [],
    color: [],
    logic: [],
    compare: [],
    vocab: [],
  };
}

function cloneState(state: ContentBankState): ContentBankState {
  return {
    weekKey: state.weekKey,
    theme: state.theme,
    recentKeys: {
      math: [...state.recentKeys.math],
      memory: [...state.recentKeys.memory],
      color: [...state.recentKeys.color],
      logic: [...state.recentKeys.logic],
      compare: [...state.recentKeys.compare],
      vocab: [...state.recentKeys.vocab],
    },
  };
}

function pushRecentKey(state: ContentBankState, game: MiniGameKey, key: string): ContentBankState {
  const next = cloneState(state);
  const queue = [...next.recentKeys[game], key];
  next.recentKeys[game] = queue.slice(-HISTORY_WINDOW);
  return next;
}

function isStateLike(raw: unknown): raw is ContentBankState {
  if (!raw || typeof raw !== "object") return false;
  const item = raw as Partial<ContentBankState>;
  if (typeof item.weekKey !== "string" || typeof item.theme !== "string") return false;
  if (!item.recentKeys || typeof item.recentKeys !== "object") return false;
  return true;
}

function getKeyForMathRound(round: MathQuestion): string {
  return `${round.operator}:${round.left}:${round.right}:${round.answer}`;
}

function getKeyForMemoryRound(round: MemoryRound): string {
  return `${round.answer}|${round.sequence.join("")}|${[...round.choices].sort().join(",")}`;
}

function getKeyForColorRound(round: ColorRound): string {
  return `${round.word}|${round.answerColorName}|${round.wordColorHex}|${[...round.choices].sort().join(",")}`;
}

function getKeyForLogicRound(round: LogicRound): string {
  return `${round.sequence.join("-")}|${round.answer}|${[...round.choices].sort().join(",")}`;
}

function getKeyForCompareRound(round: CompareRound): string {
  return `${round.left}:${round.right}|${round.answer}|${[...round.choices].sort((left, right) => left - right).join(",")}`;
}

function getKeyForVocabRound(round: VocabRound): string {
  return `${round.direction}|${round.prompt}|${round.answer}|${[...round.choices].sort().join(",")}`;
}

export function getDefaultContentBankState(now: Date = new Date()): ContentBankState {
  const weekKey = getWeekKey(now);
  const theme = getThemeForWeek(weekKey);
  return {
    weekKey,
    theme: theme.key,
    recentKeys: createDefaultRecentKeys(),
  };
}

export function normalizeContentBankState(state: ContentBankState, now: Date = new Date()): ContentBankState {
  const currentWeekKey = getWeekKey(now);
  if (state.weekKey === currentWeekKey) {
    return state;
  }
  const nextTheme = getThemeForWeek(currentWeekKey);
  return {
    weekKey: currentWeekKey,
    theme: nextTheme.key,
    recentKeys: createDefaultRecentKeys(),
  };
}

export function loadContentBankState(now: Date = new Date()): ContentBankState {
  if (typeof window === "undefined") return getDefaultContentBankState(now);
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultContentBankState(now);
    const parsed = JSON.parse(raw) as unknown;
    if (!isStateLike(parsed)) return getDefaultContentBankState(now);
    const candidate: ContentBankState = {
      weekKey: parsed.weekKey,
      theme: parsed.theme as WeeklyThemeKey,
      recentKeys: {
        math: Array.isArray(parsed.recentKeys.math) ? parsed.recentKeys.math.slice(-HISTORY_WINDOW) : [],
        memory: Array.isArray(parsed.recentKeys.memory) ? parsed.recentKeys.memory.slice(-HISTORY_WINDOW) : [],
        color: Array.isArray(parsed.recentKeys.color) ? parsed.recentKeys.color.slice(-HISTORY_WINDOW) : [],
        logic: Array.isArray((parsed.recentKeys as Record<string, unknown>).logic)
          ? ((parsed.recentKeys as Record<string, string[]>).logic ?? []).slice(-HISTORY_WINDOW)
          : [],
        compare: Array.isArray((parsed.recentKeys as Record<string, unknown>).compare)
          ? ((parsed.recentKeys as Record<string, string[]>).compare ?? []).slice(-HISTORY_WINDOW)
          : [],
        vocab: Array.isArray((parsed.recentKeys as Record<string, unknown>).vocab)
          ? ((parsed.recentKeys as Record<string, string[]>).vocab ?? []).slice(-HISTORY_WINDOW)
          : [],
      },
    };
    return normalizeContentBankState(candidate, now);
  } catch {
    return getDefaultContentBankState(now);
  }
}

export function saveContentBankState(state: ContentBankState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore private-mode and quota errors.
  }
}

export function getWeeklyThemeLabel(theme: WeeklyThemeKey, language: "vi" | "en"): string {
  const found = THEMES.find((item) => item.key === theme) ?? THEMES[0];
  return language === "vi" ? found.titleVi : found.titleEn;
}

export function getWeeklyThemeSymbols(theme: WeeklyThemeKey): string[] {
  const found = THEMES.find((item) => item.key === theme) ?? THEMES[0];
  return [...found.memorySymbols];
}

export function getAgeGameCopy(ageGroup: ContentAgeGroup, game: MiniGameKey, language: "vi" | "en"): AgeGameCopyLine {
  const profile = AGE_GAME_COPY[ageGroup] ?? AGE_GAME_COPY.age_7_8;
  const copy = profile[game] ?? profile.math;
  if (language === "vi") {
    return {
      description: copy.descriptionVi,
      focus: copy.focusVi,
    };
  }
  return {
    description: copy.descriptionEn,
    focus: copy.focusEn,
  };
}

function getAgeAdjustedSymbolPool(symbols: string[], ageGroup: ContentAgeGroup): string[] {
  if (ageGroup === "age_5_6") return symbols.slice(0, 6);
  if (ageGroup === "age_7_8") return symbols.slice(0, 8);
  return [...symbols];
}

function getAgeAdjustedMathRound(limit: number, ageGroup: ContentAgeGroup, adaptive: ContentAdaptiveTuning): MathQuestion {
  const adjustedLimit = Math.max(10, limit + (adaptive.mathLimitDelta ?? 0));
  const mode = adaptive.mathDeltaMode ?? "balanced";
  if (ageGroup === "age_5_6") {
    const deltas = mode === "hard"
      ? [-5, -4, -3, -2, 2, 3, 4, 5]
      : [-3, -2, -1, 1, 2, 3, 4];
    return generateMathQuestion(Math.min(adjustedLimit, 20), {
      operators: ["+"],
      operandMax: Math.min(adjustedLimit, 10),
      answerMax: 20,
      deltas,
    });
  }
  if (ageGroup === "age_7_8") {
    const deltas = mode === "easy"
      ? [-6, -4, -2, -1, 1, 2, 4, 6]
      : mode === "hard"
        ? [-10, -8, -6, -4, -2, 2, 4, 6, 8, 10]
        : [-8, -6, -4, -2, -1, 1, 2, 4, 6, 8];
    return generateMathQuestion(Math.min(adjustedLimit, 50), {
      operators: ["+", "-"],
      operandMax: Math.min(adjustedLimit, 25),
      answerMax: Math.min(60, adjustedLimit + 10),
      deltas,
    });
  }
  const deltas = mode === "easy"
    ? [-10, -8, -6, -4, -2, 2, 4, 6, 8, 10]
    : mode === "hard"
      ? [-16, -14, -12, -10, -8, -5, 5, 8, 10, 12, 14, 16]
      : [-14, -11, -8, -5, -3, -2, 2, 3, 5, 8, 11, 14];
  return generateMathQuestion(Math.min(adjustedLimit, 100), {
    operators: ["+", "-", "-"],
    operandMax: Math.min(adjustedLimit, 55),
    answerMax: Math.min(120, adjustedLimit + 25),
    deltas,
  });
}

function getAgeAdjustedMemoryRound(
  limit: number,
  ageGroup: ContentAgeGroup,
  symbols: string[],
  adaptive: ContentAdaptiveTuning,
): MemoryRound {
  const ageSymbolPool = getAgeAdjustedSymbolPool(symbols, ageGroup);
  const complexityDelta = adaptive.memoryComplexityDelta ?? 0;
  if (ageGroup === "age_5_6") {
    return generateMemoryRound(Math.min(limit, 25), {
      symbolPool: ageSymbolPool,
      complexityOverride: Math.max(4, 5 + complexityDelta),
      minAnswerCount: 3,
      maxAnswerCount: 4,
    });
  }
  if (ageGroup === "age_7_8") {
    return generateMemoryRound(Math.min(limit, 50), {
      symbolPool: ageSymbolPool,
      complexityOverride: Math.max(4, 6 + complexityDelta),
      minAnswerCount: 2,
      maxAnswerCount: 3,
    });
  }
  return generateMemoryRound(Math.min(limit, 100), {
    symbolPool: ageSymbolPool,
    complexityOverride: Math.max(4, 7 + complexityDelta),
    minAnswerCount: 2,
    maxAnswerCount: 3,
  });
}

function getAgeAdjustedColorRound(ageGroup: ContentAgeGroup, adaptive: ContentAdaptiveTuning): ColorRound {
  const profile = AGE_COLOR_PROFILE[ageGroup] ?? AGE_COLOR_PROFILE.age_7_8;
  return generateColorRound({
    matchChance: Math.max(0.02, Math.min(0.8, profile.matchChance + (adaptive.colorMatchDelta ?? 0))),
    palette: profile.palette,
    wordPool: profile.wordPool,
  });
}

function getAgeAdjustedLogicRound(limit: number, ageGroup: ContentAgeGroup, adaptive: ContentAdaptiveTuning): LogicRound {
  const complexityDelta = adaptive.memoryComplexityDelta ?? 0;
  if (ageGroup === "age_5_6") {
    return generateLogicRound(Math.min(limit, 25), {
      maxStep: Math.max(2, 3 + complexityDelta),
      allowMultiplyPattern: false,
    });
  }
  if (ageGroup === "age_7_8") {
    return generateLogicRound(Math.min(limit, 50), {
      maxStep: Math.max(2, 5 + complexityDelta),
      allowMultiplyPattern: false,
    });
  }
  return generateLogicRound(Math.min(limit, 100), {
    maxStep: Math.max(2, 7 + complexityDelta),
    allowMultiplyPattern: true,
  });
}

function getAgeAdjustedCompareRound(limit: number, ageGroup: ContentAgeGroup, adaptive: ContentAdaptiveTuning): CompareRound {
  const tunedLimit = Math.max(12, limit + (adaptive.mathLimitDelta ?? 0));
  if (ageGroup === "age_5_6") {
    return generateCompareRound(Math.min(tunedLimit, 20), { minValue: 1, maxValue: 20 });
  }
  if (ageGroup === "age_7_8") {
    return generateCompareRound(Math.min(tunedLimit, 60), { minValue: 5, maxValue: 60 });
  }
  return generateCompareRound(Math.min(tunedLimit, 120), { minValue: 10, maxValue: 120 });
}

function getAgeAdjustedVocabRound(ageGroup: ContentAgeGroup): VocabRound {
  return generateVocabRound({ ageGroup });
}

function pickRound<T>(
  game: MiniGameKey,
  state: ContentBankState,
  generator: () => T,
  makeKey: (round: T) => string,
): NextRoundResult<T> {
  const normalized = normalizeContentBankState(state);
  const recent = normalized.recentKeys[game];

  let fallbackRound: T | null = null;
  let fallbackKey: string | null = null;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const candidate = generator();
    const candidateKey = makeKey(candidate);
    if (!fallbackRound) {
      fallbackRound = candidate;
      fallbackKey = candidateKey;
    }
    if (!recent.includes(candidateKey)) {
      return {
        round: candidate,
        nextState: pushRecentKey(normalized, game, candidateKey),
        usedFallback: false,
      };
    }
  }

  const safeRound = fallbackRound ?? generator();
  const safeKey = fallbackKey ?? makeKey(safeRound);
  return {
    round: safeRound,
    nextState: pushRecentKey(normalized, game, safeKey),
    usedFallback: true,
  };
}

export function getNextMathRound(
  limit: number,
  state: ContentBankState,
  ageGroup: ContentAgeGroup = "age_7_8",
  adaptive: ContentAdaptiveTuning = {},
): NextRoundResult<MathQuestion> {
  return pickRound("math", state, () => getAgeAdjustedMathRound(limit, ageGroup, adaptive), getKeyForMathRound);
}

export function getNextMemoryRound(
  limit: number,
  state: ContentBankState,
  ageGroup: ContentAgeGroup = "age_7_8",
  adaptive: ContentAdaptiveTuning = {},
): NextRoundResult<MemoryRound> {
  const theme = THEMES.find((item) => item.key === state.theme) ?? THEMES[0];
  return pickRound(
    "memory",
    state,
    () => getAgeAdjustedMemoryRound(limit, ageGroup, theme.memorySymbols, adaptive),
    getKeyForMemoryRound,
  );
}

export function getNextColorRound(
  state: ContentBankState,
  ageGroup: ContentAgeGroup = "age_7_8",
  adaptive: ContentAdaptiveTuning = {},
): NextRoundResult<ColorRound> {
  return pickRound("color", state, () => getAgeAdjustedColorRound(ageGroup, adaptive), getKeyForColorRound);
}

export function getNextLogicRound(
  limit: number,
  state: ContentBankState,
  ageGroup: ContentAgeGroup = "age_7_8",
  adaptive: ContentAdaptiveTuning = {},
): NextRoundResult<LogicRound> {
  return pickRound("logic", state, () => getAgeAdjustedLogicRound(limit, ageGroup, adaptive), getKeyForLogicRound);
}

export function getNextCompareRound(
  limit: number,
  state: ContentBankState,
  ageGroup: ContentAgeGroup = "age_7_8",
  adaptive: ContentAdaptiveTuning = {},
): NextRoundResult<CompareRound> {
  return pickRound("compare", state, () => getAgeAdjustedCompareRound(limit, ageGroup, adaptive), getKeyForCompareRound);
}

export function getNextVocabRound(
  state: ContentBankState,
  ageGroup: ContentAgeGroup = "age_7_8",
): NextRoundResult<VocabRound> {
  return pickRound("vocab", state, () => getAgeAdjustedVocabRound(ageGroup), getKeyForVocabRound);
}
