import { useCallback, useEffect, useRef, useState } from "react";

export type SfxKey = "correct" | "wrong" | "chest" | "coin" | "boss_alert" | "button";
export type BgmKey = "main" | "boss";

export function useAudio() {
    const [isMuted, setIsMuted] = useState(() => {
        if (typeof window === "undefined") return false;
        try {
            return window.localStorage.getItem("cvf-muted") === "true";
        } catch {
            return false;
        }
    });
    const bgmRef = useRef<HTMLAudioElement | null>(null);
    const currentBgmKey = useRef<BgmKey | null>(null);

    // We lazily instantiate Audio elements to support SSR properly
    const sfxRefs = useRef<Record<string, HTMLAudioElement>>({});

    useEffect(() => {
        // Only run on client
        if (typeof window === "undefined") return;

        // Preload audio objects (ideally point to actual files in public/assets/)
        // Fallback: If no files exist, browser will safely fail or play nothing.
        bgmRef.current = new Audio("/assets/bgm_main.mp3");
        bgmRef.current.loop = true;
        bgmRef.current.volume = 0.4;

        sfxRefs.current = {
            correct: new Audio("/assets/sfx_correct.mp3"),
            wrong: new Audio("/assets/sfx_wrong.mp3"),
            chest: new Audio("/assets/sfx_chest.mp3"),
            coin: new Audio("/assets/sfx_coin.mp3"),
            boss_alert: new Audio("/assets/sfx_boss_alert.mp3"),
            button: new Audio("/assets/sfx_button.mp3"),
        };

        // Adjust SFX volumes
        Object.values(sfxRefs.current).forEach(audio => {
            audio.volume = 0.6;
        });

        return () => {
            // Cleanup
            if (bgmRef.current) {
                bgmRef.current.pause();
                bgmRef.current = null;
            }
        };
    }, []);

    const setMuted = useCallback((val: boolean | ((prev: boolean) => boolean)) => {
        setIsMuted(prev => {
            const next = typeof val === "function" ? val(prev) : val;
            if (next === prev) return next;
            try {
                window.localStorage.setItem("cvf-muted", String(next));
            } catch { }

            if (next && bgmRef.current) {
                bgmRef.current.pause();
            } else if (!next && bgmRef.current && currentBgmKey.current) {
                bgmRef.current.play().catch(() => { }); // Catch autoplay restrictions
            }
            return next;
        });
    }, []);

    const playSfx = useCallback((key: SfxKey, pitch: number = 1.0) => {
        if (isMuted) return;
        const audio = sfxRefs.current[key];
        if (audio) {
            audio.currentTime = 0;
            audio.playbackRate = pitch;
            audio.preservesPitch = false; // Required in some browsers to actually shift pitch instead of just tempo
            audio.play().catch(() => { });
        }
    }, [isMuted]);

    const setBgm = useCallback((key: BgmKey) => {
        if (currentBgmKey.current === key) return; // Already playing

        currentBgmKey.current = key;

        if (bgmRef.current) {
            bgmRef.current.pause();

            // Swap source based on key
            if (key === "boss") {
                bgmRef.current.src = "/assets/bgm_boss.mp3";
                bgmRef.current.volume = 0.6; // Slightly louder
            } else {
                bgmRef.current.src = "/assets/bgm_main.mp3";
                bgmRef.current.volume = 0.4;
            }

            if (!isMuted) {
                bgmRef.current.play().catch(() => { });
            }
        }
    }, [isMuted]);

    const dipBgmVolume = useCallback((dip: boolean) => {
        if (bgmRef.current) {
            // Dip volume when TTS is speaking
            bgmRef.current.volume = dip ? 0.1 : (currentBgmKey.current === "boss" ? 0.6 : 0.4);
        }
    }, []);

    return { isMuted, setMuted, playSfx, setBgm, dipBgmVolume };
}
