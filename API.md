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

Thiếu hoặc sai param `email`:

```json
{
  "ok": false,
  "error": "Missing or invalid 'email' query parameter (e.g. ?email=user@domain.com)"
}
```

#### 500 Internal Server Error

```json
{
  "ok": false,
  "error": "Internal server error"
}
```

### Ví dụ

```bash
curl "https://your-domain.com/api/inbox?email=test@flux.shubh.sh"
```
