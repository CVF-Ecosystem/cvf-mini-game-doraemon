import { MiniGameKey } from "@/lib/game-core/types";

export interface RewardState {
  stickers: string[];
  chestLastOpenedDate: string | null;
  chestOpenCount: number;
  bonusOpens: number;
  coins: number;
  petHunger: number; // 0-100, where 100 means full
  petHappiness: number; // 0-100
  equippedAvatar: string | null;
  equippedPet: string | null;
  equippedTool: string | null;
  selfChallengeWinDate: string | null;
  inventory: string[]; // Store purchased item IDs from the Room Shop
  unlockedBosses: string[];
}

export interface TodayChallengeMetrics {
  date: string;
  rounds: number;
  correct: number;
  accuracy: number;
  byGame: Record<MiniGameKey, { rounds: number; correct: number; wrong: number }>;
}

export interface HistoricalChallengeMetrics {
  date: string;
  rounds: number;
  correct: number;
  accuracy: number;
}

export interface SelfChallengeStatus {
  target: {
    rounds: number;
    correct: number;
    accuracy: number;
  };
  progress: {
    rounds: number;
    correct: number;
    accuracy: number;
  };
  achieved: boolean;
  wonToday: boolean;
}

const STORAGE_KEY = "cvf-mini-rewards-v1";

const STICKER_POOL = [
  "Nova Ticket",
  "Orbit Key",
  "Starlight Lens",
  "Comet Pin",
  "Galaxy Shield",
  "Neon Trail",
  "Rocket Spark",
  "Nebula Badge",
  "Astro Patch",
  "Super Signal",
];

const AVATAR_POOL = ["Captain Kid", "Orbit Runner", "Nova Agent", "Galaxy Ace"];
const PET_POOL = ["Robo Pup", "Comet Fox", "Star Owl", "Nano Dragon"];
const TOOL_POOL = ["Lens Scanner", "Code Decoder", "Time Anchor", "Pattern Radar"];

export const BOSS_POOL = [
  { id: "boss_1", nameVi: "Quái Vật Sao Hỏa", nameEn: "Mars Monster" },
  { id: "boss_2", nameVi: "Thiết Giáp Không Gian", nameEn: "Astro Armadillo" },
  { id: "boss_3", nameVi: "Nhện Tinh Vân", nameEn: "Nebula Spider" },
  { id: "boss_4", nameVi: "Rồng Lỗ Đen", nameEn: "Blackhole Dragon" },
  { id: "boss_5", nameVi: "Mộc Tinh Golem", nameEn: "Jupiter Golem" },
  { id: "boss_6", nameVi: "Bạch Tuộc Ngân Hà", nameEn: "Galactic Octopus" },
  { id: "boss_7", nameVi: "Người Đá Mặt Trăng", nameEn: "Moon Rock" },
  { id: "boss_8", nameVi: "Tinh Linh Mộc Tinh", nameEn: "Jupiter Sprite" },
  { id: "boss_9", nameVi: "Ám Yêu Tinh", nameEn: "Dark Goblin" },
  { id: "boss_10", nameVi: "Lord Đại Thiên Hà", nameEn: "Galactic Lord" },
];

