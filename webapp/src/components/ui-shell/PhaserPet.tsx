import React, { useEffect, useRef } from "react";

export interface PhaserPetProps {
    petName: string;
    width?: number;
    height?: number;
    // We can dispatch events 'pet-feed-event', 'pet-play-event', 'pet-sad-event', 'pet-happy-event' globally
    // or trigger them via props if we prefer not to use global windows events, 
    // but the current VirtualPetRoom is using window.addEventListener. Let's keep that but add new ones.
}

export function PhaserPet({ petName, width = 150, height = 150 }: PhaserPetProps) {
    const phaserContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        let mounted = true;
        let game: Phaser.Game | null = null;
        let currentScene: Phaser.Scene | null = null;

        const initPhaser = async () => {
            if (!phaserContainerRef.current || !mounted) return;

            const Phaser = (await import("phaser")).default;

            const config: Phaser.Types.Core.GameConfig = {
                type: Phaser.AUTO,
                parent: phaserContainerRef.current,
                width,
                height,
                scale: {
                    mode: Phaser.Scale.NONE,
                    width,
                    height,
                },
                transparent: true,
                scene: {
                    preload(this: Phaser.Scene) {
                        currentScene = this;
                        const graphics = this.make.graphics({});
                        
                        // Base colors depending on pet
                        let bodyColor = 0xffd700; // Default gold (egg)
                        if (petName === "Robo Pup") bodyColor = 0x74b9ff; // Blue
                        if (petName === "Comet Fox") bodyColor = 0xff7675; // Orange/Red
                        if (petName === "Star Owl") bodyColor = 0xa29bfe; // Purple
                        if (petName === "Nano Dragon") bodyColor = 0x55efc4; // Green
                        
                        // Draw body
                        graphics.fillStyle(bodyColor, 1);
                        graphics.fillCircle(width / 2, height / 2, width / 3);
                        
                        // Add some simple eyes
                        graphics.fillStyle(0x000000, 1);
                        const eyeOffsetX = width * 0.1;
                        const eyeOffsetY = height * 0.05;
                        const eyeRadius = width * 0.05;

                        if (petName === "Robo Pup") {
                             // Square eyes for bot
                            graphics.fillRect((width/2) - eyeOffsetX - (eyeRadius), (height/2) - eyeOffsetY, eyeRadius * 2, eyeRadius * 1.5);
                            graphics.fillRect((width/2) + eyeOffsetX - (eyeRadius/2), (height/2) - eyeOffsetY, eyeRadius * 2, eyeRadius * 1.5);
                        } else {
                            // Round eyes
                            graphics.fillCircle((width/2) - eyeOffsetX, (height/2) - eyeOffsetY, eyeRadius);
                            graphics.fillCircle((width/2) + eyeOffsetX, (height/2) - eyeOffsetY, eyeRadius);
                            
                            // Simple beak/mouth
                            graphics.fillStyle(0xffa502, 1);
                            graphics.fillTriangle(width/2, (height/2) + (eyeOffsetY * 1.5), (width/2) - eyeOffsetX, (height/2) + eyeOffsetY, (width/2) + eyeOffsetX, (height/2) + eyeOffsetY);
                        }
                        
                        graphics.generateTexture('pet-base-dyn', width, height);

                        // Tear drop texture (sad)
                        const tearGraphics = this.make.graphics({});
                        tearGraphics.fillStyle(0x74b9ff, 0.8);
                        tearGraphics.fillCircle(4, 8, 4);
                        tearGraphics.fillTriangle(4, 0, 0, 8, 8, 8);
                        tearGraphics.generateTexture('pet-tear', 8, 12);
                    },
                    create(this: Phaser.Scene) {
                        const petSprite = this.add.sprite(width/2, height/2, 'pet-base-dyn');
                        
                        // Add breathing animation
                        this.tweens.add({
                            targets: petSprite,
                            scaleY: 1.05,
                            scaleX: 0.98,
                            duration: 1200,
                            yoyo: true,
                            repeat: -1,
                            ease: 'Sine.easeInOut'
                        });

                        // Event listener for feeding
                        const handleFeedEvent = () => {
                            if (!currentScene?.sys?.game?.isBooted) return;
                            
                            const graphics = this.make.graphics({});
                            graphics.fillStyle(0xff6b81, 1);
                            graphics.fillCircle(8, 8, 8);
                            graphics.generateTexture('heart-dyn', 16, 16);

                            const emitter = this.add.particles(width/2, height/2, 'heart-dyn', {
                                speed: { min: 50, max: 150 },
                                angle: { min: 220, max: 320 },
                                scale: { start: 1, end: 0 },
                                lifespan: 1000,
                                quantity: 5,
                                emitting: false
                            });
                            
                            emitter.explode(10);
                            
                            this.tweens.add({
                                targets: petSprite,
                                y: (height/2) - 20,
                                duration: 200,
                                yoyo: true,
                                repeat: 2,
                                ease: 'Power1'
                            });
                        };

                        // Event listener for playing/happy
                        const handlePlayEvent = () => {
                            if (!currentScene?.sys?.game?.isBooted) return;
                            
                            const graphics = this.make.graphics({});
                            graphics.fillStyle(0xffeaa7, 1);
                            graphics.fillCircle(5, 5, 5);
                            graphics.generateTexture('play-star-dyn', 10, 10);

                            const emitter = this.add.particles(width/2, height/2, 'play-star-dyn', {
                                speed: { min: 100, max: 200 },
                                angle: { min: 0, max: 360 },
                                scale: { start: 1.5, end: 0 },
                                lifespan: 800,
                                quantity: 15,
                                emitting: false
                            });
                            
                            emitter.explode(20);
                            
                            this.tweens.add({
                                targets: petSprite,
                                angle: 360,
                                duration: 500,
                                ease: 'Cubic.easeOut'
                            });
                        };

                        // Event listener for sad/wrong
                        const handleSadEvent = () => {
                            if (!currentScene?.sys?.game?.isBooted) return;

                            // Shake horizontally
                            this.tweens.add({
                                targets: petSprite,
                                x: { value: (width/2) + 5, duration: 50, yoyo: true, repeat: 3 },
                                ease: 'Power1'
                            });

                            // Tears falling
                            const emitter = this.add.particles(width/2 - 15, height/2 - 5, 'pet-tear', {
                                speedY: { min: 50, max: 100 },
                                speedX: { min: -20, max: 20 },
                                scale: { start: 1, end: 0 },
                                lifespan: 800,
                                quantity: 3,
                                emitting: false
                            });
                            
                            emitter.explode(5);
                        };

                        window.addEventListener('pet-feed-event', handleFeedEvent);
                        window.addEventListener('pet-play-event', handlePlayEvent);
                        window.addEventListener('pet-sad-event', handleSadEvent);
                        window.addEventListener('pet-happy-event', handlePlayEvent);

                        this.events.on('destroy', () => {
                            window.removeEventListener('pet-feed-event', handleFeedEvent);
                            window.removeEventListener('pet-play-event', handlePlayEvent);
                            window.removeEventListener('pet-sad-event', handleSadEvent);
                            window.removeEventListener('pet-happy-event', handlePlayEvent);
                        });
                    }
                }
            };

            game = new Phaser.Game(config);
        };

        void initPhaser();

        return () => {
            mounted = false;
            game?.destroy(true);
        };
    }, [petName, width, height]);

    return <div ref={phaserContainerRef} style={{ width: `${width}px`, height: `${height}px`, margin: '0 auto' }} />;
}
