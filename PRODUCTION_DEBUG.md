# 🔥 Debug Production Error 500

## Lỗi hiện tại:
```
POST https://ezhome.website/api/auth/login 500 (Internal Server Error)
Response: {"message":"Server error"}
```

---

## 📋 Checklist Debug (làm theo thứ tự):

### ✅ **1. Test Health Endpoint**
```
https://ezhome.website/health
```

**Kết quả mong muốn:**
```json
{
  "status": "ok",
  "message": "Server is running",
  "database": "connected",  ← PHẢI là "connected"
  "timestamp": "2024-01-01T00:00:00.000Z",
  "env": "production"
}
```

**Nếu `"database": "disconnected"`** → Vấn đề DATABASE!

---

### ✅ **2. Kiểm tra Backend Logs**

**Cách xem logs tùy hosting:**

#### A. **VPS/Server riêng:**
```bash
# SSH vào server
ssh user@ezhome.website

# Xem logs
cd /path/to/backend
pm2 logs ezhome-backend
# hoặc
tail -f logs/error.log
# hoặc
journalctl -u ezhome-backend -f
```

#### B. **Heroku:**
```bash
heroku logs --tail --app your-app-name
```

#### C. **Vercel:**
Vào Dashboard → Project → Logs

#### D. **Railway/Render:**
Vào Dashboard → View Logs

**Tìm dòng log:**
```
Login error: Error: JWT_ACCESS_SECRET is not configured
```
hoặc
```
Login error: MongoServerError: ...
```

---

### ✅ **3. Kiểm tra Environment Variables**

**Backend production PHẢI có:**
```env
JWT_ACCESS_SECRET=abc123...
JWT_REFRESH_SECRET=xyz789...
MONGODB_URI=mongodb://...
NODE_ENV=production
```

#### Cách set tùy hosting:

**A. VPS/Server:**
File `.env` trong folder backend:
```bash
cd /path/to/backend
nano .env
# Paste nội dung
# Ctrl+X, Y, Enter để save
pm2 restart ezhome-backend
```

**B. Heroku:**
```bash
heroku config:set JWT_ACCESS_SECRET=abc123 --app your-app-name
heroku config:set JWT_REFRESH_SECRET=xyz789 --app your-app-name
heroku config:set MONGODB_URI=mongodb://... --app your-app-name
```

**C. Vercel:**
Dashboard → Project → Settings → Environment Variables

**D. Railway/Render:**
Dashboard → Variables → Add Variable

---

### ✅ **4. Kiểm tra Database Connection**

**A. MongoDB Atlas (Cloud):**
1. Vào MongoDB Atlas Dashboard
2. Check:
   - Cluster có đang chạy không?
   - IP Whitelist có server IP không? (hoặc 0.0.0.0/0 cho phép tất cả)
   - User/password đúng chưa?

**B. MongoDB Local trên VPS:**
```bash
# SSH vào server
systemctl status mongod
# hoặc
ps aux | grep mongod

# Test connection
mongosh mongodb://localhost:27017/ezhome
```

**C. Connection String đúng format:**
```
mongodb://localhost:27017/ezhome  (local)
mongodb+srv://user:pass@cluster.mongodb.net/ezhome  (Atlas)
mongodb://user:pass@host:27017/ezhome  (remote)
```

---

### ✅ **5. Test Register trước Login**

Có thể user chưa tồn tại. Test register:
```bash
curl -X POST https://ezhome.website/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123456",
    "name": "Test User"
  }'
```

**Kết quả OK:**
```json
{
  "message": "User registered successfully",
  "user": { "id": "...", "email": "test@example.com" }
}
```

Sau đó test login với user này.

---

### ✅ **6. CORS Configuration**

Kiểm tra `back-end/server.js`:
```javascript
const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = [
      "https://ezhome.website",        // ← PHẢI có domain frontend
      "https://www.ezhome.website",
      "http://localhost:3000",
    ];
    // ...
  }
};
```

---

### ✅ **7. Cookie Issues (Cloudflare)**

Vì site dùng Cloudflare (cf-ray header), có thể cookie bị block. Kiểm tra:

**File `back-end/controllers/auth.controller.js`:**
```javascript
res.cookie("refreshToken", refreshToken, {
  httpOnly: true,
  secure: true,           // ← PHẢI là true trên HTTPS
  sameSite: "none",       // ← Thay đổi từ "strict" thành "none" cho cross-domain
  maxAge: expiresInDays * 24 * 60 * 60 * 1000,
});
```

---

## 🚀 Quick Fix Script (chạy trên server)

```bash
#!/bin/bash
echo "=== EZ Home Production Debug ==="

# Check environment variables
echo "Checking .env file..."
if [ -f ".env" ]; then
  echo "✅ .env exists"
  grep -q "JWT_ACCESS_SECRET" .env && echo "✅ JWT_ACCESS_SECRET found" || echo "❌ JWT_ACCESS_SECRET missing"
  grep -q "JWT_REFRESH_SECRET" .env && echo "✅ JWT_REFRESH_SECRET found" || echo "❌ JWT_REFRESH_SECRET missing"
  grep -q "MONGODB_URI" .env && echo "✅ MONGODB_URI found" || echo "❌ MONGODB_URI missing"
else
  echo "❌ .env file not found!"
fi

# Check MongoDB
echo ""
echo "Checking MongoDB..."
systemctl is-active mongod && echo "✅ MongoDB running" || echo "❌ MongoDB not running"

# Check backend process
echo ""
echo "Checking Backend..."
pm2 list | grep ezhome && echo "✅ Backend running" || echo "❌ Backend not running"

# Test health endpoint
echo ""
echo "Testing /health endpoint..."
curl -s https://ezhome.website/health | jq '.'
```

---

## 📞 Common Issues & Solutions

### Issue 1: Database disconnected
```
"database": "disconnected"
```
**→ Fix:**
- Check `MONGODB_URI` trong `.env`
- Restart MongoDB: `systemctl restart mongod`
- Check IP whitelist (MongoDB Atlas)

### Issue 2: JWT not configured
Log: `JWT_ACCESS_SECRET is not configured`

**→ Fix:**
- Add to `.env`: `JWT_ACCESS_SECRET=your-secret-here`
- Restart backend: `pm2 restart ezhome-backend`

### Issue 3: User not found
Log: `Invalid credentials`

**→ Fix:**
- Register user trước: `POST /api/auth/register`
- Hoặc tạo user trong MongoDB trực tiếp

### Issue 4: Cloudflare blocking cookies
**→ Fix:**
Change cookie settings:
```javascript
sameSite: "none",
secure: true
```

---

## 🎯 Most Likely Cause

Dựa vào error pattern, **90% là một trong hai**:
1. **MONGODB_URI không set** → Database disconnected
2. **JWT secrets không set** → Cannot generate tokens

**→ Solution:** Set environment variables trên production server!

---

## ✅ Verification Steps

Sau khi fix:
1. ✅ `GET /health` → database: "connected"
2. ✅ Backend logs không có error
3. ✅ Test register → Success
4. ✅ Test login → Success
5. ✅ Frontend login hoạt động

---

## 📧 Cần trợ giúp?

Gửi các thông tin này:
1. Response từ `/health` endpoint
2. Backend logs (10 dòng cuối)
3. Hosting platform đang dùng (VPS/Heroku/Vercel/etc.)
4. Screenshot environment variables setup (che mất values)

