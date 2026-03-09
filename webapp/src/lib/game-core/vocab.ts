import { VocabRound } from "@/lib/game-core/types";

type UiLanguage = "vi" | "en";
type ContentAgeGroup = "age_5_6" | "age_7_8" | "age_9_10";

interface VocabEntry {
  vi: string;
  en: string;
}

interface VocabGenerationOptions {
  ageGroup?: ContentAgeGroup;
  direction?: "vi_to_en" | "en_to_vi";
}

const AGE_VOCAB_LIBRARY: Record<ContentAgeGroup, VocabEntry[]> = {
  age_5_6: [
    { vi: "Meo", en: "Cat" },
    { vi: "Cho", en: "Dog" },
    { vi: "Tao", en: "Apple" },
    { vi: "Bong", en: "Ball" },
    { vi: "Sach", en: "Book" },
    { vi: "Nha", en: "House" },
    { vi: "Mau do", en: "Red" },
    { vi: "Mau xanh", en: "Blue" },
  ],
  age_7_8: [
    { vi: "Truong hoc", en: "School" },
    { vi: "Ban be", en: "Friends" },
    { vi: "Bi mat", en: "Secret" },
    { vi: "Tham tu", en: "Detective" },
    { vi: "Dong ho", en: "Clock" },
    { vi: "Cau do", en: "Puzzle" },
    { vi: "Vu tru", en: "Space" },
    { vi: "Hanh tinh", en: "Planet" },
    { vi: "Ky niem", en: "Memory" },
    { vi: "Mau sac", en: "Color" },
  ],
  age_9_10: [
    { vi: "Kham pha", en: "Explore" },
    { vi: "Chien luoc", en: "Strategy" },
    { vi: "Quan sat", en: "Observe" },
    { vi: "Doan ket", en: "Teamwork" },
    { vi: "Nhiem vu", en: "Mission" },
    { vi: "Toc do", en: "Speed" },
    { vi: "Do chinh xac", en: "Accuracy" },
    { vi: "Thu thach", en: "Challenge" },
    { vi: "Thich nghi", en: "Adapt" },
    { vi: "Tien bo", en: "Progress" },
  ],
};

function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let idx = arr.length - 1; idx > 0; idx -= 1) {
    const pick = Math.floor(Math.random() * (idx + 1));
    [arr[idx], arr[pick]] = [arr[pick], arr[idx]];
  }
  return arr;
}

function pickAgePool(ageGroup: ContentAgeGroup): VocabEntry[] {
  if (ageGroup === "age_5_6") {
    return [...AGE_VOCAB_LIBRARY.age_5_6];
  }
  if (ageGroup === "age_7_8") {
    return [...AGE_VOCAB_LIBRARY.age_5_6, ...AGE_VOCAB_LIBRARY.age_7_8];
  }
  return [...AGE_VOCAB_LIBRARY.age_5_6, ...AGE_VOCAB_LIBRARY.age_7_8, ...AGE_VOCAB_LIBRARY.age_9_10];
}

export function generateVocabRound(options: VocabGenerationOptions = {}): VocabRound {
  const ageGroup = options.ageGroup ?? "age_7_8";
  const pool = pickAgePool(ageGroup);
  const direction = options.direction ?? (Math.random() < 0.5 ? "vi_to_en" : "en_to_vi");
  const shuffled = shuffle(pool);
  const target = shuffled[0];

  const answer = direction === "vi_to_en" ? target.en : target.vi;
  const distractorField = direction === "vi_to_en" ? "en" : "vi";
  const distractors = shuffled
    .slice(1)
    .map((item) => item[distractorField])
    .filter((word) => word !== answer);

  const choices = new Set<string>([answer]);
  for (const candidate of distractors) {
    if (choices.size >= 4) break;
    choices.add(candidate);
  }
  while (choices.size < 4) {
    const fallback = pool[Math.floor(Math.random() * pool.length)];
    choices.add(direction === "vi_to_en" ? fallback.en : fallback.vi);
  }

  return {
    prompt: direction === "vi_to_en" ? target.vi : target.en,
    answer,
    choices: shuffle(Array.from(choices)).slice(0, 4),
    direction,
  };
}

export function getVocabHint(round: VocabRound, language: UiLanguage = "vi"): string {
  if (language === "en") {
    return `Hint: the matching word is "${round.answer}".`;
  }
  return `Goi y: tu dung la "${round.answer}".`;
}
