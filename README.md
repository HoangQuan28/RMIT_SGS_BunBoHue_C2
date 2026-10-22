# UniSign Forum 🎓🔐

> **RMIT HACKATHON 2026 — Team Bún Bò Huế (Challenge 2)**
> **"UniSign — Chúng ta cùng tiến"**

UniSign Forum là nền tảng diễn đàn sinh viên phi tập trung bảo mật cao, kết hợp giữa **TideCloak (Skycloak OIDC + Hardware DPoP ES256)** và **Mã hoá đầu cuối phân mảnh khóa 5-of-7 ORK (GF(256) Shamir Secret Sharing)**.

---

## 🌟 Tính Năng Nổi Bật

1. **Bảo Mật & Xác Thực Danh Tính Sinh Viên qua TideCloak**:
   - Xác thực mật khẩu qua chữ ký phần cứng WebCrypto **ECDSA P-256 (DPoP ES256)** không lưu plaintext.
   - Hỗ trợ đăng nhập nhanh **TideCloud Passkey (1 chạm)** trực tiếp trong ứng dụng.
   - Hỗ trợ nhận diện tự động tên miền sinh viên của **19 trường đại học** tại Việt Nam (HCMUT, HCMUS, UIT, HUST, NEU, FTU, UEH, RMIT...) mà không gán cứng.

2. **Phân Lập Group Chat Theo Diễn Đàn (Zero Campus Bleed)**:
   - Mỗi diễn đàn là một phòng chat riêng biệt (kênh `#general`, `#study-sprint`, `#resources`).
   - Xóa bỏ hoàn toàn phòng chat chung; chỉ thành viên đã tham gia nhóm mới có quyền truy cập.

3. **Cơ Chế Kiểm Duyệt & Duyệt Đơn (Admin Gate)**:
   - Người dùng mới nộp đơn tham gia sẽ ở trạng thái `pending_approval` (Read-only).
   - Chỉ Admin hoặc người tạo nhóm mới có quyền phê duyệt thành `joined` để mở khóa quyền chat.
   - 6 nhóm được cấu hình miễn bài khảo sát (*No questionnaire required*) để nộp đơn xét duyệt ngay lập tức.

4. **TideCloak 5-of-7 ORK E2EE (Gói Premium)**:
   - **Gói Miễn Phí (Free)**: Sử dụng TideCloak xác thực mật khẩu; tin nhắn lưu dạng log kiểm duyệt nội quy trường học.
   - **Gói Premium (100.000 VNĐ / tháng)**: Mở khóa mã hoá đầu cuối **AES-256-GCM** tại RAM trình duyệt. Khóa giải mã được phân tán thành 7 mảnh qua 7 trung tâm dữ liệu toàn cầu (Singapore, Tokyo, Frankfurt, Stockholm, Virginia, Oregon, Sydney) theo thuật toán **5-of-7 Shamir GF(256)**.
   - Cổng thanh toán hóa đơn quét mã trực tiếp qua **VietQR Napas 247** và **Ví MoMo**.

5. **Trải Nghiệm Chat Hiện Đại (Telegram / Discord UI)**:
   - Thanh ghim thông báo quan trọng (Pinned Bar).
   - Thả cảm xúc Emoji Reaction và Trả lời trích dẫn (Quoted Replies).
   - Danh sách thành viên trực tuyến và Modal tra cứu trạng thái 7 nút mạng phân mảnh khóa.

6. **Điều Khoản Dịch Vụ Bắt Buộc (User Agreement Modal)**:
   - Bắt buộc đồng thuận điều khoản dịch vụ và chính sách thu thập nhật ký kỹ thuật khi đăng ký tài khoản.
   - Nút **"Từ chối & Ngắt kết nối"** tự động hủy phiên, xóa sạch token lưu trữ và ngắt kết nối an toàn.

---

## 🚀 Hướng Dẫn Cài Đặt & Khởi Chạy

### 1. Chạy Trực Tiếp (Local Node.js)

Yêu cầu: **Node.js 18+** (Khuyên dùng v20 hoặc v22).

```bash
# Cài đặt thư viện
npm install

# Khởi chạy môi trường phát triển (Port 3000)
npm run dev

# Hoặc Build & Chạy bản Production Standalone
npm run build
npm start
```

Truy cập: `http://localhost:3000`

### 2. Chạy Bằng Docker & Docker Compose

```bash
# Build và khởi chạy container trong nền
docker compose up -d --build

# Xem logs container
docker compose logs -f
```

### 3. Đóng Gói Ứng Dụng Desktop (Windows .exe)

Dự án đã tích hợp sẵn cấu hình Electron để đóng gói thành ứng dụng desktop:

```bash
# Chạy script đóng gói
./run_production.sh
```

File `.exe` độc lập có thể phân phối trực tiếp cho người dùng Windows mà không cần cài đặt Node.js.

---

## 📂 Cấu Trúc Dự Án

```
├── electron/               # Desktop Native Wrapper (Windows .exe / Linux)
├── public/                 # Ảnh QR VietQR/MoMo, DPoP Auth Enclave Relay, PWA Manifest
├── src/
│   ├── app/                # Next.js 14 App Router (API Routes, Page, Verify)
│   ├── components/
│   │   ├── admin/          # Questionnaire Editor Modal
│   │   ├── auth/           # UniSign Auth Modal (Email/Password + TideCloud Passkey)
│   │   ├── chat/           # Community Chat View (E2EE 5-of-7, Reactions, Pin)
│   │   ├── discovery/      # Forum Discovery, Questionnaire Modal, Application Modal
│   │   ├── legal/          # Terms of Service & Data Logging Disclosure Modal
│   │   └── subscription/   # 100k VietQR & MoMo Payment Gateway Modal
│   └── lib/
│       ├── constants/      # 19 Danh mục trường ĐH & Dữ liệu diễn đàn
│       ├── crypto/         # Engine TideCloak (DPoP ES256, 5-of-7 GF(256) Shamir, AES-GCM)
│       ├── db/             # SQLite WAL Database & Schema Migrations
│       └── supabase/       # Supabase Client & Realtime integration
├── Dockerfile              # Multi-stage production container
├── docker-compose.yml      # 1-click container orchestration
├── package.json            # Package metadata (UniSign Forum v1.0.0)
└── run_production.sh       # One-click production launcher script
```

---

## 🏆 Đội Ngũ Phát Triển (Team Bún Bò Huế)
- **Challenge**: RMIT Hackathon 2026 — Track 2: Decentralized Student Collaboration
- **Mã nguồn**: [HoangQuan28/RMIT_SGS_BunBoHue_C2](https://github.com/HoangQuan28/RMIT_SGS_BunBoHue_C2)
- **Bản quyền**: MIT License
