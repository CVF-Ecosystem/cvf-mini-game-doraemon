export type LevelKey = "rookie" | "talent" | "master";
export type MathOperator = "+" | "-";
export type MiniGameKey = "math" | "memory" | "color" | "logic" | "compare" | "vocab";

export interface LevelConfig {
  key: LevelKey;
  label: string;
  subtitle: string;
  limit: number;
  roundSeconds: number;
  baseScore: number;
  accent: string;
}

export interface MathQuestion {
  left: number;
  right: number;
  operator: MathOperator;
  answer: number;
  choices: number[];
}

export interface FeedbackMessage {
  tone: "success" | "error" | "info";
  text: string;
}

export interface MemoryRound {
  sequence: string[];
  choices: string[];
  answer: string;
  revealSeconds: number;
}

export interface ColorRound {
  word: string;
  wordColorHex: string;
  answerColorName: string;
  choices: string[];
}

export interface LogicRound {
  sequence: number[];
  answer: number;
  choices: number[];
}

export interface CompareRound {
  left: number;
  right: number;
  answer: number;
  choices: number[];
}

export interface VocabRound {
  prompt: string;
  answer: string;
  choices: string[];
  direction: "vi_to_en" | "en_to_vi";
}

export interface MiniGameDefinition {
  key: MiniGameKey;
  title: string;
  description: string;
}

export const LEVEL_ORDER: LevelKey[] = ["rookie", "talent", "master"];

export const LEVELS: Record<LevelKey, LevelConfig> = {
  rookie: {
    key: "rookie",
    label: "Cua 1: Tap su",
    subtitle: "So nho den 20",
    limit: 20,
    roundSeconds: 30,
    baseScore: 10,
    accent: "#1fb6ff",
  },
  talent: {
    key: "talent",
    label: "Cua 2: Tai nang",
    subtitle: "So vua den 50",
    limit: 50,
    roundSeconds: 26,
    baseScore: 12,
    accent: "#ffb703",
  },
  master: {
    key: "master",
    label: "Cua 3: Sieu tham tu",
    subtitle: "So lon den 100",
    limit: 100,
    roundSeconds: 22,
    baseScore: 14,
    accent: "#ff7a59",
  },
};

export const BADGE_POOL = [
  "Rocket",
  "Comet",
  "Star",
  "Flash",
  "Turbo",
  "Nova",
  "Radar",
  "Shield",
];

export const MINI_GAMES: MiniGameDefinition[] = [
  {
    key: "math",
    title: "Toan Nhanh",
    description: "Tinh nhanh, chon dap an dung.",
  },
  {
    key: "memory",
    title: "Nho Hinh",
    description: "Nho chuoi ky hieu roi chon ky hieu xuat hien nhieu nhat.",
  },
  {
    key: "color",
    title: "Phan Xa Mau",
    description: "Bo qua noi dung chu, chon mau chu dang hien thi.",
  },
  {
    key: "logic",
    title: "Logic Chuoi",
    description: "Tim quy luat day so va chon dap an tiep theo.",
  },
  {
    key: "compare",
    title: "So Sanh So",
    description: "So sanh 2 so va chon so lon hon.",
  },
  {
    key: "vocab",
    title: "Tu Vung Song Ngu",
    description: "Noi tu tieng Viet va tieng Anh dung nghia.",
  },
];
