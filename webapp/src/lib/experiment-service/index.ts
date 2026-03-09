export interface ExperimentAssignment {
  layoutVariant: "compact" | "guide_first";
  rewardPromptVariant: "standard" | "coach";
}

const STORAGE_KEY = "cvf-mini-exp-assignment-v1";

function randomPick<T>(values: T[]): T {
  return values[Math.floor(Math.random() * values.length)];
}

function isAssignmentLike(raw: unknown): raw is ExperimentAssignment {
  if (!raw || typeof raw !== "object") return false;
  const value = raw as Partial<ExperimentAssignment>;
  const layoutOk = value.layoutVariant === "compact" || value.layoutVariant === "guide_first";
  const rewardOk = value.rewardPromptVariant === "standard" || value.rewardPromptVariant === "coach";
  return layoutOk && rewardOk;
}

function createAssignment(): ExperimentAssignment {
  return {
    layoutVariant: randomPick(["compact", "guide_first"]),
    rewardPromptVariant: randomPick(["standard", "coach"]),
  };
}

export function getOrCreateExperimentAssignment(): ExperimentAssignment {
  if (typeof window === "undefined") {
    return {
      layoutVariant: "compact",
      rewardPromptVariant: "standard",
    };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as unknown;
      if (isAssignmentLike(parsed)) {
        return parsed;
      }
    }
    const next = createAssignment();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    return next;
  } catch {
    return {
      layoutVariant: "compact",
      rewardPromptVariant: "standard",
    };
  }
}
