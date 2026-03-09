# OUTPUT_SPEC - CVF Mini Game Web App

## 1. Code Artefacts
- `Mini_Game/webapp/src/lib/game-core/*`
  - Question generation + scoring + rank + sfx cho 3 mini game.
- `Mini_Game/webapp/src/lib/progress-service/*`
  - Local progress model + persistence + parent mode logic + daily report stats.
- `Mini_Game/webapp/src/lib/store/game-store.ts`
  - Zustand store cho level/progress.
- `Mini_Game/webapp/src/components/*`
  - Phaser playground + UI shell components + parent report.
- `Mini_Game/webapp/src/app/page.tsx`
  - Main gameplay shell cho 3 mini game.
- `Mini_Game/webapp/src/app/api/telemetry/route.ts`
  - Telemetry endpoint.
- `Mini_Game/webapp/src/lib/**/*.test.ts`
  - Unit tests cho game-core va progress-service.

## 2. Runtime Behaviors
- Tao cau hoi theo 3 che do game (toan, nho hinh, phan xa mau).
- Tinh diem voi combo bonus.
- Co anti-frustration hint neu sai lien tiep.
- Tu dong qua cau hoi moi sau khi tra loi/het gio.
- Luu high score, badges va report ngay vao local storage.
- Chan choi khi parent mode het thoi gian trong ngay.
- Parent settings duoc bao ve bang PIN.
- Onboarding modal xuat hien lan dau cho nguoi choi moi.
- Ho tro keyboard shortcut: phim `1-4` chon dap an, `R` reset run.

## 3. Quality Gates
- `npm run lint` phai PASS.
- `npm run test:run` phai PASS.
- `npm run build` phai PASS.
- Khong co runtime error khi load trang `/`.
- Truoc khi sua artifact trong Build, phai co Skill Preflight PASS trong `Mini_Game/CVF_DOCS/SKILL_PREFLIGHT_RECORD.md`.

## 4. Measurement Outputs
- Event telemetry:
  - `screen_view`
  - `game_switch`
  - `answer_correct`
  - `answer_wrong`
  - `round_timeout`
  - `hint_shown`
  - `parent_unlock`
  - `parent_pin_update`
  - `onboarding_complete`
  - `parent_mode_update`
  - `restart_run`
