# UAT_CHECKLIST - Mini Game Web App

**Last update:** 2026-02-26

## A. Functional
- [x] Mo trang `/` thanh cong.
- [x] Chon level thay doi do kho cau hoi.
- [x] Choi duoc 3 mini game: Toan Nhanh / Nho Hinh / Phan Xa Mau.
- [x] Tra loi dung tang diem va combo.
- [x] Tra loi sai reset combo.
- [x] Het gio cau hoi -> sinh cau moi.
- [x] Nhan huy hieu moi khi dat combo x3.
- [x] Nut "Choi lai tu dau" reset score/combo.

## B. Progress & Persistence
- [x] Reload trang van giu high score.
- [x] Reload trang van giu badges da mo khoa.
- [x] Streak cap nhat khi choi theo ngay.
- [x] Daily report (round/correct/wrong) luu theo ngay.

## C. Parent Mode
- [x] Bat/tat parent mode hoat dong.
- [x] Dieu chinh daily limit thanh cong.
- [x] Khi het quota, khong the bam dap an.
- [x] Parent PIN lock hoat dong (unlock/fail flow dung).

## D. Performance & Quality
- [x] `npm run lint` PASS.
- [x] `npm run test:run` PASS.
- [x] `npm run build` PASS.
- [x] UI doc duoc tren mobile viewport 390x844.
- [x] Benchmark lab pass: LCP trung binh 1804ms (<2500ms), FPS trung binh 53.6 (>=50).

## E. Safety
- [x] Khong co ads/link ngoai trong game.
- [x] Khong gui thong tin dinh danh ca nhan qua telemetry.
- [x] Parent settings duoc bao ve bang PIN.

## F. UX Hardening
- [x] Onboarding lan dau hien thi dung.
- [x] Keyboard shortcut 1-4 chon dap an, R reset run.

## G. Skill Preflight Governance
- [x] Co Skill Preflight record cho Build action hien tai.
- [x] Skill duoc khai bao co mapping record hop le.
- [x] Preflight declaration duoc ghi truoc khi cap nhat artifact.
