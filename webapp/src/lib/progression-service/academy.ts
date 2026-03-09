export type AcademyZoneKey = "space_class" | "orbit_lab" | "nova_gate";
export type AcademyTelemetryEventName = "zone_enter" | "zone_unlock" | "node_complete";

export interface AcademyNodeState {
  id: string;
  labelVi: string;
  labelEn: string;
  requiredCorrect: number;
  correctCount: number;
  unlocked: boolean;
  completed: boolean;
}

export interface AcademyZoneState {
  key: AcademyZoneKey;
  titleVi: string;
  titleEn: string;
  unlocked: boolean;
  completed: boolean;
  nodes: AcademyNodeState[];
}

export interface AcademyProgressState {
  zones: AcademyZoneState[];
  activeZoneIndex: number;
  activeNodeIndex: number;
  totalRounds: number;
  bossStats: {
    wins: number;
    fails: number;
  };
}

export interface AcademyTelemetryEvent {
  event: AcademyTelemetryEventName;
  payload: Record<string, string | number | boolean>;
}

interface AcademyZoneBlueprint {
  key: AcademyZoneKey;
  titleVi: string;
  titleEn: string;
  nodeTargets: number[];
}

const ACADEMY_STORAGE_KEY = "cvf-mini-academy-progress-v1";
export const BOSS_ROUND_EVERY = 5;

const ACADEMY_BLUEPRINT: AcademyZoneBlueprint[] = [
  {
    key: "space_class",
    titleVi: "Space Class",
    titleEn: "Space Class",
    nodeTargets: [2, 2, 3],
  },
  {
    key: "orbit_lab",
    titleVi: "Orbit Lab",
    titleEn: "Orbit Lab",
    nodeTargets: [2, 3, 3],
  },
  {
    key: "nova_gate",
    titleVi: "Nova Gate",
    titleEn: "Nova Gate",
    nodeTargets: [3, 3, 4],
  },
];

function makeNodeId(zoneKey: AcademyZoneKey, idx: number): string {
  return `${zoneKey}_node_${idx + 1}`;
}

function getNodeLabelVi(idx: number): string {
  return `Nhiem vu ${idx + 1}`;
}

function getNodeLabelEn(idx: number): string {
  return `Mission ${idx + 1}`;
}

function cloneProgress(progress: AcademyProgressState): AcademyProgressState {
  return {
    ...progress,
    zones: progress.zones.map((zone) => ({
      ...zone,
      nodes: zone.nodes.map((node) => ({ ...node })),
    })),
  };
}

export function getDefaultAcademyProgress(): AcademyProgressState {
  const zones = ACADEMY_BLUEPRINT.map((zone, zoneIdx) => ({
    key: zone.key,
    titleVi: zone.titleVi,
    titleEn: zone.titleEn,
    unlocked: zoneIdx === 0,
    completed: false,
    nodes: zone.nodeTargets.map((target, nodeIdx) => ({
      id: makeNodeId(zone.key, nodeIdx),
      labelVi: getNodeLabelVi(nodeIdx),
      labelEn: getNodeLabelEn(nodeIdx),
      requiredCorrect: target,
      correctCount: 0,
      unlocked: zoneIdx === 0 && nodeIdx === 0,
      completed: false,
    })),
  }));

  return {
    zones,
    activeZoneIndex: 0,
    activeNodeIndex: 0,
    totalRounds: 0,
    bossStats: {
      wins: 0,
      fails: 0,
    },
  };
}

function isValidProgress(raw: unknown): raw is AcademyProgressState {
  if (!raw || typeof raw !== "object") return false;
  const candidate = raw as Partial<AcademyProgressState>;
  if (!Array.isArray(candidate.zones) || candidate.zones.length !== ACADEMY_BLUEPRINT.length) return false;
  if (typeof candidate.activeZoneIndex !== "number" || typeof candidate.activeNodeIndex !== "number") return false;
  if (typeof candidate.totalRounds !== "number") return false;
  return true;
}

