# BUG_HISTORY - Mini Game

## Template record
| Date | Bug ID | Severity | Area | Symptom | Root Cause | Fix | Status |
|---|---|---|---|---|---|---|---|
| 2026-02-26 | MG-001 | Medium | Legacy Prototype | `wrong.mp3` missing in Streamlit app | Asset not included | Switched to generated WebAudio tone in web app | Closed |
| 2026-02-26 | MG-002 | Low | Webapp Lint | `color.ts` had unused function warning | Leftover helper not used after refactor | Removed unused function and reran lint | Closed |
| 2026-03-09 | MG-003 | Medium | UI Progress View | ESLint `Unexpected any` on state models | Incomplete generic typing for complex nested React properties | Replaced `any` with explicit `unknown` and used strict type assertions | Closed |
| 2026-03-09 | MG-004 | Low | UI Phaser Component | `react-hooks/unsupported-syntax` warning | React compiler doesn't support generic `this` within functions | Refactored `create` and `preload` scene functionality explicit local vars / cast without relying on implicit `this` context | Closed |
| 2026-03-09 | MG-005 | Medium | Unit Tests | `content-bank.test.ts` failure | Week rotation test logic used true system time instead of mocked timestamp | Implemented `vi.useFakeTimers()` and `vi.setSystemTime()` to mock the test environment | Closed |
| 2026-03-09 | MG-006 | Low | Node Scripts | `@typescript-eslint/no-require-imports` | Old CJS syntax in `update_page.js` | Converted to ES Module `import` syntax | Closed |