function getTodayKey(now: Date = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isStateLike(raw: unknown): raw is RewardState {
  if (!raw || typeof raw !== "object") return false;
  const item = raw as Partial<RewardState>;
  if (!Array.isArray(item.stickers)) return false;
  if (typeof item.chestOpenCount !== "number") return false;
  return true;
}

export function getDefaultRewardState(): RewardState {
  return {
    stickers: [],
    chestLastOpenedDate: null,
    chestOpenCount: 0,
    bonusOpens: 0,
    coins: 0,
    petHunger: 50,
    petHappiness: 50,
    equippedAvatar: null,
    equippedPet: null,
    equippedTool: null,
    selfChallengeWinDate: null,
    inventory: [],
    unlockedBosses: [],
  };
}

export function loadRewardState(): RewardState {
  if (typeof window === "undefined") return getDefaultRewardState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultRewardState();
    const parsed = JSON.parse(raw) as unknown;
    if (!isStateLike(parsed)) return getDefaultRewardState();
    const state = parsed as RewardState;
    return {
      stickers: Array.from(new Set(state.stickers)).slice(0, STICKER_POOL.length),
      chestLastOpenedDate: state.chestLastOpenedDate ?? null,
      chestOpenCount: Math.max(0, Math.round(state.chestOpenCount)),
      bonusOpens: typeof state.bonusOpens === "number" ? Math.max(0, Math.round(state.bonusOpens)) : 0,
      coins: typeof state.coins === "number" ? Math.max(0, Math.round(state.coins)) : 0,
      petHunger: typeof state.petHunger === "number" ? Math.max(0, Math.min(100, Math.round(state.petHunger))) : 50,
      petHappiness: typeof state.petHappiness === "number" ? Math.max(0, Math.min(100, Math.round(state.petHappiness))) : 50,
      equippedAvatar: state.equippedAvatar ?? null,
      equippedPet: state.equippedPet ?? null,
      equippedTool: state.equippedTool ?? null,
      selfChallengeWinDate: state.selfChallengeWinDate ?? null,
      inventory: Array.isArray(state.inventory) ? state.inventory : [],
      unlockedBosses: Array.isArray((state as any).unlockedBosses) ? (state as any).unlockedBosses : [],
    };
  } catch {
    return getDefaultRewardState();
  }
}

export function saveRewardState(state: RewardState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore write failures.
  }
}

function getUnlockCount(stickers: string[]): { avatars: number; pets: number; tools: number } {
  const count = stickers.length;
  return {
    avatars: Math.min(AVATAR_POOL.length, Math.max(1, Math.floor((count + 1) / 3))),
    pets: Math.min(PET_POOL.length, Math.max(1, Math.floor((count + 2) / 3))),
    tools: Math.min(TOOL_POOL.length, Math.max(1, Math.floor((count + 3) / 4))),
  };
}

export function getUnlockedAvatars(state: RewardState): string[] {
  const unlocked = getUnlockCount(state.stickers).avatars;
  return AVATAR_POOL.slice(0, unlocked);
}

export function getUnlockedPets(state: RewardState): string[] {
  const unlocked = getUnlockCount(state.stickers).pets;
  return PET_POOL.slice(0, unlocked);
}

export function getUnlockedTools(state: RewardState): string[] {
  const unlocked = getUnlockCount(state.stickers).tools;
  return TOOL_POOL.slice(0, unlocked);
}

function ensureEquipmentUnlocked(state: RewardState): RewardState {
  const unlockedAvatars = getUnlockedAvatars(state);
  const unlockedPets = getUnlockedPets(state);
  const unlockedTools = getUnlockedTools(state);
  const safeAvatar = unlockedAvatars.includes(state.equippedAvatar ?? "") ? state.equippedAvatar : unlockedAvatars[0] ?? null;
  const safePet = unlockedPets.includes(state.equippedPet ?? "") ? state.equippedPet : unlockedPets[0] ?? null;
  const safeTool = unlockedTools.includes(state.equippedTool ?? "") ? state.equippedTool : unlockedTools[0] ?? null;
  if (safeAvatar === state.equippedAvatar && safePet === state.equippedPet && safeTool === state.equippedTool) {
    return state;
  }
  return {
    ...state,
    equippedAvatar: safeAvatar,
    equippedPet: safePet,
    equippedTool: safeTool,
  };
}

export function equipAvatar(state: RewardState, avatar: string): RewardState {
  if (!getUnlockedAvatars(state).includes(avatar)) return state;
  return {
    ...state,
    equippedAvatar: avatar,
  };
}

export function equipPet(state: RewardState, pet: string): RewardState {
  if (!getUnlockedPets(state).includes(pet)) return state;
  return {
    ...state,
    equippedPet: pet,
  };
}

export function equipTool(state: RewardState, tool: string): RewardState {
  if (!getUnlockedTools(state).includes(tool)) return state;
  return {
    ...state,
    equippedTool: tool,
  };
}

