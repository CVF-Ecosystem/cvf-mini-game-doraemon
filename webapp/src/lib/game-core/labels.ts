import { AgeGroupKey, UiLanguage } from "@/app/page";
import { MiniGameKey, LevelKey } from "./types";

export interface AgeProfileConfig {
  key: AgeGroupKey;
  label: string;
  maxMathLimit: number;
  roundBonusSeconds: number;
  memoryRevealBonusSeconds: number;
}

export const AGE_PROFILES: Record<AgeGroupKey, AgeProfileConfig> = {
  age_5_6: {
    key: "age_5_6",
    label: "5-6 tuoi",
    maxMathLimit: 20,
    roundBonusSeconds: 8,
    memoryRevealBonusSeconds: 2,
  },
  age_7_8: {
    key: "age_7_8",
    label: "7-8 tuoi",
    maxMathLimit: 50,
    roundBonusSeconds: 3,
    memoryRevealBonusSeconds: 1,
  },
  age_9_10: {
    key: "age_9_10",
    label: "9-10 tuoi",
    maxMathLimit: 100,
    roundBonusSeconds: 0,
    memoryRevealBonusSeconds: 0,
  },
};

export const AGE_PROFILE_LABELS: Record<UiLanguage, Record<AgeGroupKey, string>> = {
  vi: {
    age_5_6: "5-6 tuoi",
    age_7_8: "7-8 tuoi",
    age_9_10: "9-10 tuoi",
  },
  en: {
    age_5_6: "5-6 years",
    age_7_8: "7-8 years",
    age_9_10: "9-10 years",
  },
};

export const MINI_GAME_LABELS: Record<UiLanguage, Record<MiniGameKey, { title: string; description: string }>> = {
  vi: {
    math: {
      title: "Toan Nhanh",
      description: "Tinh nhanh, chon dap an dung.",
    },
    memory: {
      title: "Nho Hinh",
      description: "Nho chuoi ky hieu roi chon ky hieu xuat hien nhieu nhat.",
    },
    color: {
      title: "Phan Xa Mau",
      description: "Bo qua noi dung chu, chon mau chu dang hien thi.",
    },
    logic: {
      title: "Logic Chuoi",
      description: "Tim quy luat day so va chon so tiep theo.",
    },
    compare: {
      title: "So Sanh So",
      description: "So sanh 2 so va chon so lon hon.",
    },
    vocab: {
      title: "Tu Vung Song Ngu",
      description: "Noi cap tu Viet-Anh dung nghia.",
    },
    action_catch: {
      title: "Hung Bong Dap An",
      description: "Di chuyen de hung bong co dap an dung.",
    },
  },
  en: {
    math: {
      title: "Math Sprint",
      description: "Solve quickly and pick the correct answer.",
    },
    memory: {
      title: "Memory Spark",
      description: "Memorize symbols and pick the one that appears most.",
    },
    color: {
      title: "Color Reflex",
      description: "Ignore word meaning, pick the displayed text color.",
    },
    logic: {
      title: "Logic Sequence",
      description: "Find number pattern rules and pick the next value.",
    },
    compare: {
      title: "Number Compare",
      description: "Compare two numbers and choose the larger one.",
    },
    vocab: {
      title: "Bilingual Vocab",
      description: "Match Vietnamese and English word pairs.",
    },
    action_catch: {
      title: "Action Catch",
      description: "Move the basket to catch the correct answer.",
    },
  },
};

export const LEVEL_LABELS: Record<UiLanguage, Record<LevelKey, { label: string; subtitle: string }>> = {
  vi: {
    rookie: { label: "Cua 1: Tap su", subtitle: "So nho den 20" },
    talent: { label: "Cua 2: Tai nang", subtitle: "So vua den 50" },
    master: { label: "Cua 3: Sieu tham tu", subtitle: "So lon den 100" },
  },
  en: {
    rookie: { label: "Gate 1: Rookie", subtitle: "Numbers up to 20" },
    talent: { label: "Gate 2: Talent", subtitle: "Numbers up to 50" },
    master: { label: "Gate 3: Super Detective", subtitle: "Numbers up to 100" },
  },
};
