"use client";

import { useEffect, useRef } from "react";

interface PhaserPlaygroundProps {
  className?: string;
}

export function PhaserPlayground({ className }: PhaserPlaygroundProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let mounted = true;
    let game: { destroy: (removeCanvas: boolean, noReturn?: boolean) => void } | null = null;

    void (async () => {
      const host = hostRef.current;
      if (!host || !mounted) return;

      const Phaser = (await import("phaser")).default;
      let stars: { alpha: number; y: number }[] = [];
      const scene: Phaser.Types.Scenes.SettingsConfig & Phaser.Types.Scenes.CreateSceneFromObjectConfig = {
        key: "PlaygroundScene",
        create() {
          const { width, height } = this.scale;
          this.add.rectangle(width / 2, height / 2, width, height, 0xb8e8ff, 0.22);

          stars = [];
          for (let i = 0; i < 34; i += 1) {
            const circle = this.add.circle(
              Phaser.Math.Between(0, width),
              Phaser.Math.Between(0, height),
              Phaser.Math.Between(3, 8),
              Phaser.Display.Color.HexStringToColor("#ffffff").color,
              Phaser.Math.FloatBetween(0.35, 0.95),
            );
            stars.push(circle);
          }

          this.add
            .text(width / 2, 32, "Space Classroom", {
              fontFamily: "Baloo 2, sans-serif",
              fontSize: "26px",
              color: "#0f4a7a",
              stroke: "#ffffff",
              strokeThickness: 6,
            })
            .setOrigin(0.5, 0.5);
        },
        update(time: number) {
          const pulse = 0.5 + Math.sin(time / 900) * 0.25;
          stars.forEach((star, index) => {
            star.alpha = 0.5 + (index % 7) * 0.04 + pulse * 0.4;
            star.y += 0.07 + ((index % 6) + 1) * 0.05;
            if (star.y > this.scale.height + 20) {
              star.y = -20;
            }
          });
        },
      };

      game = new Phaser.Game({
        type: Phaser.AUTO,
        width: host.clientWidth,
        height: host.clientHeight,
        parent: host,
        transparent: true,
        backgroundColor: "rgba(0,0,0,0)",
        scene,
        scale: {
          mode: Phaser.Scale.RESIZE,
          autoCenter: Phaser.Scale.CENTER_BOTH,
        },
      });
    })();

    return () => {
      mounted = false;
      game?.destroy(true);
    };
  }, []);

  return <div className={className} ref={hostRef} aria-hidden />;
}
