import fs from 'fs';
import path from 'path';

const pageFile = path.resolve('d:/UNG DUNG AI/TOOL AI 2026/CVF-Workspace/Mini_Game/webapp/src/app/page.tsx');
let content = fs.readFileSync(pageFile, 'utf8');

// 1. Add imports at the top
const importsToAdd = `
import { DashboardPlayView } from "@/components/ui-shell/DashboardPlayView";
import { DashboardProgressView } from "@/components/ui-shell/DashboardProgressView";
import { DashboardSettingsView } from "@/components/ui-shell/DashboardSettingsView";
`.trim();

// Insert right after the last import (or after 'import ' statements)
content = content.replace(/(import .*;\n)(?!import )/, `$1${importsToAdd}\n`);

// 2. Replace the massive rendering logic between hero/playgroundPreviewCard and mobileLayout playgroundPreviewCard
const startMarker = '\\{activeView === "progress" \\? \\(\\s+<section className=\\{styles\\.mapStrip\\}';
const endMarker = '\\) : null\\}\\s+\\{\\s*isMobileLayout \\? playgroundPreviewCard : null\\s*\\}';

const regex = new RegExp(`${startMarker}[\\s\\S]*?${endMarker}`);

const newRenderCode = `{activeView === "play" && (
          <DashboardPlayView
            language={language}
            pickLanguageText={pickLanguageText}
            activeGame={activeGame}
            setActiveGame={setActiveGame}
            miniGameLabels={miniGameLabels}
            getRoundConfig={getRoundConfig}
            levelKey={levelKey}
            level={level}
            ageGroup={ageGroup}
            setWrongStreak={setWrongStreak}
            beginRound={beginRound}
            setFeedback={setFeedback}
            levelLabels={levelLabels}
            highestUnlockedLevel={highestUnlockedLevel}
            isLevelUnlocked={isLevelUnlocked}
            setLevelKey={setLevelKey}
            progress={progress}
            timeLeft={timeLeft}
            timeRatio={timeRatio}
            roundDurationSeconds={roundDurationSeconds}
            runStats={runStats}
            runProgressRatio={runProgressRatio}
            runAccuracy={runAccuracy}
            showCelebration={showCelebration}
            celebrationSeed={celebrationSeed}
            gameTitle={gameTitle}
            currentBossRoundMeta={currentBossRoundMeta}
            memoryRevealLeft={memoryRevealLeft}
            activeAgeGameCopy={activeAgeGameCopy}
            learningSuggestion={learningSuggestion}
            ttsEnabled={ttsEnabled}
            soundMuted={soundMuted}
            ttsSupported={ttsSupported}
            speakCurrentPrompt={speakCurrentPrompt}
            sessionRemainingMs={sessionRemainingMs}
            playable={playable}
            startNewRunSession={startNewRunSession}
            feedback={feedback}
            feedbackClass={feedbackClass}
            renderMainQuestion={renderMainQuestion}
          />
        )}

        {activeView === "progress" && (
          <DashboardProgressView
            language={language}
            pickLanguageText={pickLanguageText}
            academyProgress={academyProgress}
            activeZone={activeZone}
            activeNode={activeNode}
            getZoneTitle={getZoneTitle}
            currentBossRoundMeta={currentBossRoundMeta}
            weeklyThemeLabel={weeklyThemeLabel}
            roundsUntilBoss={roundsUntilBoss}
            questProgress={questProgress}
            dailyStatsRounds={progress.dailyStats.rounds}
            comboStatus={comboStatus}
            roundDurationSeconds={roundDurationSeconds}
            timeRatio={timeRatio}
            coachTip={coachTip}
            streak={progress.streak}
            rewardState={rewardState}
            todayMetricsDate={todayMetrics.date}
            rewardPromptVariant={experimentAssignment.rewardPromptVariant}
            onOpenChest={() => {
              setRewardState((previous) => {
                const chest = openDailyChest(previous);
                if (chest.opened) {
                  saveRewardState(chest.nextState);
                  void trackEvent("daily_chest_open", {
                    date: todayMetrics.date,
                    totalOpened: chest.nextState.chestOpenCount,
                  });
                  if (chest.unlockedSticker) {
                    void trackEvent("sticker_unlock", {
                      source: "daily_chest",
                      sticker: chest.unlockedSticker,
                      total: chest.nextState.stickers.length,
                    });
                  }
                  setFeedback({
                    tone: "success",
                    text: chest.unlockedSticker
                      ? pickLanguageText(
                          language,
                          \`Chest mo thanh cong! Sticker moi: \${chest.unlockedSticker}.\`,
                          \`Chest opened! New sticker: \${chest.unlockedSticker}.\`,
                        )
                      : pickLanguageText(language, "Chest mo thanh cong. Bo suu tap da day.", "Chest opened. Sticker album is complete."),
                  });
                }
                return chest.nextState;
              });
            }}
            onEquipAvatar={(val) => {
              setRewardState((prev) => {
                const next = equipAvatar(prev, val);
                saveRewardState(next);
                return next;
              });
            }}
            onEquipPet={(val) => {
              setRewardState((prev) => {
                const next = equipPet(prev, val);
                saveRewardState(next);
                return next;
              });
            }}
            onEquipTool={(val) => {
              setRewardState((prev) => {
                const next = equipTool(prev, val);
                saveRewardState(next);
                return next;
              });
            }}
            unlockedAvatars={unlockedAvatars}
            unlockedPets={unlockedPets}
            unlockedTools={unlockedTools}
            selfChallengeStatus={selfChallengeStatus}
            badges={progress.badges}
          />
        )}

        {activeView === "parent" && (
          <section className={styles.parentTabWrap}>
            <ParentModePanel
            settings={progress.parentMode}
            remainingMinutes={remainingMinutes}
            report={parentReport}
            language={language}
            locked={parentLocked}
            parentMessage={parentMessage}
            onUnlock={(pin) => {
              if (verifyParentPin(progress, pin)) {
                setParentUnlocked(true);
                setParentMessage(pickLanguageText(language, "Da mo khoa khu vuc phu huynh.", "Parent area unlocked."));
                void trackEvent("parent_unlock", { success: true });
              } else {
                setParentMessage(pickLanguageText(language, "PIN khong dung. Vui long thu lai.", "Incorrect PIN. Please try again."));
                void trackEvent("parent_unlock", { success: false });
              }
            }}
            onSetPin={(pin) => {
              const normalized = pin.trim();
              const isValid = /^[0-9]{4,6}$/.test(normalized);
              if (!isValid) {
                setParentMessage(pickLanguageText(language, "PIN can 4-6 chu so.", "PIN must have 4-6 digits."));
                return;
              }
              setParentPin(normalized);
              setParentUnlocked(false);
              setParentMessage(pickLanguageText(language, "Da luu PIN va khoa lai khu vuc phu huynh.", "PIN saved and parent area locked again."));
              void trackEvent("parent_pin_update", { length: normalized.length });
            }}
            onLock={() => {
              setParentUnlocked(false);
              setParentMessage(pickLanguageText(language, "Da khoa khu vuc phu huynh.", "Parent area locked."));
            }}
            onResetAll={() => {
              resetAllProgress();
              const freshAcademy = getDefaultAcademyProgress();
              const freshContentBank = getDefaultContentBankState();
              const freshReward = getDefaultRewardState();
              const freshReport = getDefaultReportHistoryState();
              setAcademyProgress(freshAcademy);
              setContentBankState(freshContentBank);
              setRewardState(freshReward);
              setReportHistory(freshReport);
              saveAcademyProgress(freshAcademy);
              saveContentBankState(freshContentBank);
              saveRewardState(freshReward);
              saveReportHistoryState(freshReport);
              sessionStartedAtRef.current = Date.now();
              setParentUnlocked(false);
              setParentMessage(pickLanguageText(language, "Da reset toan bo du lieu choi.", "All game data has been reset."));
              setWrongStreak(0);
              beginRound(activeGame, activeRoundConfig, "reset_all");
            }}
            onToggle={(enabled) => {
              if (parentLocked) {
                setParentMessage(pickLanguageText(language, "Can mo khoa Parent Mode truoc khi thay doi.", "Please unlock Parent Mode before changing settings."));
                return;
              }
              setParentMode(enabled, progress.parentMode.dailyLimitMinutes);
              if (enabled) {
                sessionStartedAtRef.current = Date.now();
              }
              void trackEvent("parent_mode_update", { enabled });
              setParentMessage(pickLanguageText(language, "Da cap nhat Parent Mode.", "Parent Mode updated."));
            }}
            onLimitChange={(minutes) => {
              if (parentLocked) {
                setParentMessage(pickLanguageText(language, "Can mo khoa Parent Mode truoc khi thay doi.", "Please unlock Parent Mode before changing settings."));
                return;
              }
              updateProgress((previous) => updateParentMode(previous, { dailyLimitMinutes: minutes }));
              void trackEvent("parent_mode_update", { limit: minutes });
              setParentMessage(
                pickLanguageText(
                  language,
                  \`Da cap nhat gioi han: \${minutes} phut/ngay.\`,
                  \`Daily limit updated: \${minutes} min/day.\`,
                ),
              );
            }}
            onSessionLimitChange={(minutes) => {
              if (parentLocked) {
                setParentMessage(pickLanguageText(language, "Can mo khoa Parent Mode truoc khi thay doi.", "Please unlock Parent Mode before changing settings."));
                return;
              }
              updateProgress((previous) => updateParentMode(previous, { sessionLimitMinutes: minutes }));
              void trackEvent("parent_mode_update", { sessionLimit: minutes });
              setParentMessage(
                pickLanguageText(
                  language,
                  \`Da cap nhat gioi han moi phien: \${minutes} phut.\`,
                  \`Session limit updated: \${minutes} min.\`,
                ),
              );
            }}
            />
          </section>
        )}

        {activeView === "settings" && (
          <DashboardSettingsView
            ref={settingsPanelRef}
            language={language}
            pickLanguageText={pickLanguageText}
            ageGroup={ageGroup}
            setAgeGroup={setAgeGroup}
            setLanguage={setLanguage}
            soundMuted={soundMuted}
            setSoundMuted={setSoundMuted}
            uiSfxEnabled={uiSfxEnabled}
            setUiSfxEnabled={setUiSfxEnabled}
            soundVolume={soundVolume}
            setSoundVolume={setSoundVolume}
            ttsEnabled={ttsEnabled}
            setTtsEnabled={setTtsEnabled}
            ttsSupported={ttsSupported}
            autoReadEnabled={autoReadEnabled}
            setAutoReadEnabled={setAutoReadEnabled}
            colorAssistEnabled={colorAssistEnabled}
            setColorAssistEnabled={setColorAssistEnabled}
            AGE_PROFILES={AGE_PROFILES}
            AGE_PROFILE_LABELS={AGE_PROFILE_LABELS}
          />
        )}
        {isMobileLayout ? playgroundPreviewCard : null}`;

if (!regex.test(content)) {
  console.log("Could not find the target section to replace.");
} else {
  content = content.replace(regex, newRenderCode);
  fs.writeFileSync(pageFile, content, 'utf8');
  console.log("Successfully updated page.tsx");
}
