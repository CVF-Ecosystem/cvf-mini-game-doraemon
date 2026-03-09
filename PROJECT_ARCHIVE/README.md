# MINI_GAME Project Archive

Muc tieu: luu toan bo du lieu van hanh cua project mau (history, bug, test, fig) tai mot noi duy nhat.

## Cau truc
- `BUG_HISTORY.md`: log bug va cach fix.
- `TEST_LOG.md`: log ket qua test theo ngay/build.
- `CHANGE_HISTORY.md`: tong hop thay doi theo milestone.
- `FIGURES/`: hinh anh, screenshot, mockup, so do.
- `TEMPLATES/`: template nhanh cho bug/test/figure.
- `scripts/add-log-entry.ps1`: script them dong bug/test vao log.

## Quy tac dat ten file Figure
- `FIG_YYYYMMDD_01_<mo_ta_ngan>.png`
- Vi du: `FIG_20260226_01_home_screen_mobile.png`

## Quy tac cap nhat
- Moi bug fix: cap nhat `BUG_HISTORY.md`.
- Moi lan chay test quan trong: cap nhat `TEST_LOG.md`.
- Moi milestone/sprint ket thuc: cap nhat `CHANGE_HISTORY.md`.

## Script usage
- Them bug:
  - `pwsh Mini_Game/PROJECT_ARCHIVE/scripts/add-log-entry.ps1 -Mode bug -BugId MG-002 -Severity Medium -Area Gameplay -Symptom "Timer not reset" -RootCause "State race" -Fix "Reset when next question" -Status Closed`
- Them test:
  - `pwsh Mini_Game/PROJECT_ARCHIVE/scripts/add-log-entry.ps1 -Mode test -Build local-dev -Scope "math game" -Command "npm run build" -Result PASS -Notes "baseline"`
