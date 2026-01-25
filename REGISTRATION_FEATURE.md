# BHMS - Đăng Ký & Đăng Nhập Hoàn Chỉnh

## 📋 Tính Năng Đã Thực Hiện

### ✅ Frontend (Client)

- **Login Component** (`client/src/pages/Login.jsx`)
  - Đăng nhập với email/password
  - Nút show/hide password
  - Remember me checkbox
  - Xử lý lỗi
  - Link đến trang đăng ký

- **Register Component** (`client/src/pages/Register.jsx`)
  - 3 trường: Email, Password, Confirm Password
  - Show/hide password toggle cho cả hai trường mật khẩu
  - Validation form đầy đủ:
    - Email không trống và hợp lệ
    - Password tối thiểu 6 ký tự
    - Confirm Password khớp với Password
  - Hiển thị error/success messages
  - Link quay lại trang đăng nhập

- **AuthContext** (`client/src/contexts/AuthContext.jsx`)
  - Quản lý trạng thái authentication
  - Lưu user và token vào localStorage
  - Hook useAuth để dùng ở các component

- **ProtectedRoute** (`client/src/components/ProtectedRoute.jsx`)
  - Bảo vệ các route yêu cầu authentication
  - Redirect về /login nếu chưa đăng nhập

- **API Client** (`client/src/services/api.js`)
  - Axios instance với base URL
  - Tự động thêm JWT token vào header

- **Auth Service** (`client/src/shared/utils/authService.js`)
  - `loginUser()` - Gọi API login
  - `registerUser()` - Gọi API register

### ✅ Backend (Server)

- **Auth Controller** (`server/controllers/authController.js`)
  - `register()` - Xử lý đăng ký user
    - Validate email, password, passwordConfirm
    - Kiểm tra email đã tồn tại
    - Hash password với bcryptjs
    - Tạo user mới với role TENANT
    - Tạo JWT token
  - `login()` - Xử lý đăng nhập user
    - Kiểm tra email tồn tại
    - So sánh password hash
    - Kiểm tra trạng thái tài khoản
    - Tạo JWT token

- **Auth Routes** (`server/routes/authRoutes.js`)
  - POST `/api/auth/register`
  - POST `/api/auth/login`

- **Server Setup** (`server/index.js`)
  - Cấu hình Express, CORS, JSON middleware
  - Mount auth routes
  - Chạy trên port 3000

### ✅ Database

- **Prisma Schema** (`server/prisma/schema.prisma`)
  - Model User với:
    - Email (unique)
    - PasswordHash
    - FullName
    - Provider (local/google/facebook)
    - Role (ADMIN/OWNER/TENANT)
    - Status (ACTIVE/BLOCKED)
    - Relationships với Owner/Tenant
  - Automatic timestamps (createdAt, updatedAt)

### ✅ Configuration

- **Backend .env** - `server/.env`
- **Frontend .env** - `client/.env`
- **Npm Packages**:
  - Server: bcryptjs, jsonwebtoken, @prisma/client, express, cors
  - Client: axios, react-router-dom, react, react-dom

## 🚀 Cách Chạy

### Start Backend

```bash
cd server
npm run dev
```

Server chạy trên: `http://localhost:3000`

### Start Frontend (tab khác)

```bash
cd client
npm run dev
```

Client chạy trên: `http://localhost:5173`

## 📡 API Endpoints

### POST `/api/auth/register`

**Request:**

```json
{
  "email": "user@example.com",
  "password": "password123",
  "passwordConfirm": "password123"
}
```

**Response (Success - 201):**

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "id": 1,
    "email": "user@example.com",
    "role": "TENANT",
    "fullName": null
  },
  "token": "eyJhbGc..."
}
```

**Response (Error - 400):**

```json
{
  "success": false,
  "message": "Email already registered"
}
```

### POST `/api/auth/login`

**Request:**

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (Success - 200):**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "id": 1,
    "email": "user@example.com",
    "role": "TENANT",
    "fullName": null
  },
  "token": "eyJhbGc..."
}
```

## 🔐 Security Features

- ✅ Password hashing với bcryptjs (10 salt rounds)
- ✅ JWT tokens (7 days expiration)
- ✅ CORS enabled
- ✅ Protected routes
- ✅ Token persisted in localStorage
- ✅ Token automatically sent with API requests

## 📁 Project Structure

```
client/
├── src/
│   ├── contexts/
│   │   └── AuthContext.jsx
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Login.css
│   │   ├── Register.jsx
│   │   ├── Register.css
│   │   └── OAuthCallback.jsx
│   ├── components/
│   │   └── ProtectedRoute.jsx
│   ├── services/
│   │   └── api.js
│   ├── shared/utils/
│   │   └── authService.js
│   ├── App.jsx
│   └── main.jsx
├── .env
└── package.json

server/
├── controllers/
│   └── authController.js
├── routes/
│   └── authRoutes.js
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── lib/
│   └── prisma.js
├── .env
├── index.js
└── package.json
```

## ✨ Tính Năng Bổ Sung

- Responsive design (mobile-friendly)
- Smooth animations & transitions
- Error message styling
- Success notification
- Form validation
- Loading states
- Accessibility features

---

**Status**: ✅ Hoàn Chỉnh & Sẵn Sàng Sử Dụng
