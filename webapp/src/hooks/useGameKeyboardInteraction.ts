import { useEffect, useMemo } from "react";
import { 
  MiniGameKey, 
  MathQuestion, 
  MemoryRound, 
  LogicRound, 
  CompareRound, 
  VocabRound, 
  ColorRound 
} from "@/lib/game-core";
import { UiLanguage } from "@/app/page";

export interface GameKeyboardInteractionProps {
  activeView: string;
  activeGame: MiniGameKey;
  language: UiLanguage;
  mathQuestion: MathQuestion;
  memoryRound: MemoryRound;
  logicRound: LogicRound;
  compareRound: CompareRound;
  vocabRound: VocabRound;
  colorRound: ColorRound;
  startNewRunSession: () => void;
  setFeedback: (fb: any) => void;
  pickLanguageText: (lang: UiLanguage, vi: string, en: string) => string;
  handleAnswer: (choice: string | number) => void;
}

export function useGameKeyboardInteraction({
  activeView,
  activeGame,
  language,
  mathQuestion,
  memoryRound,
  logicRound,
  compareRound,
  vocabRound,
  colorRound,
  startNewRunSession,
  setFeedback,
  pickLanguageText,
  handleAnswer,
}: GameKeyboardInteractionProps) {
  const currentChoices = (() => {
    if (activeGame === "math") return mathQuestion.choices;
    if (activeGame === "memory") return memoryRound.choices;
    if (activeGame === "logic") return logicRound.choices;
    if (activeGame === "compare") return compareRound.choices;
    if (activeGame === "vocab") return vocabRound.choices;
    return colorRound.choices;
  })();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (activeView !== "play") return;
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea") {
        return;
      }

      if (event.key === "r" || event.key === "R") {
        event.preventDefault();
        startNewRunSession();
        setFeedback({
          tone: "info",
          text: pickLanguageText(language, "Bắt đầu lượt mới 15 câu (shortcut R).", "Started a new 15-question run (shortcut R)."),
        });
        return;
      }

      const idx = Number(event.key) - 1;
      if (idx >= 0 && idx < 4 && currentChoices[idx] !== undefined) {
        event.preventDefault();
        handleAnswer(currentChoices[idx]);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeView, currentChoices, handleAnswer, language, pickLanguageText, setFeedback, startNewRunSession]);
}
