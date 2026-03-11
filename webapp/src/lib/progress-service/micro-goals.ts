import { PlayerProgress } from "./storage";

export type MicroGoalType = "combo" | "accuracy" | "speed";

export interface MicroGoal {
    id: string;
    type: MicroGoalType;
    targetValue: number;
    currentValue: number;
    rewardCoins: number;
    descriptionVi: string;
    descriptionEn: string;
    isCompleted: boolean;
    expiresAtMs: number;
}

export function generateRandomMicroGoal(progress: PlayerProgress): MicroGoal {
    const types: MicroGoalType[] = ["combo", "accuracy", "speed"];
    const type = types[Math.floor(Math.random() * types.length)];
    const now = Date.now();
    // Goals expire in 2-5 minutes
    const expiresAtMs = now + (Math.floor(Math.random() * 3) + 2) * 60 * 1000;
    
    // Scale difficulty slightly with player score or level 
    // For simplicity, just use base values
    if (type === "combo") {
        const target = Math.floor(Math.random() * 3) + 3; // 3 to 5 combo
        return {
            id: `goal_combo_${now}`,
            type,
            targetValue: target,
            currentValue: 0,
            rewardCoins: target * 5,
            descriptionVi: `Đạt Combo x${target}`,
            descriptionEn: `Reach Combo x${target}`,
            isCompleted: false,
            expiresAtMs
        };
    }

    if (type === "accuracy") {
        const target = 5; // 5 correct in a row without wrong
        return {
            id: `goal_acc_${now}`,
            type,
            targetValue: target,
            currentValue: 0,
            rewardCoins: 25,
            descriptionVi: `Trả lời đúng ${target} câu liên tiếp`,
            descriptionEn: `Answer ${target} correct in a row`,
            isCompleted: false,
            expiresAtMs
        };
    }

    // Speed: answer a question under 3 seconds
    return {
        id: `goal_speed_${now}`,
        type,
        targetValue: 3000, // 3000 ms = 3 seconds
        currentValue: 0, 
        rewardCoins: 15,
        descriptionVi: `Trả lời 1 câu dưới 3 giây`,
        descriptionEn: `Answer 1 question under 3s`,
        isCompleted: false,
        expiresAtMs
    };
}

export type MicroGoalEvent = 
    | { type: "combo"; value: number }
    | { type: "accuracy_streak"; value: number }
    | { type: "speed_answer"; responseMs: number }
    | { type: "wrong_answer" };

export function processMicroGoalEvent(
    progress: PlayerProgress,
    event: MicroGoalEvent
): PlayerProgress {
    let activeGoal = progress.activeMicroGoal;
    
    // Automatically clear completed or expired goals, and optionally generate new ones
    const now = Date.now();
    if (activeGoal) {
        if (activeGoal.isCompleted || now > activeGoal.expiresAtMs) {
            activeGoal = null; // Expired or already done, clear it up so engine can generate a new one
        }
    }

    if (!activeGoal) {
        // Only 20% chance to generate a micro-goal if none is active, to not be constantly annoying
        if (Math.random() < 0.2) {
            activeGoal = generateRandomMicroGoal(progress);
        } else {
            return { ...progress, activeMicroGoal: null };
        }
    }

    // Process event against active goal
    let updatedGoal = { ...activeGoal };
    
    switch (activeGoal.type) {
        case "combo":
            if (event.type === "combo") {
                updatedGoal.currentValue = Math.max(updatedGoal.currentValue, event.value);
            } else if (event.type === "wrong_answer") {
                // Combo broken, reset or keep max? Combo goal usually just wants 'Reach Combo X'.
                // If they break combo, value goes back to 0, though we might not strictly need to drop it if it's "reach". Let's say it resets.
                updatedGoal.currentValue = 0; 
            }
            break;
            
        case "accuracy":
            if (event.type === "accuracy_streak") {
                updatedGoal.currentValue = event.value;
            } else if (event.type === "wrong_answer") {
                updatedGoal.currentValue = 0; // Streak broken
            }
            break;

        case "speed":
            if (event.type === "speed_answer") {
                if (event.responseMs <= updatedGoal.targetValue) {
                    updatedGoal.currentValue = event.responseMs;
                    updatedGoal.isCompleted = true; // One-shot completion
                }
            }
            break;
    }

    // Check completion for combo & accuracy
    if (updatedGoal.type !== "speed" && updatedGoal.currentValue >= updatedGoal.targetValue) {
        updatedGoal.isCompleted = true;
    }

    return {
        ...progress,
        activeMicroGoal: updatedGoal
    };
}

