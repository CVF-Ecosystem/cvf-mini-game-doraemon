import { useEffect } from "react";

export interface GameGlobalAudioEffectsProps {
  hydrated: boolean;
  playUiHoverTone: () => void;
  playUiClickTone: () => void;
}

export function useGameGlobalAudioEffects({
  hydrated,
  playUiHoverTone,
  playUiClickTone,
}: GameGlobalAudioEffectsProps) {
  useEffect(() => {
    if (!hydrated) return;
    const root = document.getElementById("cvf-game-root");
    if (!root) return;
    let hoverCooldownUntil = 0;

    const onMouseOver = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const button = target?.closest("button");
      if (!button || !root.contains(button)) return;

      const related = event.relatedTarget as Node | null;
      if (related && button.contains(related)) return;

      const now = window.performance.now();
      if (now < hoverCooldownUntil) return;
      hoverCooldownUntil = now + 70;
      playUiHoverTone();
    };

    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const button = target?.closest("button");
      if (!button || !root.contains(button)) return;
      playUiClickTone();
    };

    root.addEventListener("mouseover", onMouseOver);
    root.addEventListener("click", onClick);
    return () => {
      root.removeEventListener("mouseover", onMouseOver);
      root.removeEventListener("click", onClick);
    };
  }, [hydrated, playUiClickTone, playUiHoverTone]);
}
