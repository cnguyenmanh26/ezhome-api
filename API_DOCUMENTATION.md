# Tài liệu API - EZHome Backend

## Mục lục

1. [Cấu hình chung](#1-cấu-hình-chung)
2. [Luồng xác thực (Authentication)](#2-luồng-xác-thực-authentication)
3. [Phân quyền (Authorization)](#3-phân-quyền-authorization)
4. [API Protected (Protected Endpoints)](#4-api-protected-protected-endpoints)
5. [API User (User Endpoints)](#5-api-user-user-endpoints)
6. [API Phòng Trọ (Room Endpoints)](#6-api-phòng-trọ-room-endpoints)
7. [API Đặt Chỗ (Booking Endpoints)](#7-api-đặt-chỗ-booking-endpoints)
8. [Mô hình dữ liệu (Data Models)](#8-mô-hình-dữ-liệu-data-models)
9. [Ví dụ tích hợp (Integration Examples)](#9-ví-dụ-tích-hợp-integration-examples)
10. [Tóm tắt nhanh (Quick Reference)](#10-tóm-tắt-nhanh-quick-reference)
11. [Liên hệ & Hỗ trợ](#11-liên-hệ--hỗ-trợ)

---

## 1. Cấu hình chung

### Base URL

```
Development: http://localhost:5000
Production: https://your-domain.com
```

### Authentication Header

Tất cả các API yêu cầu xác thực phải gửi kèm **Access Token** trong header:

```
Authorization: Bearer <access_token>
```

**Ví dụ:**
```http
GET /api/profile HTTP/1.1
Host: localhost:5000
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

### Content-Type

- **JSON requests**: `Content-Type: application/json`
- **File upload**: `Content-Type: multipart/form-data`

### Cookies

Backend sử dụng **HttpOnly cookies** để lưu trữ Refresh Token. Frontend không cần xử lý cookie này, trình duyệt sẽ tự động gửi kèm trong mọi request.

**Lưu ý:** Khi gọi API từ frontend, đảm bảo:
- `withCredentials: true` (Axios)
- `credentials: 'include'` (Fetch API)

---

## 2. Luồng xác thực (Authentication)

### 2.1. Đăng ký (Register)

**Endpoint:** `POST /api/auth/register`

**Yêu cầu:** Không cần xác thực

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "Nguyễn Văn A",
  "phone": "0987654321"
}
```

**Lưu ý:** Trường `phone` là **tùy chọn**.

**Response (201 Created):**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "name": "Nguyễn Văn A",
    "phone": "0987654321"
  }
}
```

**Lỗi (400 Bad Request):**
```json
{
  "message": "Email and password are required"
}
```

```json
{
  "message": "User already exists"
}
```

---

### 2.2. Đăng nhập (Login)

**Endpoint:** `POST /api/auth/login`

**Yêu cầu:** Không cần xác thực

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200 OK):**
```json
{
  "message": "Login successful",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "name": "Nguyễn Văn A",
    "phone": "0987654321"
  }
}
```

**Headers:**
```
Set-Cookie: refreshToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...; HttpOnly; Path=/; Max-Age=604800
```

**Lưu ý quan trọng:**
- `accessToken` được trả về trong JSON body → Frontend lưu vào localStorage/sessionStorage
- `refreshToken` được trả về trong HttpOnly cookie → Trình duyệt tự động quản lý
- Access Token có thời hạn ngắn (mặc định: 15 phút)
- Refresh Token có thời hạn dài (mặc định: 7 ngày)

**Lỗi (401 Unauthorized):**
```json
{
  "message": "Invalid credentials"
}
```

```json
{
  "message": "This account is linked to Google. Please use Google login."
}
```

---

### 2.3. Làm mới Token (Refresh Token)

**Endpoint:** `POST /api/auth/refresh-token`

**Yêu cầu:** Refresh Token (từ cookie hoặc body)

**Request Body (tùy chọn):**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Lưu ý:** Nếu refresh token được lưu trong cookie (HttpOnly), frontend **KHÔNG CẦN** gửi trong body. Backend sẽ tự động đọc từ cookie.

**Response (200 OK):**
```json
{
  "message": "Token refreshed successfully",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Lỗi (401 Unauthorized):**
```json
{
  "message": "Refresh token required"
}
```

```json
{
  "message": "Refresh token expired"
}
```

**Lỗi (403 Forbidden):**
```json
{
  "message": "Invalid refresh token"
}
```

```json
{
  "message": "Refresh token not found"
}
```

---

### 2.4. Đăng xuất (Logout)

**Endpoint:** `POST /api/auth/logout`

**Yêu cầu:** Refresh Token (từ cookie hoặc body)

**Request Body (tùy chọn):**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200 OK):**
```json
{
  "message": "Logout successful"
}
```

**Headers:**
```
Set-Cookie: refreshToken=; HttpOnly; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT
```

---

### 2.5. Đăng nhập bằng Google (Google OAuth)

**Luồng hoạt động:**

1. Frontend redirect user đến: `GET /api/auth/google`
2. Backend redirect user đến Google OAuth consent screen
3. User đồng ý và Google redirect về: `GET /api/auth/google/callback`
4. Backend xử lý và redirect về frontend với token trong URL

**Bước 1: Khởi tạo Google Login**

**Endpoint:** `GET /api/auth/google`

**Yêu cầu:** Không cần xác thực

**Cách sử dụng:**
```javascript
// Frontend: Redirect user đến endpoint này
window.location.href = 'http://localhost:5000/api/auth/google';
```

**Response:** Redirect 302 đến Google OAuth consent screen

---

**Bước 2: Callback từ Google**

**Endpoint:** `GET /api/auth/google/callback`

**Yêu cầu:** Google tự động gọi endpoint này (không cần frontend gọi trực tiếp)

**Response:** Redirect 302 về frontend với token trong URL:

```
http://localhost:3000/auth/callback?token=<access_token>&userId=<user_id>
```

**Xử lý ở Frontend:**
```javascript
// Trang /auth/callback
const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get('token');
const userId = urlParams.get('userId');
const error = urlParams.get('error');

if (error) {
  // Xử lý lỗi
  console.error('Auth error:', error);
} else if (token && userId) {
  // Lưu token
  localStorage.setItem('accessToken', token);
  localStorage.setItem('userId', userId);
  
  // Redirect đến dashboard
  window.location.href = '/dashboard';
}
```

**Lỗi:** Nếu có lỗi, backend redirect về:
```
http://localhost:3000/login?error=auth_failed
```

---

## 3. Phân quyền (Authorization)

### 3.1. Vai trò (Roles)

Hệ thống có 2 vai trò:

- **`user`**: Người dùng thông thường (mặc định khi đăng ký)
- **`admin`**: Quản trị viên (có quyền quản lý phòng trọ)

### 3.2. Mã lỗi (Error Codes)

#### 401 Unauthorized

**Nguyên nhân:**
- Chưa đăng nhập (không có token)
- Token hết hạn
- Token không hợp lệ
- User không tồn tại trong database

**Response:**
```json
{
  "message": "Unauthorized"
}
```

```json
{
  "message": "Token expired"
}
```

```json
{
  "message": "Invalid token"
}
```

```json
{
  "message": "User not found"
}
```

**Xử lý ở Frontend:**
- Xóa token khỏi localStorage
- Redirect user đến trang login

---

#### 403 Forbidden

**Nguyên nhân:**
- User đã đăng nhập nhưng không có quyền admin
- Refresh token không hợp lệ

**Response:**
```json
{
  "message": "Forbidden: Admin access required"
}
```

**Xử lý ở Frontend:**
- Hiển thị thông báo: "Bạn không có quyền truy cập"
- Có thể redirect về trang chủ hoặc hiển thị lỗi

---

### 3.3. Kiểm tra quyền Admin

Để kiểm tra user có phải admin không, frontend có thể:

1. **Gọi API `/api/dashboard`** và kiểm tra field `role` trong response
2. **Lưu role vào state/store** sau khi login thành công

**Ví dụ:**
```javascript
// Sau khi login thành công
const response = await authService.login(email, password);
const user = response.user;

// Kiểm tra role
if (user.role === 'admin') {
  // User là admin
} else {
  // User thông thường
}
```

---

## 4. API Protected (Protected Endpoints)

### 4.1. Lấy thông tin Profile (Get Profile)

**Endpoint:** `GET /api/profile`

**Yêu cầu:** ✅ Xác thực (Access Token)

**Response (200 OK):**
```json
{
  "message": "This is a protected route",
    "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Nguyễn Văn A",
    "email": "user@example.com",
    "phone": "0987654321",
    "googleId": null,
    "avatar": "https://example.com/avatar.jpg",
    "role": "user",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Lỗi (401 Unauthorized):**
```json
{
  "message": "Unauthorized"
}
```

---

### 4.2. Lấy thông tin Dashboard (Get Dashboard)

**Endpoint:** `GET /api/dashboard`

**Yêu cầu:** ✅ Xác thực (Access Token)

**Response (200 OK):**
```json
{
  "message": "Welcome to the dashboard",
  "userId": "507f1f77bcf86cd799439011",
  "email": "user@example.com",
  "role": "user"
}
```

**Lưu ý:** Endpoint này trả về `role` của user, có thể dùng để kiểm tra quyền admin ở frontend.

**Lỗi (401 Unauthorized):**
```json
{
  "message": "Unauthorized"
}
```

---

## 5. API User (User Endpoints)

### 5.1. Lấy danh sách user (Get All Users)

**Endpoint:** `GET /api/users`

**Yêu cầu:**
- ✅ Xác thực (Access Token)
- ✅ Quyền Admin

**Response (200 OK):**
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Nguyễn Văn A",
    "email": "user@example.com",
    "phone": "0987654321",
    "googleId": null,
    "avatar": "https://example.com/avatar.jpg",
    "role": "user",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

**Lưu ý:** Response không bao gồm field `password`.

**Lỗi (401 Unauthorized):**
```json
{
  "message": "Unauthorized"
}
```

**Lỗi (403 Forbidden):**
```json
{
  "message": "Forbidden: Admin access required"
}
```

---

### 5.2. Lấy thông tin user theo ID (Get User by ID)

**Endpoint:** `GET /api/users/:id`

**Yêu cầu:**
- ✅ Xác thực (Access Token)
- User chỉ có thể xem chính mình hoặc admin có thể xem tất cả

**Path Parameters:**
- `id` (string, required): ID của user

**Response (200 OK):**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "Nguyễn Văn A",
  "email": "user@example.com",
  "phone": "0987654321",
  "googleId": null,
  "avatar": "https://example.com/avatar.jpg",
  "role": "user",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

**Lỗi (401 Unauthorized):**
```json
{
  "message": "Unauthorized"
}
```

**Lỗi (403 Forbidden):**
```json
{
  "message": "Forbidden: You can only view your own profile"
}
```

**Lỗi (404 Not Found):**
```json
{
  "message": "User not found"
}
```

---

### 5.3. Tạo user mới (Create User)

**Endpoint:** `POST /api/users`

**Yêu cầu:**
- ✅ Xác thực (Access Token)
- ✅ Quyền Admin

**Lưu ý:** Endpoint này dành cho admin tạo user. Người dùng thông thường nên sử dụng `POST /api/auth/register`.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "Nguyễn Văn A",
  "phone": "0987654321",
  "role": "user"
}
```

**Response (201 Created):**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "Nguyễn Văn A",
  "email": "user@example.com",
  "phone": "0987654321",
  "role": "user",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

**Lỗi (401 Unauthorized):**
```json
{
  "message": "Unauthorized"
}
```

**Lỗi (403 Forbidden):**
```json
{
  "message": "Forbidden: Admin access required"
}
```

---

### 5.4. Cập nhật profile của chính mình (Update Own Profile)

**Endpoint:** `PUT /api/users/profile/update`

**Yêu cầu:**
- ✅ Xác thực (Access Token)

**Request Body:**
```json
{
  "name": "Nguyễn Văn B",
  "phone": "0912345678",
  "avatar": "https://example.com/new-avatar.jpg"
}
```

**Lưu ý:** Tất cả các fields đều **tùy chọn**. Chỉ gửi các fields muốn cập nhật. User chỉ có thể cập nhật `name`, `phone`, và `avatar` của chính mình.

**Response (200 OK):**
```json
{
  "message": "Profile updated successfully",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Nguyễn Văn B",
    "email": "user@example.com",
    "phone": "0912345678",
    "avatar": "https://example.com/new-avatar.jpg",
    "role": "user",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-02T00:00:00.000Z"
  }
}
```

**Lỗi (401 Unauthorized):**
```json
{
  "message": "Unauthorized"
}
```

**Lỗi (404 Not Found):**
```json
{
  "message": "User not found"
}
```

---

### 5.5. Cập nhật user (Update User) - Admin Only

**Endpoint:** `PUT /api/users/:id`

**Yêu cầu:**
- ✅ Xác thực (Access Token)
- ✅ Quyền Admin

**Path Parameters:**
- `id` (string, required): ID của user

**Request Body:**
```json
{
  "name": "Nguyễn Văn B",
  "email": "newemail@example.com",
  "phone": "0912345678",
  "role": "admin"
}
```

**Lưu ý:** Tất cả các fields đều **tùy chọn**. Chỉ gửi các fields muốn cập nhật.

**Response (200 OK):**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "Nguyễn Văn B",
  "email": "newemail@example.com",
  "phone": "0912345678",
  "role": "admin",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-02T00:00:00.000Z"
}
```

**Lỗi (401 Unauthorized):**
```json
{
  "message": "Unauthorized"
}
```

**Lỗi (403 Forbidden):**
```json
{
  "message": "Forbidden: Admin access required"
}
```

**Lỗi (404 Not Found):**
```json
{
  "message": "User not found"
}
```

---

### 5.6. Xóa user (Delete User)

**Endpoint:** `DELETE /api/users/:id`

**Yêu cầu:**
- ✅ Xác thực (Access Token)
- ✅ Quyền Admin

**Path Parameters:**
- `id` (string, required): ID của user

**Response (200 OK):**
```json
{
  "message": "User deleted successfully"
}
```

**Lỗi (401 Unauthorized):**
```json
{
  "message": "Unauthorized"
}
```

**Lỗi (403 Forbidden):**
```json
{
  "message": "Forbidden: Admin access required"
}
```

**Lỗi (404 Not Found):**
```json
{
  "message": "User not found"
}
```

---

## 6. API Phòng Trọ (Room Endpoints)

### 6.1. Lấy danh sách phòng (Get All Rooms)

**Endpoint:** `GET /api/rooms`

**Yêu cầu:** Public (không cần xác thực)

**Query Parameters (Tùy chọn):**

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `city` | string | Lọc theo thành phố | `city=Hà Nội` |
| `district` | string | Lọc theo quận/huyện | `district=Cầu Giấy` |
| `minPrice` | number | Giá thuê tối thiểu (VND) | `minPrice=2000000` |
| `maxPrice` | number | Giá thuê tối đa (VND) | `maxPrice=4000000` |

**Lưu ý:** Tất cả các query parameters đều **tùy chọn**. Có thể kết hợp nhiều filter cùng lúc.

**Ví dụ URL:**
```
GET /api/rooms?city=Hà Nội&district=Cầu Giấy&minPrice=2000000&maxPrice=4000000
```

**Ví dụ sử dụng với Axios:**
```javascript
// Lấy tất cả phòng
const response = await axios.get('/api/rooms');

// Lọc theo thành phố
const response = await axios.get('/api/rooms?city=Hà Nội');

// Lọc theo giá thuê
const response = await axios.get('/api/rooms?minPrice=2000000&maxPrice=4000000');

// Kết hợp nhiều filter
const response = await axios.get('/api/rooms', {
  params: {
    city: 'Hà Nội',
    district: 'Cầu Giấy',
    minPrice: 2000000,
    maxPrice: 4000000
  }
});
```

**Response (200 OK):**
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "title": "Phòng trọ đẹp tại Cầu Giấy",
    "description": "Phòng trọ rộng rãi, thoáng mát",
    "rentPrice": 3000000,
    "area": 25,
    "media": {
      "images": [
        {
          "url": "https://res.cloudinary.com/...",
          "public_id": "ezhome/rooms/abc123"
        }
      ],
      "videos": [
        {
          "url": "https://res.cloudinary.com/...",
          "public_id": "ezhome/rooms/video123"
        }
      ],
      "link360": "https://example.com/360-view"
    },
    "address": {
      "city": "Hà Nội",
      "district": "Cầu Giấy",
      "street": "Dương Quảng Hàm"
    },
    "utilities": {
      "furnitureDetails": "Đầy đủ nội thất",
      "electricityCost": 3500,
      "waterCost": 20000,
      "wifiCost": 100000,
      "parkingCost": 0
    },
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

**Lỗi (500 Internal Server Error):**
```json
{
  "message": "Server error"
}
```

---

### 6.2. Lấy thông tin phòng theo ID (Get Room by ID)

**Endpoint:** `GET /api/rooms/:id`

**Yêu cầu:** Public (không cần xác thực)

**Path Parameters:**
- `id` (string, required): ID của phòng

**Response (200 OK):**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "title": "Phòng trọ đẹp tại Cầu Giấy",
  "description": "Phòng trọ rộng rãi, thoáng mát",
  "rentPrice": 3000000,
  "area": 25,
  "media": {
    "images": [...],
    "videos": [...],
    "link360": "https://example.com/360-view"
  },
  "address": {
    "city": "Hà Nội",
    "district": "Cầu Giấy",
    "street": "Dương Quảng Hàm"
  },
  "utilities": {
    "furnitureDetails": "Đầy đủ nội thất",
    "electricityCost": 3500,
    "waterCost": 20000,
    "wifiCost": 100000,
    "parkingCost": 0
  },
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

**Lỗi (404 Not Found):**
```json
{
  "message": "Room not found"
}
```

---

### 6.3. Tạo phòng mới (Create Room)

**Endpoint:** `POST /api/rooms`

**Yêu cầu:** 
- ✅ Xác thực (Access Token)
- ✅ Quyền Admin

**Content-Type:** `multipart/form-data`

**⚠️ QUAN TRỌNG:** Đây là request `multipart/form-data`, KHÔNG phải JSON!

**Form Data Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | ✅ | Tiêu đề phòng |
| `rentPrice` | number | ✅ | Giá thuê (VND) |
| `area` | number | ✅ | Diện tích (m²) |
| `city` | string | ✅ | Thành phố |
| `district` | string | ✅ | Quận/Huyện |
| `street` | string | ✅ | Đường/Phố |
| `description` | string | ❌ | Mô tả phòng |
| `link360` | string | ❌ | Link 360 độ view |
| `furnitureDetails` | string | ❌ | Chi tiết nội thất |
| `electricityCost` | number | ❌ | Giá điện (VND/kWh) |
| `waterCost` | number | ❌ | Giá nước (VND/tháng) |
| `wifiCost` | number | ❌ | Giá wifi (VND/tháng) |
| `parkingCost` | number | ❌ | Giá gửi xe (VND/tháng) |
| `images` | file[] | ❌ | Mảng file ảnh (tối đa 10 file) |
| `videos` | file[] | ❌ | Mảng file video (tối đa 2 file) |

**Ví dụ sử dụng với Axios:**

```javascript
const formData = new FormData();

// Text fields
formData.append('title', 'Phòng trọ đẹp tại Cầu Giấy');
formData.append('description', 'Phòng trọ rộng rãi, thoáng mát');
formData.append('rentPrice', '3000000');
formData.append('area', '25');
formData.append('city', 'Hà Nội');
formData.append('district', 'Cầu Giấy');
formData.append('street', 'Dương Quảng Hàm');
formData.append('link360', 'https://example.com/360-view');
formData.append('furnitureDetails', 'Đầy đủ nội thất');
formData.append('electricityCost', '3500');
formData.append('waterCost', '20000');
formData.append('wifiCost', '100000');
formData.append('parkingCost', '0');

// Image files
const imageFiles = [file1, file2, file3]; // File objects
imageFiles.forEach((file) => {
  formData.append('images', file);
});

// Video files
const videoFiles = [video1]; // File objects
videoFiles.forEach((file) => {
  formData.append('videos', file);
});

// Gửi request
const response = await axios.post('/api/rooms', formData, {
  headers: {
    'Content-Type': 'multipart/form-data',
    'Authorization': `Bearer ${accessToken}`
  }
});
```

**Ví dụ sử dụng với Fetch API:**

```javascript
const formData = new FormData();

// Text fields
formData.append('title', 'Phòng trọ đẹp tại Cầu Giấy');
formData.append('rentPrice', '3000000');
formData.append('area', '25');
formData.append('city', 'Hà Nội');
formData.append('district', 'Cầu Giấy');
formData.append('street', 'Dương Quảng Hàm');

// Image files
imageFiles.forEach((file) => {
  formData.append('images', file);
});

// Video files
videoFiles.forEach((file) => {
  formData.append('videos', file);
});

// Gửi request
const response = await fetch('http://localhost:5000/api/rooms', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`
    // KHÔNG set Content-Type, browser sẽ tự động set với boundary
  },
  body: formData,
  credentials: 'include'
});
```

**Response (201 Created):**
```json
{
  "message": "Room created successfully",
  "room": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "Phòng trọ đẹp tại Cầu Giấy",
    "description": "Phòng trọ rộng rãi, thoáng mát",
    "rentPrice": 3000000,
    "area": 25,
    "media": {
      "images": [
        {
          "url": "https://res.cloudinary.com/...",
          "public_id": "ezhome/rooms/abc123"
        }
      ],
      "videos": [
        {
          "url": "https://res.cloudinary.com/...",
          "public_id": "ezhome/rooms/video123"
        }
      ],
      "link360": "https://example.com/360-view"
    },
    "address": {
      "city": "Hà Nội",
      "district": "Cầu Giấy",
      "street": "Dương Quảng Hàm"
    },
    "utilities": {
      "furnitureDetails": "Đầy đủ nội thất",
      "electricityCost": 3500,
      "waterCost": 20000,
      "wifiCost": 100000,
      "parkingCost": 0
    },
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Lỗi (400 Bad Request):**
```json
{
  "message": "Title, rentPrice, area, city, district, and street are required"
}
```

**Lỗi (401 Unauthorized):**
```json
{
  "message": "Unauthorized"
}
```

**Lỗi (403 Forbidden):**
```json
{
  "message": "Forbidden: Admin access required"
}
```

**Lỗi (500 Internal Server Error):**
```json
{
  "message": "Server error"
}
```

**Lưu ý về File Upload:**
- **Images**: Tối đa 10 file, định dạng: jpg, jpeg, png, webp
- **Videos**: Tối đa 2 file, định dạng: mp4, mov, avi, webm
- **Kích thước tối đa**: 50MB mỗi file
- Files sẽ được upload lên Cloudinary và trả về URL trong response

---

### 6.4. Cập nhật phòng (Update Room)

**Endpoint:** `PUT /api/rooms/:id`

**Yêu cầu:**
- ✅ Xác thực (Access Token)
- ✅ Quyền Admin

**Content-Type:** `application/json`

**Path Parameters:**
- `id` (string, required): ID của phòng

**Request Body:**
```json
{
  "title": "Phòng trọ đẹp tại Cầu Giấy (Đã cập nhật)",
  "description": "Mô tả mới",
  "rentPrice": 3500000,
  "area": 30,
  "link360": "https://example.com/new-360-view",
  "city": "Hà Nội",
  "district": "Cầu Giấy",
  "street": "Dương Quảng Hàm",
  "furnitureDetails": "Nội thất mới",
  "electricityCost": 4000,
  "waterCost": 25000,
  "wifiCost": 120000,
  "parkingCost": 50000
}
```

**Lưu ý:** Tất cả các fields đều **tùy chọn**. Chỉ gửi các fields muốn cập nhật.

**Response (200 OK):**
```json
{
  "message": "Room updated successfully",
  "room": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "Phòng trọ đẹp tại Cầu Giấy (Đã cập nhật)",
    "description": "Mô tả mới",
    "rentPrice": 3500000,
    "area": 30,
    "media": {
      "images": [...],
      "videos": [...],
      "link360": "https://example.com/new-360-view"
    },
    "address": {
      "city": "Hà Nội",
      "district": "Cầu Giấy",
      "street": "Dương Quảng Hàm"
    },
    "utilities": {
      "furnitureDetails": "Nội thất mới",
      "electricityCost": 4000,
      "waterCost": 25000,
      "wifiCost": 120000,
      "parkingCost": 50000
    },
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-02T00:00:00.000Z"
  }
}
```

**Lỗi (404 Not Found):**
```json
{
  "message": "Room not found"
}
```

**Lỗi (401 Unauthorized):**
```json
{
  "message": "Unauthorized"
}
```

**Lỗi (403 Forbidden):**
```json
{
  "message": "Forbidden: Admin access required"
}
```

---

### 6.5. Xóa phòng (Delete Room)

**Endpoint:** `DELETE /api/rooms/:id`

**Yêu cầu:**
- ✅ Xác thực (Access Token)
- ✅ Quyền Admin

**Path Parameters:**
- `id` (string, required): ID của phòng

**Response (200 OK):**
```json
{
  "message": "Room deleted successfully"
}
```

**Lưu ý:** Khi xóa phòng, backend sẽ tự động xóa tất cả ảnh/video liên quan trên Cloudinary.

**Lỗi (404 Not Found):**
```json
{
  "message": "Room not found"
}
```

**Lỗi (401 Unauthorized):**
```json
{
  "message": "Unauthorized"
}
```

**Lỗi (403 Forbidden):**
```json
{
  "message": "Forbidden: Admin access required"
}
```

---

## 7. API Đặt Chỗ (Booking Endpoints)

### 7.1. Tạo đặt chỗ (Create Booking)

**Endpoint:** `POST /api/bookings`

**Yêu cầu:**
- ✅ Xác thực (Access Token)
- ✅ Quyền User

**Lưu ý:** Endpoint này tạo booking với trạng thái `pending`. Sau khi tạo thành công, frontend sẽ hiển thị QR code để người dùng chuyển khoản. Admin sẽ kiểm tra và cập nhật trạng thái sau.

**Request Body:**
```json
{
  "roomId": "507f1f77bcf86cd799439011"
}
```

**Response (201 Created):**
```json
{
  "message": "Booking created successfully",
  "booking": {
    "_id": "507f1f77bcf86cd799439012",
    "user": "507f1f77bcf86cd799439010",
    "room": {
      "_id": "507f1f77bcf86cd799439011",
      "title": "Phòng trọ đẹp tại Cầu Giấy",
      "rentPrice": 3000000,
      "area": 25,
      "address": {
        "city": "Hà Nội",
        "district": "Cầu Giấy",
        "street": "Dương Quảng Hàm"
      }
    },
    "totalAmount": 3000000,
    "status": "pending",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Lỗi (400 Bad Request):**
```json
{
  "message": "roomId is required"
}
```

**Lỗi (401 Unauthorized):**
```json
{
  "message": "Unauthorized"
}
```

**Lỗi (403 Forbidden):**
```json
{
  "message": "Forbidden: Access restricted to user"
}
```

**Lỗi (404 Not Found):**
```json
{
  "message": "Room not found"
}
```

---

### 7.2. Lấy danh sách đặt chỗ của tôi (Get My Bookings)

**Endpoint:** `GET /api/bookings/my-bookings`

**Yêu cầu:**
- ✅ Xác thực (Access Token)
- ✅ Quyền User

**Response (200 OK):**
```json
[
  {
    "_id": "507f1f77bcf86cd799439012",
    "user": "507f1f77bcf86cd799439010",
    "room": {
      "_id": "507f1f77bcf86cd799439011",
      "title": "Phòng trọ đẹp tại Cầu Giấy",
      "rentPrice": 3000000,
      "area": 25,
      "address": {
        "city": "Hà Nội",
        "district": "Cầu Giấy",
        "street": "Dương Quảng Hàm"
      }
    },
    "totalAmount": 3000000,
    "status": "pending",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  {
    "_id": "507f1f77bcf86cd799439013",
    "user": "507f1f77bcf86cd799439010",
    "room": {
      "_id": "507f1f77bcf86cd799439014",
      "title": "Phòng trọ giá rẻ tại Ba Đình",
      "rentPrice": 2500000,
      "area": 20
    },
    "totalAmount": 2500000,
    "status": "completed",
    "createdAt": "2024-01-02T00:00:00.000Z",
    "updatedAt": "2024-01-03T00:00:00.000Z"
  }
]
```

**Lỗi (401 Unauthorized):**
```json
{
  "message": "Unauthorized"
}
```

**Lỗi (403 Forbidden):**
```json
{
  "message": "Forbidden: Access restricted to user"
}
```

---

### 7.3. Lấy tất cả đặt chỗ (Get All Bookings) - Admin Only

**Endpoint:** `GET /api/bookings/all`

**Yêu cầu:**
- ✅ Xác thực (Access Token)
- ✅ Quyền Admin

**Lưu ý:** Endpoint này dành cho admin để xem tất cả booking và quản lý trạng thái thanh toán.

**Response (200 OK):**
```json
[
  {
    "_id": "507f1f77bcf86cd799439012",
    "user": {
      "_id": "507f1f77bcf86cd799439010",
      "name": "Nguyễn Văn A",
      "email": "user@example.com",
      "role": "user"
    },
    "room": {
      "_id": "507f1f77bcf86cd799439011",
      "title": "Phòng trọ đẹp tại Cầu Giấy",
      "rentPrice": 3000000,
      "area": 25
    },
    "totalAmount": 3000000,
    "status": "pending",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  {
    "_id": "507f1f77bcf86cd799439013",
    "user": {
      "_id": "507f1f77bcf86cd799439015",
      "name": "Trần Thị B",
      "email": "user2@example.com",
      "role": "user"
    },
    "room": {
      "_id": "507f1f77bcf86cd799439014",
      "title": "Phòng trọ giá rẻ tại Ba Đình",
      "rentPrice": 2500000,
      "area": 20
    },
    "totalAmount": 2500000,
    "status": "completed",
    "createdAt": "2024-01-02T00:00:00.000Z",
    "updatedAt": "2024-01-03T00:00:00.000Z"
  }
]
```

**Lỗi (401 Unauthorized):**
```json
{
  "message": "Unauthorized"
}
```

**Lỗi (403 Forbidden):**
```json
{
  "message": "Forbidden: Access restricted to admin"
}
```

---

### 7.4. Cập nhật trạng thái đặt chỗ (Update Booking Status) - Admin Only

**Endpoint:** `PUT /api/bookings/status/:id`

**Yêu cầu:**
- ✅ Xác thực (Access Token)
- ✅ Quyền Admin

**Lưu ý:** Admin sử dụng endpoint này để cập nhật trạng thái booking sau khi kiểm tra thanh toán:
- `pending` → `completed`: Đã xác nhận thanh toán
- `pending` → `cancelled`: Hủy đặt chỗ

**Path Parameters:**
- `id` (string, required): ID của booking

**Request Body:**
```json
{
  "status": "completed"
}
```

**Response (200 OK):**
```json
{
  "message": "Booking status updated successfully",
  "booking": {
    "_id": "507f1f77bcf86cd799439012",
    "user": {
      "_id": "507f1f77bcf86cd799439010",
      "name": "Nguyễn Văn A",
      "email": "user@example.com",
      "role": "user"
    },
    "room": {
      "_id": "507f1f77bcf86cd799439011",
      "title": "Phòng trọ đẹp tại Cầu Giấy",
      "rentPrice": 3000000,
      "area": 25
    },
    "totalAmount": 3000000,
    "status": "completed",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-03T00:00:00.000Z"
  }
}
```

**Lỗi (400 Bad Request):**
```json
{
  "message": "status is required"
}
```

```json
{
  "message": "status must be one of: pending, completed, cancelled"
}
```

**Lỗi (401 Unauthorized):**
```json
{
  "message": "Unauthorized"
}
```

**Lỗi (403 Forbidden):**
```json
{
  "message": "Forbidden: Access restricted to admin"
}
```

**Lỗi (404 Not Found):**
```json
{
  "message": "Booking not found"
}
```

**Luồng hoạt động:**
1. User tạo booking → `status: 'pending'`
2. Frontend hiển thị QR code để user chuyển khoản
3. Admin đăng nhập, xem danh sách booking `pending` tại `/api/bookings/all`
4. Admin kiểm tra tài khoản ngân hàng
5. Admin cập nhật status:
   - Nếu đã thanh toán: `PUT /api/bookings/status/:id` với `{ "status": "completed" }`
     - **Backend tự động cập nhật Room status từ "inactive" → "active"**
   - Nếu hủy: `PUT /api/bookings/status/:id` với `{ "status": "cancelled" }`

**⚠️ Lưu ý về Room Status:**
- Khi booking được chuyển sang `completed`, phòng tương ứng sẽ **tự động** chuyển status từ `inactive` → `active`
- Các phòng có status `active` sẽ **không hiển thị** trên trang danh sách phòng cho user
- Admin có thể thủ công thay đổi room status trong trang quản lý phòng

---

## 8. Mô hình dữ liệu (Data Models)

### 8.1. User Model

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "Nguyễn Văn A",
  "email": "user@example.com",
  "phone": "0987654321", // null nếu không có
  "password": "hashed_password", // Không bao giờ trả về trong API
  "googleId": "102167505131672003202", // null nếu không login bằng Google
  "avatar": "https://example.com/avatar.jpg", // null nếu không có
  "role": "user", // "user" hoặc "admin"
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

**Lưu ý:**
- `password` không bao giờ được trả về trong API response
- `phone` là trường tùy chọn, có thể null nếu user không cung cấp
- `googleId` chỉ có giá trị nếu user đăng nhập bằng Google
- `role` mặc định là `"user"` khi đăng ký mới

---

### 8.2. Room Model

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "title": "Phòng trọ đẹp tại Cầu Giấy",
  "description": "Phòng trọ rộng rãi, thoáng mát",
  "rentPrice": 3000000,
  "area": 25,
  "media": {
    "images": [
      {
        "url": "https://res.cloudinary.com/cloud_name/image/upload/v1234567890/ezhome/rooms/abc123.jpg",
        "public_id": "ezhome/rooms/abc123"
      }
    ],
    "videos": [
      {
        "url": "https://res.cloudinary.com/cloud_name/video/upload/v1234567890/ezhome/rooms/video123.mp4",
        "public_id": "ezhome/rooms/video123"
      }
    ],
    "link360": "https://example.com/360-view"
  },
  "address": {
    "city": "Hà Nội",
    "district": "Cầu Giấy",
    "street": "Dương Quảng Hàm"
  },
  "utilities": {
    "furnitureDetails": "Đầy đủ nội thất",
    "electricityCost": 3500,
    "waterCost": 20000,
    "wifiCost": 100000,
    "parkingCost": 0
  },
  "status": "inactive",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

**Giải thích các fields:**

- **`title`** (string, required): Tiêu đề phòng
- **`description`** (string, optional): Mô tả chi tiết
- **`rentPrice`** (number, required): Giá thuê (VND)
- **`area`** (number, required): Diện tích (m²)
- **`media.images`** (array): Mảng các object chứa `url` và `public_id` của ảnh
- **`media.videos`** (array): Mảng các object chứa `url` và `public_id` của video
- **`media.link360`** (string, optional): Link 360 độ view
- **`address.city`** (string, required): Thành phố
- **`address.district`** (string, required): Quận/Huyện
- **`address.street`** (string, required): Đường/Phố
- **`utilities.furnitureDetails`** (string, optional): Chi tiết nội thất
- **`utilities.electricityCost`** (number, default: 0): Giá điện (VND/kWh)
- **`utilities.waterCost`** (number, default: 0): Giá nước (VND/tháng)
- **`utilities.wifiCost`** (number, default: 0): Giá wifi (VND/tháng)
- **`utilities.parkingCost`** (number, default: 0): Giá gửi xe (VND/tháng)
- **`status`** (string, enum: ["inactive", "active"], default: "inactive"): Trạng thái phòng
  - `inactive`: Phòng còn trống (hiển thị cho user)
  - `active`: Phòng đã được thuê (tự động chuyển khi booking completed)

---

### 8.3. Booking Model

```json
{
  "_id": "507f1f77bcf86cd799439012",
  "user": "507f1f77bcf86cd799439010",
  "room": "507f1f77bcf86cd799439011",
  "totalAmount": 3000000,
  "status": "pending",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

**Giải thích các fields:**
- **`user`** (ObjectId, required): ID của user đặt chỗ (ref: 'User')
- **`room`** (ObjectId, required): ID của phòng được đặt (ref: 'Room')
- **`totalAmount`** (number, required): Tổng số tiền tại thời điểm đặt (sao chép từ `room.rentPrice`)
- **`status`** (string, enum: ['pending', 'completed', 'cancelled'], default: 'pending'): Trạng thái đặt chỗ
  - `pending`: Đang chờ thanh toán
  - `completed`: Đã thanh toán thành công
  - `cancelled`: Đã hủy
- **`createdAt`** (date-time): Thời gian tạo booking
- **`updatedAt`** (date-time): Thời gian cập nhật lần cuối

---

## 9. Ví dụ tích hợp (Integration Examples)

### 9.1. Axios Setup

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Quan trọng: để gửi cookie
});

// Interceptor để thêm token vào mọi request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor để xử lý lỗi 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token hết hạn, thử refresh
      try {
        const { data } = await axios.post(
          'http://localhost:5000/api/auth/refresh-token',
          {},
          { withCredentials: true }
        );
        localStorage.setItem('accessToken', data.accessToken);
        // Retry request với token mới
        error.config.headers.Authorization = `Bearer ${data.accessToken}`;
        return axios.request(error.config);
      } catch (refreshError) {
        // Refresh thất bại, redirect đến login
        localStorage.removeItem('accessToken');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
```

### 9.2. Fetch API Setup

```javascript
const API_BASE_URL = 'http://localhost:5000';

async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('accessToken');
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include', // Quan trọng: để gửi cookie
  });
  
  if (response.status === 401) {
    // Token hết hạn, thử refresh
    const refreshResponse = await fetch(`${API_BASE_URL}/api/auth/refresh-token`, {
      method: 'POST',
      credentials: 'include',
    });
    
    if (refreshResponse.ok) {
      const { accessToken } = await refreshResponse.json();
      localStorage.setItem('accessToken', accessToken);
      // Retry request với token mới
      headers.Authorization = `Bearer ${accessToken}`;
      return fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
        credentials: 'include',
      });
    } else {
      // Refresh thất bại, redirect đến login
      localStorage.removeItem('accessToken');
      window.location.href = '/login';
    }
  }
  
  return response;
}
```

---

## 10. Tóm tắt nhanh (Quick Reference)

### Endpoints Public (Không cần xác thực)

- `POST /api/auth/register` - Đăng ký
- `POST /api/auth/login` - Đăng nhập
- `GET /api/auth/google` - Khởi tạo Google Login
- `GET /api/rooms` - Lấy danh sách phòng
- `GET /api/rooms/:id` - Lấy thông tin phòng

### Endpoints Yêu cầu Xác thực

- `POST /api/auth/refresh-token` - Làm mới token
- `POST /api/auth/logout` - Đăng xuất
- `GET /api/profile` - Lấy thông tin profile
- `GET /api/dashboard` - Lấy thông tin dashboard
- `GET /api/users/:id` - Lấy thông tin user (chỉ xem chính mình hoặc admin)
- `PUT /api/users/profile/update` - Cập nhật profile của chính mình

### Endpoints Yêu cầu Quyền User

- `POST /api/bookings` - Tạo đặt chỗ
- `GET /api/bookings/my-bookings` - Lấy danh sách đặt chỗ của tôi

### Endpoints Yêu cầu Quyền Admin

- `GET /api/users` - Lấy danh sách user
- `POST /api/users` - Tạo user mới
- `PUT /api/users/:id` - Cập nhật user
- `DELETE /api/users/:id` - Xóa user
- `POST /api/rooms` - Tạo phòng (multipart/form-data)
- `PUT /api/rooms/:id` - Cập nhật phòng
- `DELETE /api/rooms/:id` - Xóa phòng
- `GET /api/bookings/all` - Lấy tất cả đặt chỗ
- `PUT /api/bookings/status/:id` - Cập nhật trạng thái đặt chỗ

---

## 11. Liên hệ & Hỗ trợ

Nếu có thắc mắc hoặc gặp vấn đề khi tích hợp API, vui lòng liên hệ đội Backend.

**Swagger Documentation:** `http://localhost:5000/api-docs`

---

*Tài liệu này được cập nhật lần cuối: 2024-01-01*

