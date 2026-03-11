"use client";

import React, { useEffect, useRef } from 'react';
import type { Game } from 'phaser';

export interface FallingCatchGameProps {
    questionText: string;
    choices: (number | string)[];
    correctAnswer: number | string;
    onAnswer: (choice: number | string) => void;
}

export function FallingCatchGame({ questionText, choices, correctAnswer, onAnswer }: FallingCatchGameProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const gameRef = useRef<Game | null>(null);

    useEffect(() => {
        if (typeof window === 'undefined' || !containerRef.current) return;

        let onAnswerCalled = false;

        const initPhaser = async () => {
            const Phaser = (await import('phaser')).default;

            const config: Phaser.Types.Core.GameConfig = {
                type: Phaser.AUTO,
                parent: containerRef.current!,
                width: 600,
                height: 400,
                transparent: true,
                physics: {
                    default: 'arcade',
                    arcade: {
                        gravity: { x: 0, y: 150 },
                        debug: false
                    }
                },
                scene: {
                    preload(this: Phaser.Scene) {
                        // Generate simple graphics for the basket and falling objects
                        const basketGfx = this.make.graphics({ x: 0, y: 0 });
                        basketGfx.fillStyle(0x3498db, 1);
                        basketGfx.fillRoundedRect(0, 0, 80, 30, 8);
                        basketGfx.generateTexture('basket', 80, 30);

                        const itemGfx = this.make.graphics({ x: 0, y: 0 });
                        itemGfx.fillStyle(0xf1c40f, 1);
                        itemGfx.fillCircle(25, 25, 25);
                        itemGfx.lineStyle(4, 0xd4ac0d, 1);
                        itemGfx.strokeCircle(25, 25, 25);
                        itemGfx.generateTexture('falling-item', 50, 50);
                    },
                    create(this: Phaser.Scene & { 
                        player?: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
                        items?: Phaser.Physics.Arcade.Group;
                        cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
                    }) {
                        const width = this.scale.width;
                        const height = this.scale.height;

                        // Display Question
                        this.add.text(width / 2, 40, questionText, {
                            fontFamily: "Baloo 2, Balsamiq Sans, sans-serif",
                            fontSize: "36px",
                            color: "#ffffff",
                            stroke: "#000000",
                            strokeThickness: 4,
                            fontStyle: "bold"
                        }).setOrigin(0.5);

                        // Setup Player Basket
                        this.player = this.physics.add.sprite(width / 2, height - 40, 'basket');
                        this.player.setCollideWorldBounds(true);
                        this.player.setImmovable(true);
                        (this.player.body as Phaser.Physics.Arcade.Body).allowGravity = false;

                        // Setup Input
                        if (this.input.keyboard) {
                            this.cursors = this.input.keyboard.createCursorKeys();
                        }

                        // Allow Pointer/Touch drag
                        this.player.setInteractive({ draggable: true });
                        this.input.setDraggable(this.player);
                        this.input.on('drag', (pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.Sprite, dragX: number) => {
                            // Keep basket within bounds
                            const halfWidth = gameObject.width / 2;
                            if (dragX > halfWidth && dragX < width - halfWidth) {
                                gameObject.x = dragX;
                            }
                        });

                        // Setup Falling Items
                        this.items = this.physics.add.group();

                        // Create an item for each choice
                        const padding = width / (choices.length + 1);
                        choices.forEach((choice, index) => {
                            const xPos = padding * (index + 1);
                            
                            // Delay dropping to make it feel staggered
                            this.time.delayedCall(index * 500, () => {
                                if (!onAnswerCalled) {
                                  const item = this.items!.create(xPos, -50, 'falling-item') as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
                                  item.setBounce(0.4);
                                  item.setCollideWorldBounds(true);
                                  
                                  // Add text to item
                                  const text = this.add.text(0, 0, choice.toString(), {
                                      fontFamily: "sans-serif",
                                      fontSize: "20px",
                                      color: "#000",
                                      fontStyle: "bold"
                                  }).setOrigin(0.5);
                                  
                                  // Container to hold sprite + text
                                  const container = this.add.container(xPos, -50, [item, text]);
                                  this.physics.world.enable(container);
                                  const body = container.body as Phaser.Physics.Arcade.Body;
                                  body.setCircle(25, -25, -25);
                                  body.bounce.set(0.4);
                                  body.collideWorldBounds = true;
                                  
                                  // We will track the actual value on the container
                                  (container as any).choiceValue = choice;
  
                                  this.items!.add(container);
                                  
                                  // Destroy the standalone item since we put it in container 
                                  // Wait, Phaser groups handle GameObjects not just Sprites.
                                  // Let's refactor the container into the physics group properly.
                                  item.destroy(); 
                                  
                                  const newItemSprite = this.add.sprite(0, 0, 'falling-item');
                                  container.add(newItemSprite);
                                  container.sendToBack(newItemSprite);
                                }
                            });
                        });

                        // Collision Detection
                        this.physics.add.overlap(this.player, this.items, (basket, itemContainer) => {
                            if (onAnswerCalled) return;
                            onAnswerCalled = true;
                            
                            const choice = (itemContainer as any).choiceValue;
                            
                            this.tweens.add({
                                targets: itemContainer,
                                scale: 0,
                                duration: 200,
                                ease: 'Back.easeIn',
                                onComplete: () => {
                                    itemContainer.destroy();
                                    onAnswer(choice);
                                }
                            });
                        });
                    },
                    update(this: Phaser.Scene & { 
                        player?: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
                        cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
                    }) {
                        if (!this.player || !this.cursors) return;

                        const speed = 400;
                        if (this.cursors.left.isDown) {
                            this.player.setVelocityX(-speed);
                        } else if (this.cursors.right.isDown) {
                            this.player.setVelocityX(speed);
                        } else {
                            this.player.setVelocityX(0);
                        }
                    }
                }
            };

            if (!gameRef.current) {
                gameRef.current = new Phaser.Game(config);
            }
        };

        void initPhaser();

        return () => {
            if (gameRef.current) {
                gameRef.current.destroy(true);
                gameRef.current = null;
            }
        };
    }, [questionText, choices, correctAnswer, onAnswer]);

    return (
        <div style={{ position: 'relative', width: '100%', maxWidth: '600px', margin: '0 auto' }}>
            {/* The background environment wrapper */}
            <div style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                background: 'linear-gradient(to bottom, #74b9ff, #0984e3)',
                borderRadius: '16px',
                border: '4px solid #fff',
                boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                zIndex: -1
            }} />
            
            <div 
                ref={containerRef} 
                style={{ 
                    width: '100%', 
                    aspectRatio: '3/2',
                    borderRadius: '12px',
                    overflow: 'hidden'
                }} 
            />

            <div style={{ textAlign: 'center', marginTop: '1rem', color: '#555', fontSize: '0.9rem' }}>
                👈 Dùng phím mũi tên hoặc kéo / vuốt giỏ để bắt đáp án đúng 👉
            </div>
        </div>
    );
}