export function loadAcademyProgress(): AcademyProgressState {
  if (typeof window === "undefined") return getDefaultAcademyProgress();
  try {
    const raw = window.localStorage.getItem(ACADEMY_STORAGE_KEY);
    if (!raw) return getDefaultAcademyProgress();
    const parsed = JSON.parse(raw) as unknown;
    if (!isValidProgress(parsed)) return getDefaultAcademyProgress();
    const candidate = parsed as AcademyProgressState;
    return {
      ...candidate,
      bossStats: {
        wins: Math.max(0, Math.round(candidate.bossStats?.wins ?? 0)),
        fails: Math.max(0, Math.round(candidate.bossStats?.fails ?? 0)),
      },
    };
  } catch {
    return getDefaultAcademyProgress();
  }
}

export function saveAcademyProgress(progress: AcademyProgressState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ACADEMY_STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Ignore local storage write errors.
  }
}

export function getRoundsUntilBoss(progress: AcademyProgressState, bossEvery: number = BOSS_ROUND_EVERY): number {
  const normalizedEvery = Math.max(1, bossEvery);
  const mod = progress.totalRounds % normalizedEvery;
  if (mod === 0) return normalizedEvery;
  return normalizedEvery - mod;
}

export function isBossRound(progress: AcademyProgressState, bossEvery: number = BOSS_ROUND_EVERY): boolean {
  return getRoundsUntilBoss(progress, bossEvery) === 1;
}

export function getBossRoundNumber(progress: AcademyProgressState, bossEvery: number = BOSS_ROUND_EVERY): number {
  const normalizedEvery = Math.max(1, bossEvery);
  return Math.floor(progress.totalRounds / normalizedEvery) + 1;
}

export function advanceAcademyProgress(
  current: AcademyProgressState,
  isCorrect: boolean,
): { next: AcademyProgressState; telemetry: AcademyTelemetryEvent[] } {
  const next = cloneProgress(current);
  const telemetry: AcademyTelemetryEvent[] = [];

  const zone = next.zones[next.activeZoneIndex];
  const node = zone.nodes[next.activeNodeIndex];
  const bossRoundActive = isBossRound(current);
  next.totalRounds += 1;
  if (bossRoundActive) {
    next.bossStats = {
      wins: next.bossStats.wins + (isCorrect ? 1 : 0),
      fails: next.bossStats.fails + (isCorrect ? 0 : 1),
    };
  }

  if (!zone.unlocked) {
    zone.unlocked = true;
  }
  if (!node.unlocked) {
    node.unlocked = true;
  }

  if (!isCorrect || node.completed) {
    return { next, telemetry };
  }

  node.correctCount = Math.min(node.requiredCorrect, node.correctCount + 1);
  if (node.correctCount < node.requiredCorrect) {
    return { next, telemetry };
  }

  node.completed = true;
  telemetry.push({
    event: "node_complete",
    payload: {
      zone: zone.key,
      node: node.id,
      totalRounds: next.totalRounds,
    },
  });

  const hasNextNode = next.activeNodeIndex < zone.nodes.length - 1;
  if (hasNextNode) {
    next.activeNodeIndex += 1;
    zone.nodes[next.activeNodeIndex].unlocked = true;
    zone.completed = zone.nodes.every((entry) => entry.completed);
    return { next, telemetry };
  }

  zone.completed = true;
  const hasNextZone = next.activeZoneIndex < next.zones.length - 1;
  if (!hasNextZone) {
    return { next, telemetry };
  }

  next.activeZoneIndex += 1;
  next.activeNodeIndex = 0;
  const unlockedZone = next.zones[next.activeZoneIndex];
  if (!unlockedZone.unlocked) {
    unlockedZone.unlocked = true;
    telemetry.push({
      event: "zone_unlock",
      payload: {
        zone: unlockedZone.key,
        totalRounds: next.totalRounds,
      },
    });
  }
  unlockedZone.nodes[0].unlocked = true;
  telemetry.push({
    event: "zone_enter",
    payload: {
      zone: unlockedZone.key,
      totalRounds: next.totalRounds,
    },
  });

  return { next, telemetry };
}
