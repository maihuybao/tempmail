# Inbox API

## GET `/api/inbox`

Lấy danh sách email của một địa chỉ.

### Query Parameters

| Param | Type   | Required | Mô tả                          |
|-------|--------|----------|---------------------------------|
| email | string | Yes      | Địa chỉ email (vd: `user@domain.com`) |

### Response

#### 200 OK

```json
{
  "ok": true,
  "count": 2,
  "emails": [
    {
      "date": "Mon, 10 Mar 2026 08:30:00 +0000",
      "sender": "<sender@example.com>",
      "recipients": "<user@domain.com>",
      "subject": "Hello",
      "from": "Sender Name <sender@example.com>",
      "text": "Nội dung plain text",
      "html": "<p>Nội dung HTML</p>"
    }
  ]
}
```

#### 400 Bad Request

```json
{
  "ok": false,
  "error": "Missing or invalid 'email' query parameter (e.g. ?email=user@domain.com)"
}
```

### Ví dụ

```bash
curl "https://your-domain.com/api/inbox?email=test@flux.shubh.sh"
```

---

## GET `/api/domains`

Lấy danh sách domain đang hoạt động.

### Response

#### 200 OK

```json
{
  "ok": true,
  "domains": ["foxycrown.net", "locketgold.me"]
}
```

### Ví dụ

```bash
curl "https://your-domain.com/api/domains"
```

---

## GET `/api/generate`

Tạo một địa chỉ email ngẫu nhiên (random username + random domain).

### Response

#### 200 OK

```json
{
  "ok": true,
  "email": "k7x2m9qf@foxycrown.net",
  "username": "k7x2m9qf",
  "domain": "foxycrown.net"
}
```

#### 503 Service Unavailable

Không có domain nào đang hoạt động:

```json
{
  "ok": false,
  "error": "No active domains available"
}
```

### Ví dụ

```bash
curl "https://your-domain.com/api/generate"
```

---

### Lỗi chung

Tất cả endpoint trả `500` khi có lỗi server:

```json
{
  "ok": false,
  "error": "Internal server error"
}
```
