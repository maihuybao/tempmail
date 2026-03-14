# Hướng dẫn Deploy Flux Mail — Ubuntu 24 VPS

Hướng dẫn chi tiết từ server trắng đến production. Giả sử domain là `example.com`.

## Kiến trúc tổng quan

```
Internet ──MX record──▶ SMTP Server (port 25) ──▶ PostgreSQL ◀── Web UI (port 3000) ◀── Browser
                         (Rust binary)              (chung DB)     (Next.js 15)
```

3 thành phần, cùng kết nối 1 database PostgreSQL. Không có API layer giữa SMTP và Web UI.

---

## Phần 1: Chuẩn bị VPS

### 1.1. Yêu cầu

- Ubuntu 24.04 LTS
- RAM tối thiểu 1GB (2GB khuyến nghị để build Rust)
- Port 25 mở (kiểm tra với nhà cung cấp VPS — nhiều provider block port 25 mặc định)
- Port 80, 443 mở cho Web UI
- Một domain đã trỏ về IP VPS

### 1.2. Cập nhật hệ thống

```bash
sudo apt update && sudo apt upgrade -y
```

### 1.3. Tạo user hệ thống

Tạo user riêng cho SMTP server — không có shell login, không SSH được:

```bash
sudo useradd --system --no-create-home --shell /usr/sbin/nologin fluxmail
```

### 1.4. Cài các package cần thiết

```bash
sudo apt install -y build-essential pkg-config libssl-dev curl git ufw
```

---

## Phần 2: Cài đặt PostgreSQL

### 2.1. Cài đặt

```bash
sudo apt install -y postgresql postgresql-contrib
sudo systemctl enable postgresql
sudo systemctl start postgresql
```

### 2.2. Tạo database và user

```bash
sudo -u postgres psql
```

```sql
CREATE USER fluxmail WITH PASSWORD 'thay_bang_password_manh';
CREATE DATABASE fluxmail OWNER fluxmail;
\q
```

> Dùng `openssl rand -base64 32` để tạo password ngẫu nhiên. Không dùng password yếu như `fluxmail` hay `123456`.

> Không cần tạo table — SMTP server tự tạo schema (bảng `mail`, `quota`, `user_config`) khi khởi động lần đầu.

### 2.3. Cấu hình kết nối (nếu DB ở máy khác)

Nếu cả 3 thành phần chạy trên cùng 1 VPS thì bỏ qua bước này.

Tìm file config:
```bash
sudo -u postgres psql -c "SHOW config_file;"
```

Sửa `postgresql.conf`:
```
listen_addresses = '*'
```

Sửa `pg_hba.conf` (cùng thư mục), thêm dòng:
```
host    flux_mail    fluxmail    0.0.0.0/0    md5
```

```bash
sudo systemctl restart postgresql
```

---

## Phần 3: Deploy SMTP Server (Rust)

### 3.1. Cài Rust

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
source ~/.cargo/env
```

### 3.2. Clone source code

```bash
sudo mkdir -p /opt/flux-mail
sudo chown $USER:$USER /opt/flux-mail
git clone <your-repo-url> /opt/flux-mail
cd /opt/flux-mail
```

### 3.3. Sửa domain (bắt buộc)

Sửa file `crates/smtp/src/main.rs`, dòng 16:

```rust
// Đổi từ:
let domain: String = String::from("mail.flux.shubh.sh");
// Thành:
let domain: String = String::from("mail.example.com");
```

### 3.4. Build

```bash
cargo build --release
```

Binary nằm ở `target/release/flux-mail`.

> Build lần đầu mất 3-10 phút tùy cấu hình VPS. Nếu VPS yếu RAM, tạo swap trước:
> ```bash
> sudo fallocate -l 2G /swapfile
> sudo chmod 600 /swapfile
> sudo mkswap /swapfile
> sudo swapon /swapfile
> ```

### 3.5. Tạo file env

```bash
cat > /opt/flux-mail/.env << 'EOF'
DB_HOST=localhost
DB_USER=fluxmail
DB_PASSWORD=password_da_tao_o_buoc_2
DB_NAME=flux_mail
EOF

chmod 600 /opt/flux-mail/.env
chown fluxmail:fluxmail /opt/flux-mail/.env
```

### 3.6. Phân quyền thư mục

```bash
sudo chown -R fluxmail:fluxmail /opt/flux-mail/target
```

### 3.7. Tạo systemd service

```bash
sudo tee /etc/systemd/system/flux-mail.service > /dev/null << 'EOF'
[Unit]
Description=Flux Mail SMTP Server
After=network.target postgresql.service
Requires=postgresql.service

[Service]
Type=simple
User=fluxmail
Group=fluxmail
WorkingDirectory=/opt/flux-mail
ExecStart=/opt/flux-mail/target/release/flux-mail
EnvironmentFile=/opt/flux-mail/.env
Restart=always
RestartSec=5
LimitNOFILE=65535

# Cho phép bind port 25 mà không cần root
AmbientCapabilities=CAP_NET_BIND_SERVICE
CapabilityBoundingSet=CAP_NET_BIND_SERVICE

# Hardening — giới hạn quyền tối đa
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=true
PrivateTmp=true
ReadOnlyPaths=/opt/flux-mail

