# CHANGE_HISTORY - Mini Game

## 2026-02-26 - Baseline Web App Construction
- Scaffolded `Mini_Game/webapp` using Next.js + TypeScript.
- Implemented Mini Game 1 (Math Quick Answer).
- Added progress service (score/combo/streak/highscore/badges).
- Added Parent Mode with daily time limit.
- Added Phaser playground scene for engine integration.
- Added telemetry endpoint `/api/telemetry`.
- Consolidated CVF markdown docs under `Mini_Game/CVF_DOCS`.

## 2026-02-26 - MVP Completion (CVF Plan Aligned)
- Completed Mini Game 2 (Memory) and Mini Game 3 (Color Reflex).
- Added anti-frustration hint logic after repeated wrong answers.
- Added parent daily report (round/correct/wrong/accuracy).
- Extended telemetry events: `game_switch`, `hint_shown`.
- Added unit tests with Vitest for game-core and progress-service.
- Passed gates: `lint`, `test:run`, `build`.
- Updated CVF docs bundle (INPUT/OUTPUT/DECISIONS/RISK/UAT) to completed status.
- Added performance benchmark script and evidence file.
- Passed performance gate in lab setup: LCP 1804ms, FPS 53.6.

## 2026-02-26 - Post-MVP Hardening
- Added Parent PIN lock for settings safety.
- Added first-run onboarding modal.
- Added keyboard shortcuts for accessibility and fast play (`1-4`, `R`).
- Re-ran quality gate: lint/test/build PASS.
- Re-ran performance benchmark: avg LCP 650.67ms, avg FPS 60.4 (PASS).

## 2026-02-26 - Pre-Public Release Documentation Pack
- Added pilot UAT real users checklist.
- Added asset/license audit report.
- Added release notes `v1.0.0-rc1`.
- Added go-live + rollback checklist.
- Added pre-public release gate file with PASS/PENDING/BLOCKED status.

## 2026-02-26 - Legacy Asset Separation
- Moved `background.jpg` and `win.mp3` to `Mini_Game/legacy/streamlit_assets/`.
- Updated `Mini_Game/app.py` to resolve assets from legacy folder (Streamlit still runnable).
- Updated asset audit and pre-public gate: asset license blocker removed for webapp release scope.

## 2026-02-26 - Gate Decision Update
- Pre-public gate updated to:
  - `READY FOR INTERNAL PILOT`
  - `NOT READY FOR PUBLIC RELEASE` (pending pilot UAT real users)

## 2026-03-01 - Skill Preflight Governance Pilot
- Added `Mini_Game/CVF_DOCS/SKILL_PREFLIGHT_RECORD.md` as project pre-code governance evidence.
- Updated B->C gate and OUTPUT/UAT docs to require Skill Preflight PASS before Build artifact changes.
- Logged decision in `Mini_Game/CVF_DOCS/DECISIONS.md` (D-020).

## 2026-03-09 - UI Architecture Refactoring & Typed Quality
- Refactored massive `page.tsx` into modular UI shell components: `DashboardPlayView`, `DashboardProgressView`, `DashboardSettingsView`.
- Resolved all ESLint `@typescript-eslint/no-explicit-any` errors by enforcing strong typing and strict type casting in UI components.
- Fixed `require()` module imports to ES modules `import` in node scripts (`update_page.js`).
- Integrated `vi.useFakeTimers()` inside unit tests for time-sensitive logic (`content-bank.test.ts`), keeping coverage and tests at 100% PASS rate.

## 2026-03-09 - Core Gamification Loop Expansion
- Upgraded the Gacha Chest mechanic in `rewards-service` to support `bonusOpens` alongside the free daily chest.
- Added logic in `page.tsx` to automatically award a `bonusOpens` charge whenever the player achieves a 5x Combo.
- Created `NPCLeaderboard.tsx` to display a competitive Top 5 ranking of static NPCs that scales dynamically based on the day's randomized baseline scores.
- Integrated the new multi-chest UI and the NPC Leaderboard into the `DashboardProgressView` component.

## 2026-03-09 - Meta Game & Virtual Pet Expansion
- Added a full Coin economy to `rewards-service`, mapping correct answers directly to earned Coins.
- Created the `VirtualPetRoom.tsx` component, introducing Tamagotchi-style pet care logic. Players can spend 50 coins to feed their pet or 20 coins to play, affecting `petHunger` and `petHappiness`.
- Hardened the Boss Battle mechanic on the World Map in `page.tsx`, enforcing a strict 10-second timer during Boss Nodes to create genuine challenge.
- Added glowing, pulsing CSS Boss warning animations (`.bossWarningTitle`) to `DashboardPlayView`.

## 2026-03-09 - Phase 5, 6, 7 Next-Level Upgrades
- Deployed a robust `useAudio` hook for synced BGM looping and targeted SFX (Correct/Wrong/Chest/Coins). 
- Automated BGM volume dipping when the Text-To-Speech (TTS) subsystem speaks.
- Mapped 4 specific strategic Passive Skills ("Time Weaver", "Treasure Hunter", "Accuracy Vision", "Combo Master") directly to `equippedPet` allowing pets to organically disrupt logic in `page.tsx`.
- Integrated `recharts` to render a 6-axis Radar Chart in the `ParentModePanel`, visualizing `math/memory/color/logic/compare/vocab` learning profiles.
- Automated specific "Teacher Summaries" based on telemetry inside the parent dashboard.
