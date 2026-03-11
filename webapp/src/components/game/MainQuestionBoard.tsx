import React from "react";
import {
  getColorEnglishName,
  getColorMarker,
  MiniGameKey,
} from "@/lib/game-core";
import { UiLanguage } from "@/app/page";
import styles from "@/app/page.module.css";
import { FallingCatchGame } from "@/components/action-games/FallingCatchGame";

export interface MainQuestionBoardProps {
  activeGame: MiniGameKey;
  language: UiLanguage;
  pickLanguageText: (lang: UiLanguage, vi: string, en: string) => string;
  mathQuestion: any;
  memoryRound: any;
  logicRound: any;
  compareRound: any;
  vocabRound: any;
  colorRound: any;
  memoryRevealLeft: number;
  englishLearningLine: string;
  answerLocked: boolean;
  colorAssistEnabled: boolean;
  handleAnswer: (choice: string | number) => void;
}

export function MainQuestionBoard({
  activeGame,
  language,
  pickLanguageText,
  mathQuestion,
  memoryRound,
  logicRound,
  compareRound,
  vocabRound,
  colorRound,
  memoryRevealLeft,
  englishLearningLine,
  answerLocked,
  colorAssistEnabled,
  handleAnswer,
}: MainQuestionBoardProps) {
  const getColorChoiceDisplay = (choice: string) => {
    const marker = colorAssistEnabled ? ` ${getColorMarker(choice)}` : "";
    return language === "vi"
      ? `${choice} / ${getColorEnglishName(choice)}${marker}`
      : `${getColorEnglishName(choice)} / ${choice}${marker}`;
  };

  if (activeGame === "math") {
    return (
      <>
        <p className={styles.questionValue}>
          {mathQuestion.left} {mathQuestion.operator} {mathQuestion.right} = ?
        </p>
        <p className={styles.questionGloss}>{englishLearningLine}</p>
        <div className={styles.answers}>
          {mathQuestion.choices.map((choice: any) => (
            <button
              key={choice}
              type="button"
              className={styles.answerButton}
              onClick={() => handleAnswer(choice)}
              disabled={answerLocked}
            >
              {choice}
            </button>
          ))}
        </div>
      </>
    );
  }

  if (activeGame === "action_catch") {
    const questionText = `${mathQuestion.left} ${mathQuestion.operator} ${mathQuestion.right} = ?`;
    return (
      <>
        <p className={styles.hint}>
          {pickLanguageText(
            language,
            "Di chuyen gio de triet pha dap an dung!",
            "Move the basket to catch the right answer!"
          )}
        </p>
        <FallingCatchGame
          questionText={questionText}
          choices={mathQuestion.choices}
          correctAnswer={mathQuestion.answer}
          onAnswer={handleAnswer}
        />
        <p className={styles.questionGloss} style={{ textAlign: "center", marginTop: "1rem" }}>
          {englishLearningLine}
        </p>
      </>
    );
  }

  if (activeGame === "memory") {
    return (
      <>
        {memoryRevealLeft > 0 ? (
          <div className={styles.memorySequence}>{memoryRound.sequence.join(" ")}</div>
        ) : (
          <div className={styles.memoryCover}>
            {pickLanguageText(
              language,
              "Chuoi da an. Ky hieu nao xuat hien nhieu nhat?",
              "Sequence hidden. Which symbol appears the most?"
            )}
          </div>
        )}
        <p className={styles.questionGloss}>{englishLearningLine}</p>
        <div className={styles.answers}>
          {memoryRound.choices.map((choice: string) => (
            <button
              key={choice}
              type="button"
              className={styles.answerButton}
              onClick={() => handleAnswer(choice)}
              disabled={answerLocked}
            >
              {choice}
            </button>
          ))}
        </div>
      </>
    );
  }

  if (activeGame === "logic") {
    return (
      <>
        <p className={styles.hint}>
          {pickLanguageText(
            language,
            "Tim quy luat day so va chon so tiep theo.",
            "Find the sequence rule and choose the next number."
          )}
        </p>
        <p className={styles.questionValue}>{logicRound.sequence.join(" , ")} , ?</p>
        <p className={styles.questionGloss}>{englishLearningLine}</p>
        <div className={styles.answers}>
          {logicRound.choices.map((choice: number) => (
            <button
              key={choice}
              type="button"
              className={styles.answerButton}
              onClick={() => handleAnswer(choice)}
              disabled={answerLocked}
            >
              {choice}
            </button>
          ))}
        </div>
      </>
    );
  }

  if (activeGame === "compare") {
    return (
      <>
        <p className={styles.hint}>
          {pickLanguageText(
            language,
            "So nao lon hon? Chon dap an nhanh.",
            "Which number is larger? Choose quickly."
          )}
        </p>
        <p className={styles.questionValue}>
          {compareRound.left} ? {compareRound.right}
        </p>
        <p className={styles.questionGloss}>{englishLearningLine}</p>
        <div className={styles.answers}>
          {compareRound.choices.map((choice: number) => (
            <button
              key={choice}
              type="button"
              className={styles.answerButton}
              onClick={() => handleAnswer(choice)}
              disabled={answerLocked}
            >
              {choice}
            </button>
          ))}
        </div>
      </>
    );
  }

  if (activeGame === "vocab") {
    return (
      <>
        <p className={styles.hint}>
          {vocabRound.direction === "vi_to_en"
            ? pickLanguageText(
                language,
                `Tu tieng Anh cua "${vocabRound.prompt}" la gi?`,
                `What is the English word for "${vocabRound.prompt}"?`
              )
            : pickLanguageText(
                language,
                `Tu tieng Viet cua "${vocabRound.prompt}" la gi?`,
                `What is the Vietnamese word for "${vocabRound.prompt}"?`
              )}
        </p>
        <p className={styles.questionGloss}>{englishLearningLine}</p>
        <div className={styles.answers}>
          {vocabRound.choices.map((choice: string) => (
            <button
              key={choice}
              type="button"
              className={styles.answerButton}
              onClick={() => handleAnswer(choice)}
              disabled={answerLocked}
            >
              {choice}
            </button>
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      <p className={styles.hint}>
        {colorAssistEnabled
          ? pickLanguageText(
              language,
              "Chon MAU cua chu (co marker hinh dang), khong phai noi dung cua chu.",
              "Pick the COLOR of the text (with shape marker), not the word meaning."
            )
          : pickLanguageText(
              language,
              "Chon MAU cua chu, khong phai noi dung cua chu.",
              "Pick the COLOR of the text, not the word meaning."
            )}
      </p>
      <p className={styles.colorWord} style={{ color: colorRound.wordColorHex }}>
        {language === "vi" ? colorRound.word : getColorEnglishName(colorRound.word)}{" "}
        {colorAssistEnabled ? ` ${getColorMarker(colorRound.answerColorName)}` : ""}
      </p>
      <p className={styles.questionGloss}>{englishLearningLine}</p>
      <div className={styles.answers}>
        {colorRound.choices.map((choice: string) => (
          <button
            key={choice}
            type="button"
            className={styles.answerButton}
            onClick={() => handleAnswer(choice)}
            disabled={answerLocked}
          >
            {getColorChoiceDisplay(choice)}
          </button>
        ))}
      </div>
    </>
  );
}
