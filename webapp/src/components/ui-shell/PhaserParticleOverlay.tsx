import React, { useEffect, useRef } from 'react';
import type { Game } from 'phaser';

/**
 * A lightweight overlay component that uses Phaser to emit particles.
 */
export function PhaserParticleOverlay() {
    const containerRef = useRef<HTMLDivElement>(null);
    const gameRef = useRef<Game | null>(null);

    useEffect(() => {
        // Only load phaser on the client side
        let Phaser: any;

        const initPhaser = async () => {
            if (!containerRef.current) return;

            try {
                // Dynamically import Phaser to avoid SSR issues
                Phaser = await import('phaser');
            } catch (e) {
                console.warn('Could not load Phaser, particle effects disabled', e);
                return;
            }

            const config: Phaser.Types.Core.GameConfig = {
                type: Phaser.AUTO,
                parent: containerRef.current,
                transparent: true,
                width: '100%',
                height: '100%',
                physics: {
                    default: 'arcade',
                    arcade: { gravity: { y: 200, x: 0 } }
                },
                scene: {
                    preload: function (this: unknown) {
                        const graphics = (this as Phaser.Scene).make.graphics({ x: 0, y: 0 });
                        graphics.fillStyle(0xffffff, 1);
                        graphics.fillCircle(4, 4, 4);
                        graphics.generateTexture('particle-star', 8, 8);
                    },
                    create: function (this: unknown) {
                        const sceneThis = this as Phaser.Scene;
                        // Listen for global custom events to trigger bursts
                        const handleBurst = (e: Event) => {
                            const customEvent = e as CustomEvent<{ x: number, y: number, color?: number }>;
                            const { x, y, color } = customEvent.detail || { x: sceneThis.scale.width / 2, y: sceneThis.scale.height / 2, color: 0xffd700 };

                            if (!sceneThis.sys.game.isBooted) return;

                            const emitter = sceneThis.add.particles(x, y, 'particle-star', {
                                speed: { min: 100, max: 300 },
                                angle: { min: 0, max: 360 },
                                scale: { start: 1, end: 0 },
                                lifespan: 1000,
                                gravityY: 300,
                                tint: [color ?? 0xffffff, 0xffffff, color ?? 0xffffff], // Gold/white colors
                                blendMode: 'ADD',
                                quantity: 30, // Number of particles per burst
                                emitting: true
                            });

                            // Auto destroy the emitter after burst is done
                            emitter.stop();
                            sceneThis.time.delayedCall(1200, () => {
                                emitter.destroy();
                            });
                        };

                        const handleConfetti = () => {
                            if (!sceneThis.sys.game.isBooted) return;

                            const width = sceneThis.scale.width;
                            const height = sceneThis.scale.height;

                            for (let i = 0; i < 3; i++) {
                                const x = Phaser.Math.Between(width * 0.2, width * 0.8);
                                const y = Phaser.Math.Between(height * 0.2, height * 0.5);
                                const color = Phaser.Utils.Array.GetRandom([0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff]);

                                sceneThis.time.delayedCall(i * 200, () => {
                                    const emitter = sceneThis.add.particles(x, y, 'particle-star', {
                                        speed: { min: 150, max: 400 },
                                        angle: { min: 180, max: 360 },
                                        scale: { start: 1.5, end: 0 },
                                        lifespan: 1500,
                                        gravityY: 500,
                                        tint: color,
                                        quantity: 50,
                                        emitting: true
                                    });
                                    emitter.stop();
                                    sceneThis.time.delayedCall(1600, () => emitter.destroy());
                                });
                            }
                        };

                        window.addEventListener('phaser-particle-burst', handleBurst);
                        window.addEventListener('phaser-confetti-burst', handleConfetti);

                        sceneThis.events.on('destroy', () => {
                            window.removeEventListener('phaser-particle-burst', handleBurst);
                            window.removeEventListener('phaser-confetti-burst', handleConfetti);
                        });
                    }
                }
            };

            if (!gameRef.current) {
                gameRef.current = new Phaser.Game(config);
            }
        };

        void initPhaser();

        return () => {
            // Cleanup
            if (gameRef.current) {
                gameRef.current.destroy(true);
                gameRef.current = null;
            }
        };
    }, []);

    return (
        <div
            ref={containerRef}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                pointerEvents: 'none', // Ensure it doesn't block clicks
                zIndex: 9999, // Render on top of everything
            }}
            aria-hidden="true"
        />
    );
}

// Helper utility to trigger bursts from elsewhere in the app
export const triggerParticleBurst = (x: number, y: number, color: number = 0xffd700) => {
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('phaser-particle-burst', { detail: { x, y, color } }));
    }
};

export const triggerConfettiBurst = () => {
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('phaser-confetti-burst'));
    }
};