export function syncStickersFromBadges(state: RewardState, badges: string[]): { nextState: RewardState; unlocked: string[] } {
  const normalizedBadges = badges.slice(0, STICKER_POOL.length);
  if (normalizedBadges.length === 0) {
    return {
      nextState: ensureEquipmentUnlocked(state),
      unlocked: [],
    };
  }

  const nextStickers = [...state.stickers];
  const unlocked: string[] = [];
  normalizedBadges.forEach((badge, idx) => {
    const stickerName = STICKER_POOL[idx] ?? badge;
    if (!nextStickers.includes(stickerName)) {
      nextStickers.push(stickerName);
      unlocked.push(stickerName);
    }
  });

  const next = ensureEquipmentUnlocked({
    ...state,
    stickers: nextStickers.slice(0, STICKER_POOL.length),
  });
  return {
    nextState: next,
    unlocked,
  };
}

export function earnCoins(state: RewardState, amount: number): RewardState {
  return {
    ...state,
    coins: state.coins + Math.max(0, amount),
  };
}

export function unlockBoss(state: RewardState, bossId: string): RewardState {
  if (state.unlockedBosses.includes(bossId)) {
    return state;
  }
  return {
    ...state,
    unlockedBosses: [...state.unlockedBosses, bossId],
  };
}

export function feedPet(state: RewardState, cost: number, nutrition: number, happinessBoost: number): { nextState: RewardState, success: boolean } {
  if (state.coins < cost) {
    return { nextState: state, success: false };
  }
  return {
    nextState: {
      ...state,
      coins: state.coins - cost,
      petHunger: Math.min(100, state.petHunger + nutrition),
      petHappiness: Math.min(100, state.petHappiness + happinessBoost),
    },
    success: true,
  };
}

export function earnBonusChest(state: RewardState): RewardState {
  return {
    ...state,
    bonusOpens: state.bonusOpens + 1,
  };
}

export function openChest(state: RewardState, now: Date = new Date()): {
  nextState: RewardState;
  opened: boolean;
  unlockedSticker: string | null;
} {
  const today = getTodayKey(now);
  const isDailyAvailable = state.chestLastOpenedDate !== today;
  const hasBonus = state.bonusOpens > 0;

  if (!isDailyAvailable && !hasBonus) {
    return {
      nextState: state,
      opened: false,
      unlockedSticker: null,
    };
  }

  const candidates = STICKER_POOL.filter((item) => !state.stickers.includes(item));
  const unlockedSticker = candidates[0] ?? null;
  const nextStickers = unlockedSticker ? [...state.stickers, unlockedSticker] : [...state.stickers];

  let nextChestDate = state.chestLastOpenedDate;
  let nextBonusOpens = state.bonusOpens;

  // Consume daily free chest first, otherwise use a bonus open
  if (isDailyAvailable) {
    nextChestDate = today;
  } else {
    nextBonusOpens = Math.max(0, state.bonusOpens - 1);
  }

  const next = ensureEquipmentUnlocked({
    ...state,
    chestLastOpenedDate: nextChestDate,
    bonusOpens: nextBonusOpens,
    chestOpenCount: state.chestOpenCount + 1,
    stickers: nextStickers.slice(0, STICKER_POOL.length),
  });

  return {
    nextState: next,
    opened: true,
    unlockedSticker,
  };
}

export function getSelfChallengeStatus(
  state: RewardState,
  today: TodayChallengeMetrics,
  previous: HistoricalChallengeMetrics | null,
): SelfChallengeStatus {
  const baseTarget = {
    rounds: Math.max(6, previous ? previous.rounds + 1 : 8),
    correct: Math.max(5, previous ? previous.correct + 1 : 7),
    accuracy: Math.max(65, previous ? Math.min(98, previous.accuracy + 2) : 72),
  };

  const progress = {
    rounds: today.rounds,
    correct: today.correct,
    accuracy: today.accuracy,
  };

  const achieved =
    progress.rounds >= baseTarget.rounds &&
    progress.correct >= baseTarget.correct &&
    progress.accuracy >= baseTarget.accuracy;

  return {
    target: baseTarget,
    progress,
    achieved,
    wonToday: state.selfChallengeWinDate === today.date,
  };
}

export function markSelfChallengeWin(state: RewardState, date: string): RewardState {
  if (state.selfChallengeWinDate === date) return state;
  return {
    ...state,
    selfChallengeWinDate: date,
  };
}

export function buyShopItem(state: RewardState, itemId: string, cost: number): RewardState {
  if (state.coins < cost) return state;
  if (state.inventory.includes(itemId)) return state;

  return {
    ...state,
    coins: state.coins - cost,
    inventory: [...state.inventory, itemId],
  };
}
