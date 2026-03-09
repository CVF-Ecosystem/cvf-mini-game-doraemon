# DECISIONS - Mini Game Web App

## D-001 (2026-02-26)
- **Decision:** Khoi tao app bang Next.js App Router + TypeScript.
- **Reason:** Phu hop web deployment, typed code, de mo rong API route.
- **Impact:** Frontend + backend nhe trong cung codebase.

## D-002 (2026-02-26)
- **Decision:** Them Phaser playground thay vi build full gameplay tren Phaser ngay sprint dau.
- **Reason:** Dat muc tieu Sprint 1 (engine setup) nhung van giao duoc gameplay MVP nhanh.
- **Impact:** Mini game toan nhanh hien tai chay tren React UI, co san duong chuyen qua Phaser scene sau.

## D-003 (2026-02-26)
- **Decision:** Dung local storage cho progress thay vi cloud DB o MVP.
- **Reason:** Giam do phuc tap, khong can auth.
- **Impact:** Du lieu theo tung trinh duyet/thiet bi.

## D-004 (2026-02-26)
- **Decision:** Parent mode gioi han thoi gian choi theo ngay.
- **Reason:** Dap ung yeu cau an toan cho tre em ngay trong MVP.
- **Impact:** Co the block gameplay khi het quota trong ngay.

## D-005 (2026-02-26)
- **Decision:** Dung generated tone (Web Audio) thay file `wrong.mp3`.
- **Reason:** Loai bo debt asset thieu tu prototype Streamlit.
- **Impact:** Khong phu thuoc static audio file cho feedback sai.

## D-006 (2026-02-26)
- **Decision:** Hoan tat MVP voi 3 mini game trong cung 1 shell page va tab switch.
- **Reason:** Dat dung scope P0 trong CVF plan (Toan Nhanh, Nho Hinh, Phan Xa Mau).
- **Impact:** Tang do hap dan va giu nguoi choi theo gameplay loop nhieu kieu.

## D-007 (2026-02-26)
- **Decision:** Them anti-frustration hint sau 2 lan sai lien tiep.
- **Reason:** Giam cam giac that bai cua tre em, giu dong luc tiep tuc choi.
- **Impact:** UX than thien hon, ty le tiep tuc vong choi tot hon.

## D-008 (2026-02-26)
- **Decision:** Them daily report trong Parent Mode (round/correct/wrong/accuracy).
- **Reason:** Dap ung yeu cau "khu vuc bao cao don gian" trong Sprint 3.
- **Impact:** Phu huynh co so lieu nhanh de theo doi chat luong choi-hoc.

## D-009 (2026-02-26)
- **Decision:** Bo sung vitest unit tests cho game-core/progress-service.
- **Reason:** Tao quality gate tu dong theo chuan CVF truoc khi chot MVP.
- **Impact:** Co thong so test reproducible (`npm run test:run`) cho project mau.

## D-010 (2026-02-26)
- **Decision:** Dung benchmark script Playwright (mobile emulation + CPU throttle) de khoa gate LCP/FPS cho MVP.
- **Reason:** Can co bang chung dinh luong de dong gate Performance trong plan.
- **Impact:** Co file ket qua benchmark (`perf-benchmark-result.json`) va co so cong bo MVP.

## D-011 (2026-02-26)
- **Decision:** Them PIN lock cho Parent Mode settings.
- **Reason:** Tang safety khi dua san pham cho tre em dung thuc te.
- **Impact:** Thay doi parent settings can mo khoa bang PIN truoc.

## D-012 (2026-02-26)
- **Decision:** Them onboarding modal va keyboard shortcut (`1-4`, `R`).
- **Reason:** Cai thien first-run UX va kha nang su dung nhanh.
- **Impact:** Giam friction cho nguoi dung moi va tang do thu nghiem nhanh.

## D-013 (2026-02-27)
- **Decision:** Quay lai CVF Phase C de nang cap quality gate theo checklist tre em (age profile + audio controls + telemetry bo sung).
- **Reason:** MVP da on dinh nhung chua dat du checklist "kid game quality" cho public release.
- **Impact:** Gameplay duoc can bang theo nhom tuoi, phu huynh co quyen tat/chinh am thanh, telemetry do duoc quality loop chi tiet hon.

## D-014 (2026-02-27)
- **Decision:** Bo sung TTS cho cau hoi va PWA/offline-first baseline (manifest + service worker + offline page).
- **Reason:** Nang kha nang tiep can cho tre doc yeu va dam bao trai nghiem trong dieu kien mang khong on dinh.
- **Impact:** Tang kha nang su dung thuc te tren mobile, giam ty le bo choi do mat ket noi.

## D-015 (2026-02-27)
- **Decision:** Bat buoc test coverage gate cho Mini Game (`npm run test:coverage`) va log baseline trong CVF docs.
- **Reason:** Coverage la yeu cau bat buoc cua CVF cho moi software project, truoc day chua duoc ghi ro trong project nay.
- **Impact:** Co metric quality dinh luong, co threshold de chan regression, va co bang chung de mo release gate.

