# 🔧 Setup Environment Variables

## ⚠️ Lỗi 500 khi login?

Kiểm tra các vấn đề sau:

---

## 1️⃣ Tạo file `.env` trong folder `back-end/`

**File: `back-end/.env`**
```env
# Required - MUST HAVE these or login will fail!
JWT_ACCESS_SECRET=my-super-secret-access-key-12345
JWT_REFRESH_SECRET=my-super-secret-refresh-key-67890
JWT_ACCESS_EXPIRE=15m
JWT_REFRESH_EXPIRE_DAYS=7

# Database - MongoDB must be running
MONGODB_URI=mongodb://localhost:27017/ezhome

# Server
PORT=5000
NODE_ENV=development

# Optional - Only needed for Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
FRONTEND_URL=http://localhost:3000

# Optional - Only needed for image upload
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

---

## 2️⃣ Kiểm tra MongoDB có chạy không

### Windows:
```bash
# Cách 1: Chạy MongoDB service
net start MongoDB

# Cách 2: Chạy mongod trực tiếp
mongod
```

### macOS/Linux:
```bash
# Cách 1: Service
sudo systemctl start mongodb

# Cách 2: Direct
mongod --dbpath /path/to/data
```

### Test connection:
```bash
# Mở MongoDB shell
mongosh
# hoặc
mongo

# Nếu kết nối OK → Database đang chạy ✅
```

---

## 3️⃣ Kiểm tra Backend Console Logs

Khi chạy backend, xem logs:

### ✅ Logs tốt (Backend OK):
```
✅ MongoDB connected
Server running on port 5000
```

### ❌ Logs lỗi:

#### Lỗi 1: Missing JWT Secret
```
❌ Missing required environment variables: JWT_ACCESS_SECRET, JWT_REFRESH_SECRET
Please check your .env file
```
**→ Giải pháp:** Tạo file `.env` với JWT secrets

#### Lỗi 2: MongoDB Connection Error
```
❌ MongoDB connection error: MongooseServerSelectionError
```
**→ Giải pháp:** Khởi động MongoDB

#### Lỗi 3: Login Error
```
Login error: Error: JWT_ACCESS_SECRET is not configured
```
**→ Giải pháp:** Thêm `JWT_ACCESS_SECRET` vào `.env`

---

## 4️⃣ Test Login

### Test bằng Postman hoặc cURL:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "yourpassword"
  }'
```

### Response mong muốn:
```json
{
  "message": "Login successful",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "email": "test@example.com",
    "name": "Test User"
  }
}
```

---

## 5️⃣ Tạo User Test (nếu chưa có)

### Dùng Register endpoint:
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123456",
    "name": "Test User"
  }'
```

---

## ✅ Checklist Debug

- [ ] File `.env` đã tạo trong `back-end/`
- [ ] `JWT_ACCESS_SECRET` có trong `.env`
- [ ] `JWT_REFRESH_SECRET` có trong `.env`
- [ ] `MONGODB_URI` có trong `.env`
- [ ] MongoDB đang chạy (check bằng `mongosh` hoặc `mongo`)
- [ ] Backend console không có error
- [ ] Test `/health` endpoint: `curl http://localhost:5000/health`
- [ ] Test register trước khi test login

---

## 🚨 Quick Fix Script

Chạy script này để kiểm tra nhanh:

**File: `check-backend.sh`** (macOS/Linux)
```bash
#!/bin/bash
echo "=== Checking Backend Setup ==="
echo ""

# Check .env file
if [ -f ".env" ]; then
  echo "✅ .env file exists"
  if grep -q "JWT_ACCESS_SECRET" .env; then
    echo "✅ JWT_ACCESS_SECRET found"
  else
    echo "❌ JWT_ACCESS_SECRET missing"
  fi
else
  echo "❌ .env file not found"
fi

# Check MongoDB
if pgrep -x "mongod" > /dev/null; then
  echo "✅ MongoDB is running"
else
  echo "❌ MongoDB is not running"
fi

# Check backend
if curl -s http://localhost:5000/health > /dev/null; then
  echo "✅ Backend is running"
else
  echo "❌ Backend is not running"
fi
```

**File: `check-backend.ps1`** (Windows PowerShell)
```powershell
Write-Host "=== Checking Backend Setup ===" -ForegroundColor Cyan

# Check .env file
if (Test-Path ".env") {
    Write-Host "✅ .env file exists" -ForegroundColor Green
    if (Select-String -Path ".env" -Pattern "JWT_ACCESS_SECRET") {
        Write-Host "✅ JWT_ACCESS_SECRET found" -ForegroundColor Green
    } else {
        Write-Host "❌ JWT_ACCESS_SECRET missing" -ForegroundColor Red
    }
} else {
    Write-Host "❌ .env file not found" -ForegroundColor Red
}

# Check MongoDB
if (Get-Process mongod -ErrorAction SilentlyContinue) {
    Write-Host "✅ MongoDB is running" -ForegroundColor Green
} else {
    Write-Host "❌ MongoDB is not running" -ForegroundColor Red
}

# Check backend
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/health" -UseBasicParsing
    Write-Host "✅ Backend is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Backend is not running" -ForegroundColor Red
}
```

---

## 📞 Cần thêm trợ giúp?

1. Xem backend console logs
2. Copy full error message
3. Check MongoDB logs: `tail -f /var/log/mongodb/mongod.log`

