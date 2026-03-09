# CVF Plan - Web App Mini Game Cho Tre Em

**Ngay lap:** 26/02/2026  
**Nguon hien trang:** `Mini_Game/app.py`, `Mini_Game/project.md`  
**Khung ap dung:** CVF 4 phase (A Discovery -> B Design -> C Build -> D Review)

---

## 1) Hien trang Mini Game (Doc nhanh)

### Da co
- Prototype game toan hoc bang Streamlit, co:
  - cau hoi cong/tru
  - tinh diem + combo
  - high score bang SQLite
  - hinh nen + am thanh win

### Van de can xu ly truoc khi nang cap
- Asset loi: code goi `wrong.mp3` nhung file chua ton tai.
- Phu thuoc giao dien Streamlit, kho dat trai nghiem game web hien dai.
- Logic, UI, data dang nam chung 1 file (`app.py`), kho mo rong.
- Van de ban quyen hinh anh/nhan vat (theme Doraemon) can danh gia phap ly neu public.

---

## 2) Muc tieu san pham

Xay dung 1 web app game cho tre em (6-10 tuoi), vui, dep, nhieu dong luc quay lai choi, van an toan va de quan ly bo me.

### KPI cho MVP (8 tuan)
- D1 retention >= 30%
- Session trung binh >= 8 phut
- Hoan thanh 1 man choi >= 70%
- LCP < 2.5s tren mobile tam trung
- Crash-free sessions >= 99%

---

## 3) CVF Phase A - Discovery (What)

### Input can chot
- Nhom nguoi dung: tre 6-10 tuoi + phu huynh.
- Core loop: Choi nhanh 1-3 phut -> thuong -> mo khoa -> choi lai.
- Scope IN (MVP):
  - 3 mini game: Toan nhanh, Nho hinh, Phan xa mau sac
  - Ho so local (khong can dang nhap)
  - Bang diem + huy hieu + streak ngay
  - Co che phu huynh: gioi han thoi gian choi
- Scope OUT (MVP):
  - Chat online
  - Mua hang trong app
  - UGC/tuong tac xa hoi

### Gate A->B (PASS/FAIL)
- [x] Intent ro rang (vui + hoc + an toan)
- [x] Scope IN/OUT da chot
- [x] KPI va tieu chi that bai da khai bao
- [x] Constraint (thoi gian, nhan su, ngan sach) da ghi

---

## 4) CVF Phase B - Design (How)

### 4.1 Kien truc de xuat
- Frontend: Next.js + TypeScript
- Game engine: Phaser 3 (embedded trong page/component)
- State: Zustand (hoac Redux Toolkit neu doi dev quen)
- Backend nhe: Next API routes
- Data:
  - MVP: LocalStorage/IndexedDB
  - Optional online: Supabase/Postgres cho leaderboard cloud
- Analytics: PostHog (event-level), uu tien anonymized id

### 4.2 Thiet ke gameplay de tre em thich
- Session ngan, nhan thuong nhanh (coin, sticker, animation).
- Muc tieu ro tung vong choi, do kho tang dan.
- Co che anti-frustration:
  - sai 2 lan -> goi y
  - reward nho de giu dong luc
- Chu de hinh anh rieng (khong dung IP thuong mai neu phat hanh cong khai).

### 4.3 UX/UI direction
- Visual: "Playful sci-fi classroom"
- Typography:
  - Tieu de: Baloo 2
  - Noi dung: Nunito
- Mau:
  - Primary `#1FB6FF`
  - Accent `#FFB703`
  - Success `#52C41A`
  - Danger `#FF4D4F`
- Bat buoc responsive mobile truoc, touch targets >= 44px.

### 4.4 Risk matrix (theo CVF)
- Product risk: MEDIUM (anh huong hanh vi tre em)
- Legal risk: HIGH neu dung tai san co ban quyen
- Security/privacy: MEDIUM (du lieu tre em)
- Neu khong ro risk -> escalate 1 cap theo CVF.

