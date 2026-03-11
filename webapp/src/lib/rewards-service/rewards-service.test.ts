import { describe, expect, it } from "vitest";
import {
  getDefaultRewardState,
  getSelfChallengeStatus,
  markSelfChallengeWin,
  openChest,
  earnBonusChest,
  syncStickersFromBadges,
} from "@/lib/rewards-service";

describe("rewards service", () => {
  it("opens chest only once per day using daily slot", () => {
    const initial = getDefaultRewardState();
    const first = openChest(initial, new Date("2026-02-27T09:00:00"));
    const second = openChest(first.nextState, new Date("2026-02-27T10:00:00"));

    expect(first.opened).toBe(true);
    expect(first.unlockedSticker).not.toBeNull();
    expect(second.opened).toBe(false);
  });

  it("consumes bonus slot if daily is exhausted", () => {
    const initial = getDefaultRewardState();
    const withBonus = earnBonusChest(initial);
    expect(withBonus.bonusOpens).toBe(1);

    const first = openChest(withBonus, new Date("2026-02-27T09:00:00")); // consumes daily
    expect(first.opened).toBe(true);
    expect(first.nextState.bonusOpens).toBe(1);

    const second = openChest(first.nextState, new Date("2026-02-27T10:00:00")); // consumes bonus
    expect(second.opened).toBe(true);
    expect(second.nextState.bonusOpens).toBe(0);

    const third = openChest(second.nextState, new Date("2026-02-27T11:00:00")); // fails
    expect(third.opened).toBe(false);
  });

  it("syncs stickers from unlocked badges", () => {
    const initial = getDefaultRewardState();
    const synced = syncStickersFromBadges(initial, ["Rocket", "Comet", "Star"]);
    expect(synced.nextState.stickers.length).toBe(3);
    expect(synced.unlocked.length).toBe(3);
  });

  it("evaluates self challenge and marks win date", () => {
    const initial = getDefaultRewardState();
    const status = getSelfChallengeStatus(
      initial,
      {
        date: "2026-02-27",
        rounds: 12,
        correct: 10,
        accuracy: 84,
        byGame: {
          math: { rounds: 4, correct: 3, wrong: 1 },
          memory: { rounds: 4, correct: 4, wrong: 0 },
          color: { rounds: 4, correct: 3, wrong: 1 },
          logic: { rounds: 0, correct: 0, wrong: 0 },
          compare: { rounds: 0, correct: 0, wrong: 0 },
          vocab: { rounds: 0, correct: 0, wrong: 0 },
          action_catch: { rounds: 0, correct: 0, wrong: 0 },
        },
      },
      {
        date: "2026-02-26",
        rounds: 8,
        correct: 7,
        accuracy: 78,
      },
    );

    expect(status.achieved).toBe(true);
    const won = markSelfChallengeWin(initial, "2026-02-27");
    expect(won.selfChallengeWinDate).toBe("2026-02-27");
  });
});
