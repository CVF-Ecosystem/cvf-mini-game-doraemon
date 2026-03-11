import { useCallback } from "react";
import {
  RewardState,
  openChest,
  equipAvatar,
  equipPet,
  equipTool,
  feedPet,
  buyShopItem,
  saveRewardState,
} from "@/lib/rewards-service";
import { trackEvent } from "@/lib/telemetry";
import { UiLanguage } from "@/app/page";

interface RewardInteractionsProps {
  setRewardState: React.Dispatch<React.SetStateAction<RewardState>>;
  todayMetricsDate: string;
  language: UiLanguage;
  playSfx: (sound: any) => void;
  setFeedback: React.Dispatch<React.SetStateAction<{ tone: "success" | "error" | "info"; text: string }>>;
  pickLanguageText: (lang: UiLanguage, vi: string, en: string) => string;
}

export function useRewardInteractions({
  setRewardState,
  todayMetricsDate,
  language,
  playSfx,
  setFeedback,
  pickLanguageText,
}: RewardInteractionsProps) {
  const onOpenChest = useCallback(() => {
    playSfx("chest");
    setRewardState((previous) => {
      const chest = openChest(previous);
      if (chest.opened) {
        saveRewardState(chest.nextState);
        void trackEvent("daily_chest_open", {
          date: todayMetricsDate,
          totalOpened: chest.nextState.chestOpenCount,
        });
        if (chest.unlockedSticker) {
          void trackEvent("sticker_unlock", {
            source: "daily_chest",
            sticker: chest.unlockedSticker,
            total: chest.nextState.stickers.length,
          });
        }
        setFeedback({
          tone: "success",
          text: chest.unlockedSticker
            ? pickLanguageText(
                language,
                `Chest mo thanh cong! Sticker moi: ${chest.unlockedSticker}.`,
                `Chest opened! New sticker: ${chest.unlockedSticker}.`,
              )
            : pickLanguageText(
                language,
                "Chest mo thanh cong. Bo suu tap da day.",
                "Chest opened. Sticker album is complete.",
              ),
        });
      }
      return chest.nextState;
    });
  }, [language, pickLanguageText, playSfx, setFeedback, setRewardState, todayMetricsDate]);

  const onEquipAvatar = useCallback(
    (val: string) => {
      setRewardState((prev) => {
        const next = equipAvatar(prev, val);
        saveRewardState(next);
        return next;
      });
    },
    [setRewardState],
  );

  const onEquipPet = useCallback(
    (val: string) => {
      setRewardState((prev) => {
        const next = equipPet(prev, val);
        saveRewardState(next);
        return next;
      });
    },
    [setRewardState],
  );

  const onEquipTool = useCallback(
    (val: string) => {
      setRewardState((prev) => {
        const next = equipTool(prev, val);
        saveRewardState(next);
        return next;
      });
    },
    [setRewardState],
  );

  const onFeedPet = useCallback(() => {
    setRewardState((prev) => {
      const res = feedPet(prev, 50, 20, 5); // 50 coins, +20 hunger, +5 happiness
      if (res.success) {
        saveRewardState(res.nextState);
        playSfx("coin");
      }
      return res.nextState;
    });
  }, [playSfx, setRewardState]);

  const onPlayWithPet = useCallback(() => {
    setRewardState((prev) => {
      const res = feedPet(prev, 20, -10, 15); // 20 coins, -10 hunger, +15 happiness
      if (res.success) {
        saveRewardState(res.nextState);
        playSfx("coin");
      }
      return res.nextState;
    });
  }, [playSfx, setRewardState]);

  const onBuyItem = useCallback((itemId: string, cost: number) => {
    setRewardState((prev) => {
      const next = buyShopItem(prev, itemId, cost);
      if (next !== prev) {
        saveRewardState(next);
        playSfx("success");
      }
      return next;
    });
  }, [playSfx, setRewardState]);

  return {
    onOpenChest,
    onEquipAvatar,
    onEquipPet,
    onEquipTool,
    onFeedPet,
    onPlayWithPet,
    onBuyItem,
  };
}
