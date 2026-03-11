import { ParentModeSettings } from "@/lib/progress-service";
import styles from "@/app/page.module.css";
import { ParentAnalyticsChart } from "./ParentAnalyticsChart";

type UiLanguage = "vi" | "en";

interface ParentReport {
  rounds: number;
  correct: number;
  wrong: number;
  accuracy: number;
  weeklyRounds?: number;
  weeklyAccuracy?: number;
  weeklyTrend?: "up" | "down" | "flat";
  weakSpot?: string;
  suggestion?: string;
  skillScores?: Record<string, number>;
  offlineActivity?: string;
  teacherSummary?: string;
}

interface ParentModePanelProps {
  settings: ParentModeSettings;
  remainingMinutes: number | null;
  report: ParentReport;
  language: UiLanguage;
  locked: boolean;
  parentMessage: string | null;
  onUnlock: (pin: string) => void;
  onSetPin: (pin: string) => void;
  onLock: () => void;
  onResetAll: () => void;
  onToggle: (enabled: boolean) => void;
  onLimitChange: (minutes: number) => void;
  onSessionLimitChange: (minutes: number) => void;
}

export function ParentModePanel({
  settings,
  remainingMinutes,
  report,
  language,
  locked,
  parentMessage,
  onUnlock,
  onSetPin,
  onLock,
  onResetAll,
  onToggle,
  onLimitChange,
  onSessionLimitChange,
}: ParentModePanelProps) {
  const hasPin = Boolean(settings.pinCode);
  const copy =
    language === "vi"
      ? {
        title: "Parent Mode",
        enableLimit: "Bật giới hạn",
        lock: "Khóa lại",
        unlockLabel: "Nhập PIN phụ huynh để mở khóa cài đặt:",
        pinPlaceholder: "PIN",
        unlock: "Mở khóa",
        unlocked: "Khu vực phụ huynh đang mở khóa.",
        changePin: "Đổi PIN phụ huynh:",
        setPin: "Đặt PIN phụ huynh:",
        newPin: "PIN mới",
        newPinHint: "PIN mới (4-6 số)",
        savePin: "Lưu PIN",
        dailyLimit: "Giới hạn chơi mỗi ngày:",
        sessionLimit: "Giới hạn mỗi phiên:",
        minutes: "phút",
        remaining: "Còn lại hôm nay:",
        freePlay: "Parent mode đang tắt. Trẻ có thể chơi tự do.",
        rounds: "Vòng chơi hôm nay",
        correct: "Đúng",
        wrong: "Sai",
        accuracy: "Độ chính xác",
        weeklySummary: "Báo cáo 7 ngày",
        trend: "Xu hướng",
        weakSpot: "Điểm cần hỗ trợ",
        suggestion: "Gợi ý",
        skillProfile: "Hồ sơ kỹ năng",
        offlineActivity: "Hoạt động offline",
        teacherSummary: "Teacher summary",
        resetAll: "Reset toàn bộ dữ liệu chơi",
      }
      : {
        title: "Parent Mode",
        enableLimit: "Enable limit",
        lock: "Lock",
        unlockLabel: "Enter parent PIN to unlock settings:",
        pinPlaceholder: "PIN",
        unlock: "Unlock",
        unlocked: "Parent area is unlocked.",
        changePin: "Change parent PIN:",
        setPin: "Set parent PIN:",
        newPin: "New PIN",
        newPinHint: "New PIN (4-6 digits)",
        savePin: "Save PIN",
        dailyLimit: "Daily play limit:",
        sessionLimit: "Per-session limit:",
        minutes: "min",
        remaining: "Remaining today:",
        freePlay: "Parent mode is off. Child can play freely.",
        rounds: "Today's rounds",
        correct: "Correct",
        wrong: "Wrong",
        accuracy: "Accuracy",
        weeklySummary: "7-day summary",
        trend: "Trend",
        weakSpot: "Needs support",
        suggestion: "Suggestion",
        skillProfile: "Skill profile",
        offlineActivity: "Offline activity",
        teacherSummary: "Teacher summary",
        resetAll: "Reset all game data",
      };

  return (
    <section className={styles.parentPanel}>
      <div className={styles.parentHeader}>
        <h2>{copy.title}</h2>
        <div className={styles.parentActions}>
          <label className={styles.switch}>
            <input
              type="checkbox"
              checked={settings.enabled}
              onChange={(event) => onToggle(event.target.checked)}
              disabled={locked}
            />
            <span>{copy.enableLimit}</span>
          </label>
          {!locked && hasPin ? (
            <button type="button" className={styles.parentActionButton} onClick={onLock}>
              {copy.lock}
            </button>
          ) : null}
        </div>
      </div>

      <div className={styles.parentLockCard}>
        {locked ? (
          <>
            <label htmlFor="parent-unlock-pin">{copy.unlockLabel}</label>
            <div className={styles.parentPinRow}>
              <input
                id="parent-unlock-pin"
                type="password"
                inputMode="numeric"
                maxLength={6}
                placeholder={copy.pinPlaceholder}
                className={styles.parentPinInput}
              />
              <button
                type="button"
                className={styles.parentActionButton}
                onClick={() => {
                  const el = document.getElementById("parent-unlock-pin") as HTMLInputElement | null;
                  onUnlock(el?.value ?? "");
                  if (el) el.value = "";
                }}
              >
                {copy.unlock}
              </button>
            </div>
          </>
        ) : (
          <p className={styles.parentUnlockedText}>{copy.unlocked}</p>
        )}
      </div>

      <div className={styles.parentLockCard}>
        <label htmlFor="parent-set-pin">{hasPin ? copy.changePin : copy.setPin}</label>
        <div className={styles.parentPinRow}>
          <input
            id="parent-set-pin"
            type="password"
            inputMode="numeric"
            maxLength={6}
            placeholder={hasPin ? copy.newPin : copy.newPinHint}
            className={styles.parentPinInput}
            disabled={locked && hasPin}
          />
          <button
            type="button"
            className={styles.parentActionButton}
            disabled={locked && hasPin}
            onClick={() => {
              const el = document.getElementById("parent-set-pin") as HTMLInputElement | null;
              onSetPin(el?.value ?? "");
              if (el) el.value = "";
            }}
          >
            {copy.savePin}
          </button>
        </div>
      </div>

      <div className={styles.limitLine}>
        <label htmlFor="daily-limit">
          {copy.dailyLimit} {settings.dailyLimitMinutes} {copy.minutes}
        </label>
        <input
          id="daily-limit"
          type="range"
          min={5}
          max={120}
          step={5}
          value={settings.dailyLimitMinutes}
          onChange={(event) => onLimitChange(Number(event.target.value))}
          disabled={!settings.enabled || locked}
        />
        <label htmlFor="session-limit">
          {copy.sessionLimit} {settings.sessionLimitMinutes} {copy.minutes}
        </label>
        <input
          id="session-limit"
          type="range"
          min={5}
          max={90}
          step={5}
          value={settings.sessionLimitMinutes}
          onChange={(event) => onSessionLimitChange(Number(event.target.value))}
          disabled={!settings.enabled || locked}
        />
      </div>

      <p className={styles.parentRemaining}>
        {settings.enabled
          ? `${copy.remaining} ${remainingMinutes ?? 0} ${copy.minutes}`
          : copy.freePlay}
      </p>

      <div className={styles.parentReport}>
        <p>
          {copy.rounds}: <strong>{report.rounds}</strong>
        </p>
        <p>
          {copy.correct}: <strong>{report.correct}</strong> | {copy.wrong}: <strong>{report.wrong}</strong>
        </p>
        <p>
          {copy.accuracy}: <strong>{report.accuracy}%</strong>
        </p>
        <p>
          {copy.weeklySummary}: <strong>{report.weeklyRounds ?? 0}</strong> rounds | <strong>{report.weeklyAccuracy ?? 0}%</strong>
        </p>
        <p>
          {copy.trend}: <strong>{report.weeklyTrend ?? "flat"}</strong> | {copy.weakSpot}: <strong>{report.weakSpot ?? "-"}</strong>
        </p>
        {report.suggestion ? (
          <p>
            {copy.suggestion}: <strong>{report.suggestion}</strong>
          </p>
        ) : null}
        {report.skillScores ? (
          <ParentAnalyticsChart
            skillScores={report.skillScores}
            language={language}
            pickLanguageText={(lang: "vi" | "en", vi: string, en: string) => lang === "vi" ? vi : en}
          />
        ) : null}
        {report.offlineActivity ? (
          <p>
            {copy.offlineActivity}: <strong>{report.offlineActivity}</strong>
          </p>
        ) : null}
        {report.teacherSummary ? (
          <p>
            {copy.teacherSummary}: <strong>{report.teacherSummary}</strong>
          </p>
        ) : null}
      </div>

      <button type="button" className={styles.parentDangerButton} disabled={locked} onClick={onResetAll}>
        {copy.resetAll}
      </button>

      {parentMessage ? <p className={styles.parentMessage}>{parentMessage}</p> : null}
    </section>
  );
}
