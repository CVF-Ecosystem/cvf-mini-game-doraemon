import { ColorRound } from "@/lib/game-core/types";

type UiLanguage = "vi" | "en";

export interface ColorEntry {
  name: string;
  hex: string;
}

interface ColorGenerationOptions {
  matchChance?: number;
  palette?: ColorEntry[];
  wordPool?: string[];
}

export const COLOR_LIBRARY: ColorEntry[] = [
  { name: "Xanh Duong", hex: "#1fb6ff" },
  { name: "Vang", hex: "#ffb703" },
  { name: "Do", hex: "#ff4d4f" },
  { name: "Xanh La", hex: "#52c41a" },
  { name: "Cam", hex: "#ff8c42" },
  { name: "Hong", hex: "#ff66a3" },
  { name: "Tim", hex: "#8e6cff" },
  { name: "Nau", hex: "#8b5e3c" },
  { name: "Xanh Ngoc", hex: "#2ec4b6" },
];

function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const COLOR_ENGLISH_MAP: Record<string, string> = {
  "Xanh Duong": "Blue",
  Vang: "Yellow",
  Do: "Red",
  "Xanh La": "Green",
  Cam: "Orange",
  Hong: "Pink",
  Tim: "Purple",
  Nau: "Brown",
  "Xanh Ngoc": "Teal",
};

const COLOR_MARKER_MAP: Record<string, string> = {
  "Xanh Duong": "●",
  Vang: "■",
  Do: "▲",
  "Xanh La": "◆",
  Cam: "★",
  Hong: "♥",
  Tim: "⬢",
  Nau: "⬣",
  "Xanh Ngoc": "⬟",
};

export function generateColorRound(options: ColorGenerationOptions = {}): ColorRound {
  const rawPalette = Array.isArray(options.palette) ? options.palette : [];
  const safePalette = rawPalette.length >= 4 ? rawPalette : COLOR_LIBRARY;
  const entries = shuffle(safePalette);
  const answerColor = entries[0];
  const wordCandidates = Array.isArray(options.wordPool) && options.wordPool.length >= 2
    ? [...new Set(options.wordPool)]
    : safePalette.map((item) => item.name);
  const nonAnswerWords = wordCandidates.filter((item) => item !== answerColor.name);
  const fallbackWord = entries[1]?.name ?? answerColor.name;
  const randomWord = nonAnswerWords.length > 0
    ? nonAnswerWords[Math.floor(Math.random() * nonAnswerWords.length)]
    : fallbackWord;
  const safeMatchChance = Math.max(0, Math.min(1, options.matchChance ?? 0.2));
  const allowMatch = Math.random() < safeMatchChance;

  const word = allowMatch ? answerColor.name : randomWord;
  const choices = shuffle(entries.slice(0, 4).map((item) => item.name));
  if (!choices.includes(answerColor.name)) {
    choices[0] = answerColor.name;
  }

  return {
    word,
    wordColorHex: answerColor.hex,
    answerColorName: answerColor.name,
    choices: shuffle(choices),
  };
}

export function getColorHint(answerColorName: string, language: UiLanguage = "vi"): string {
  if (language === "en") {
    return `Hint: focus on the WORD COLOR, the answer is ${getColorEnglishName(answerColorName)}.`;
  }
  return `Goi y: Tap trung vao MAU CHU, dap an la ${answerColorName}.`;
}

export function getColorHexByName(colorName: string): string {
  const found = COLOR_LIBRARY.find((item) => item.name === colorName);
  return found?.hex ?? "#1fb6ff";
}

export function getColorEnglishName(colorName: string): string {
  return COLOR_ENGLISH_MAP[colorName] ?? colorName;
}

export function getColorMarker(colorName: string): string {
  return COLOR_MARKER_MAP[colorName] ?? "●";
}