[Install]
WantedBy=multi-user.target
EOF
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable flux-mail
sudo systemctl start flux-mail
```

### 3.8. Kiểm tra

```bash
sudo systemctl status flux-mail
sudo journalctl -u flux-mail -f
```

Phải thấy log `Server Started On Port: 0.0.0.0:25` và `Database initialized successfully`.

---

## Phần 4: Deploy Web UI (Next.js)

### 4.1. Cài Node.js và pnpm

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
npm install -g pnpm
```

### 4.2. Sửa domain (bắt buộc)

Sửa file `ui/app/search/SearchResults.tsx`, thay tất cả `flux.shubh.sh` thành domain của bạn. Có 3 chỗ (dòng 36, 90, 113):

```tsx
// Dòng 36
const result = await searchEmails(`${query}@example.com`);

// Dòng 90
Mails for &quot;{query}@example.com&quot;

// Dòng 113
&apos;{query}@example.com&apos;
```

### 4.3. Build

```bash
cd /opt/flux-mail/ui
pnpm install

# Tạo env cho Next.js
cat > .env << 'EOF'
DATABASE_URL=postgresql://fluxmail:mat_khau_manh_cua_ban@localhost:5432/flux_mail
EOF

pnpm build
```

### 4.4. Tạo systemd service

```bash
sudo tee /etc/systemd/system/flux-ui.service > /dev/null << 'EOF'
[Unit]
Description=Flux Mail Web UI
After=network.target postgresql.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/flux-mail/ui
ExecStart=/usr/bin/pnpm start
Environment=NODE_ENV=production
Environment=PORT=3000
EnvironmentFile=/opt/flux-mail/ui/.env
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF
```

```bash
sudo chown -R www-data:www-data /opt/flux-mail/ui
sudo systemctl daemon-reload
sudo systemctl enable flux-ui
sudo systemctl start flux-ui
```

Kiểm tra:
```bash
sudo systemctl status flux-ui
curl http://localhost:3000
```

---

## Phần 5: Reverse Proxy với Nginx + HTTPS

### 5.1. Cài Nginx và Certbot

```bash
sudo apt install -y nginx certbot python3-certbot-nginx
```

### 5.2. Tạo config Nginx

```bash
sudo tee /etc/nginx/sites-available/flux-mail > /dev/null << 'EOF'
server {
    listen 80;
    server_name example.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF
```

```bash
sudo ln -s /etc/nginx/sites-available/flux-mail /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

### 5.3. Cài SSL (Let's Encrypt)

```bash
sudo certbot --nginx -d example.com
```

Certbot tự cấu hình redirect HTTP → HTTPS và tự gia hạn cert.

---

## Phần 6: Cấu hình DNS

Tại nơi quản lý domain (Cloudflare, Namecheap, v.v.), thêm các record:

| Type | Name | Value | Priority |
|------|------|-------|----------|
| A | `@` | `<IP VPS>` | — |
| A | `mail` | `<IP VPS>` | — |
| MX | `@` | `mail.example.com` | 10 |

Tùy chọn (giúp email không bị đánh spam khi forward):

| Type | Name | Value |
|------|------|-------|
| TXT | `@` | `v=spf1 ip4:<IP VPS> ~all` |

> DNS cần 5 phút đến vài giờ để propagate. Kiểm tra bằng `dig MX example.com`.

---

## Phần 7: Firewall

```bash
sudo ufw allow 22/tcp     # SSH
sudo ufw allow 25/tcp     # SMTP
sudo ufw allow 80/tcp     # HTTP
sudo ufw allow 443/tcp    # HTTPS
sudo ufw enable
```

---

## Phần 8: Kiểm tra toàn bộ

### Test SMTP

```bash
telnet mail.example.com 25
```

```
EHLO test
MAIL FROM:<test@gmail.com>
RCPT TO:<hello@example.com>
DATA
Subject: Test Deploy

Hello from production!
.
QUIT
```

### Test Web UI

Mở browser, vào `https://example.com`, nhập `hello` → phải thấy email vừa gửi.

### Test từ email thật

Gửi email từ Gmail/Yahoo đến `anything@example.com`, rồi kiểm tra trên Web UI.

---

## Phần 9: Bảo trì

### Xem log

```bash
# SMTP server
sudo journalctl -u flux-mail -f

# Web UI
sudo journalctl -u flux-ui -f
```

### Restart services

```bash
sudo systemctl start flux-mail
sudo systemctl stop flux-ui
```

### Cập nhật code

```bash
cd /opt/flux-mail
git pull

# Rebuild SMTP
cargo build --release
sudo systemctl restart flux-mail

# Rebuild UI
cd ui
pnpm install
pnpm build
sudo systemctl restart flux-ui
```

### Dọn mail thủ công (nếu cần)

SMTP server tự xóa mail cũ hơn 7 ngày mỗi giờ. Nếu muốn xóa thủ công:

```bash
sudo -u postgres psql -d flux_mail -c "DELETE FROM mail WHERE date < '2024-01-01';"
```

---

## Tổng hợp env vars

| Thành phần | File | Biến |
|------------|------|------|
| SMTP Server | `/opt/flux-mail/.env` | `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` |
| Web UI | `/opt/flux-mail/ui/.env` | `DATABASE_URL` (connection string đầy đủ) |

## Tổng hợp services

| Service | Port | Systemd unit |
|---------|------|-------------|
| PostgreSQL | 5432 | `postgresql` |
| SMTP Server | 25 | `flux-mail` |
| Web UI | 3000 (qua Nginx: 80/443) | `flux-ui` |