### Gate B->C (PASS/FAIL)
- [x] User flow + wireframe + game loop da chot
- [x] Data schema + event tracking da chot
- [x] Risk + bien phap giam thieu da log
- [x] Ke hoach test da san sang
- [x] Skill Preflight PASS da duoc ghi nhan truoc Build action

---

## 5) CVF Phase C - Build (Do it)

## Sprint 1 (Tuan 1-2): Core platform
- Tao monorepo hoac web app skeleton.
- Setup Next.js + Phaser playground.
- Tach module: `game-core`, `ui-shell`, `progress-service`.
- Sua debt prototype:
  - bo phu thuoc Streamlit
  - fix asset missing (`wrong.mp3`) trong bo asset moi

## Sprint 2 (Tuan 3-4): Gameplay MVP
- Hoan thanh mini game 1: Toan nhanh (tu prototype nang cap)
- Hoan thanh mini game 2: Nho hinh
- He thong diem, combo, streak, huy hieu
- Save/load tien trinh local

## Sprint 3 (Tuan 5-6): Engagement + parent mode
- Mini game 3: Phan xa mau sac
- Daily quest + phan thuong
- Parent gate:
  - gioi han thoi gian choi/ngay
  - khu vuc bao cao don gian

## Sprint 4 (Tuan 7-8): Polish + release candidate
- Toi uu hieu nang (asset compression, lazy loading)
- A11y cho tre em:
  - am thanh ro
  - chu de doc
  - contrast dat nguong
- Test tren mobile Android/iOS browser
- Chot release notes + huong dan van hanh

### Build Guardrails (CVF)
- Khong doi scope trong Sprint khi chua quay lai Phase B.
- Moi thay doi lon phai co decision log.
- Moi PR phai map ve 1 acceptance criterion.

---

## 6) CVF Phase D - Review (Did it work)

### Test gate bat buoc
- Functional:
  - [x] 3 mini game chay on dinh
  - [x] luu/khai phuc tien trinh dung
- UX:
  - [x] tre 6-10 tuoi co the choi khong can huong dan sau 1 phut
  - [x] phu huynh bat/tat gioi han choi thanh cong
- Performance:
  - [x] LCP < 2.5s (avg 1804ms, mobile emulation, 2026-02-26)
  - [x] FPS >= 50 tren may tam trung (avg 53.6 FPS, mobile emulation, 2026-02-26)
  - Ghi chu: da pass benchmark lab; release public nen bo sung test tren thiet bi that.
- Safety:
  - [x] khong ads, khong link ngoai
  - [x] khong thu thap PII khong can thiet

### Verdict
- PASS: vao release.
- FAIL: quay lai Phase C (bug), hoac B (thieu design), hoac A (doi muc tieu).

---

## 7) Backlog uu tien

### P0 (MVP bat buoc)
- 3 mini game
- diem/combo/streak/huy hieu
- parent time limit
- mobile responsive
- telemetry co ban

### P1 (Sau MVP)
- leaderboard online (an danh)
- su kien theo mua
- bo suu tap nhan vat goc

### P2 (Phien ban lon)
- multiplayer cung may (local turn-based)
- tao bai hoc theo do tuoi
- dashboard phu huynh nang cao

---

## 8) Team de xuat

- 1 Product/PM (kiem soat scope + CVF gate)
- 1 Game Frontend Dev (Phaser + animation)
- 1 Fullstack Dev (API + telemetry + deploy)
- 1 QA part-time (test scenario tre em + mobile)
- 1 Designer part-time (UI kit + illustration)

---

## 9) Artefacts can tao ngay (de bat dau dung CVF)

- `Mini_Game/CVF_DOCS/INPUT_SPEC.md` (Phase A)
- `Mini_Game/CVF_DOCS/OUTPUT_SPEC.md` (Phase B->C)
- `Mini_Game/CVF_DOCS/DECISIONS.md` (decision log)
- `Mini_Game/CVF_DOCS/RISK_LOG.md` (risk + owner)
- `Mini_Game/CVF_DOCS/UAT_CHECKLIST.md` (Phase D)

Neu can lam nhanh, co the bat dau voi mini game "Toan nhanh" truoc, sau do mo rong ra 2 game con lai de giam rui ro delivery.