## D-016 (2026-02-27)
- **Decision:** Nang threshold coverage len (Statements 80 / Branches 60 / Functions 80 / Lines 80) sau khi bo sung test boi rong.
- **Reason:** Baseline moi da dat muc cao hon, can chot gate chat hon de tranh regression khi tiep tuc polish.
- **Impact:** Coverage gate tro thanh quality control that su cho pre-release.

## D-017 (2026-02-27)
- **Decision:** Khoi dong roadmap "Full 8 proposals" theo 2 truc (learning value + engagement).
- **Reason:** Bo de nghi moi yeu cau vuot qua scope 8-upgrades cu, can mot plan hop nhat va DoD ro rang.
- **Impact:** Tao file `CVF_FULL_8_PROPOSALS_EXECUTION_ROADMAP_2026-02-27.md` va trien khai theo cum U1/U2/U3.

## D-018 (2026-02-27)
- **Decision:** Them Adaptive Difficulty Engine + Learning Path profile vao gameplay loop.
- **Reason:** Can giu do kho "vua suc" theo 5-10 luot gan nhat va co de xuat bai tap trung vao diem yeu.
- **Impact:** Round start duoc tune dong (pace/complexity), parent report co them ho so ky nang.

## D-019 (2026-02-27)
- **Decision:** Mo rong game loop voi mini-game Logic + bo sung detective tool unlock + baseline A/B telemetry.
- **Reason:** Tang do moi gameplay va tao gia tri progression ro rang hon thay vi chi diem/combo.
- **Impact:** `MiniGameKey` duoc mo rong, reward co tool equip, telemetry co event retention/drop-off/experiment exposure.

## D-020 (2026-03-01)
- **Decision:** Bat buoc Skill Preflight truoc moi Build/Execute action co sua artifact.
- **Reason:** Dong bo voi CVF governance moi de loai bo tinh trang "co rule nhung de bo qua khi thuc thi".
- **Impact:** Build docs/gates/UAT cua Mini_Game phai co bang chung preflight, luu tai `Mini_Game/CVF_DOCS/SKILL_PREFLIGHT_RECORD.md`.

## D-021 (2026-03-09)
- **Decision:** Tach file `page.tsx` thanh cac UI shell components nho (DashboardPlayView, DashboardProgressView, DashboardSettingsView).
- **Reason:** File `page.tsx` qua lon (~3000 dong), kho bao tri va de gay conflict khi dev nhieu tinh nang moi.
- **Impact:** Kien truc React component modular hon, de maintain, giam tai render logic cho main page.

## D-022 (2026-03-09)
- **Decision:** Loai bo toan bo `any` types o UI layer thanh `unknown` hoac strict interface.
- **Reason:** Dam bao strict TypeScript typing de nang cao tinh on dinh va clean ma nguon kien truc.

## D-023 (2026-03-09)
- **Decision:** Nâng cấp vòng lặp Gamification: Thêm `bonusOpens` cho Gacha Chest và tạo bảng xếp hạng ảo `NPCLeaderboard`.
- **Reason:** Để tăng tính giữ chân (retention) ngoài việc đăng nhập hàng ngày, hệ thống Gacha cần thưởng lượt mở (khi đạt Combo x5). Thêm Leaderboard với NPC tạo cảm giác thi đấu an toàn (không cần backend/chống tên người dùng độc hại).
- **Impact:** `rewards-service` được cập nhật thêm trường `bonusOpens` và logic test. `page.tsx` và `DashboardProgressView.tsx` được cập nhật UI tương ứng và render bảng điểm hàng ngày `NPCLeaderboard`.

## D-024 (2026-03-09)
- **Decision:** Nâng cấp Meta Game: Thêm hệ thống Tiền tệ (Coins), Phòng Thú Cưng (Tamagotchi), và Chế độ Boss World Map.
- **Reason:** Cần biến hệ thống trò chơi thành một vòng lặp có ý nghĩa dài hạn. Bằng cách nối điểm số với Coins, và dùng Coins để chăm sóc Thú Cưng (Pet Hunger/Happiness), trẻ có động lực giải toán mỗi ngày. Các vòng đấu Boss cũng cần tạo ra thách thức thực sự (đồng hồ 10s kịch tính).
- **Impact:** Thêm `VirtualPetRoom.tsx` và các API `earnCoins`, `feedPet` trong `rewards-service`. Sửa đổi `getRuntimeRoundConfig` trong `page.tsx` để giới hạn thời gian màn Boss, và thêm hiệu ứng CSS `bossWarningTitle` cảnh báo rung động.
- **Impact:** ESLint hoan toan PASS voi zero warnings, pipeline quality safety tang cao.
