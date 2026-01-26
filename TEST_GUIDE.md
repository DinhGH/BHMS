# 🧪 Hướng Dẫn Kiểm Tra Tính Năng Đăng Ký & Đăng Nhập

## 📱 Truy Cập Ứng Dụng

1. Mở browser và truy cập: **http://localhost:5173**
2. Bạn sẽ được redirect tự động đến trang login

## ✅ Test Case 1: Đăng Ký Tài Khoản Mới

### Bước 1: Vào Trang Đăng Ký

- Click vào link "Sign up" phía dưới trang login

### Bước 2: Điền Form Đăng Ký

```
Email: testuser@example.com
Password: password123
Confirm Password: password123
```

### Bước 3: Submit Form

- Click nút "Sign up"
- Kỳ vọng:
  - ✅ Hiển thị message "Account created successfully!"
  - ✅ Redirect tự động đến trang dashboard
  - ✅ User được lưu vào localStorage

## ✅ Test Case 2: Đăng Nhập Tài Khoản

### Bước 1: Quay Lại Login

- Click link "Log in" từ trang register hoặc truy cập http://localhost:5173/login

### Bước 2: Điền Form Đăng Nhập

```
Email: testuser@example.com
Password: password123
```

### Bước 3: Submit

- Click nút "Log in"
- Kỳ vọng:
  - ✅ Redirect đến trang dashboard
  - ✅ Token được lưu vào localStorage

## ⚠️ Test Case 3: Validation Errors

### Test 3.1: Email Không Hợp Lệ

```
Email: invalidemail
Password: password123
Confirm Password: password123
```

- Kỳ vọng: **"Please enter a valid email address"**

### Test 3.2: Password Quá Ngắn

```
Email: test@example.com
Password: pass
Confirm Password: pass
```

- Kỳ vọng: **"Password must be at least 6 characters long"**

### Test 3.3: Password Không Khớp

```
Email: test@example.com
Password: password123
Confirm Password: password456
```

- Kỳ vọng: **"Passwords do not match"**

### Test 3.4: Email Đã Đăng Ký

```
Email: testuser@example.com  (đã dùng ở Test Case 1)
Password: password123
Confirm Password: password123
```

- Kỳ vọng: **"Email already registered"**

### Test 3.5: Thiếu Trường Bắt Buộc

- Click "Sign up" mà không điền email
- Kỳ vọng: **Button disabled (không thể click)**

## 🔐 Test Case 4: Show/Hide Password

### Test 4.1: Hiển Thị Password

- Ở trang register, click nút "Show" bên cạnh Password field
- Kỳ vọng:
  - ✅ Password hiển thị dạng text
  - ✅ Icon thay đổi từ "Show" thành "Hide"

### Test 4.2: Ẩn Password

- Click lại nút (giờ là "Hide")
- Kỳ vọng:
  - ✅ Password lại ẩn (\*\*\*\*)
  - ✅ Icon thay đổi lại thành "Show"

### Test 4.3: Riêng Lẻ

- Mỗi password field có toggle riêng
- Show password field không ảnh hưởng đến confirm password field

## 📝 Test Case 5: Responsiveness

### Desktop (1920x1080)

- Form layout chính giữa
- Tất cả elements responsive

### Tablet (768x1024)

- Form vẫn responsive
- Button vẫn click được

### Mobile (375x667)

- Form full width
- Input fields readable
- Button dễ click

## 💾 Test Case 6: LocalStorage

1. Đăng ký & đăng nhập thành công
2. Mở DevTools > Application > LocalStorage
3. Kiểm tra:
   - **token**: JWT string
   - **user**: JSON object với {id, email, role, fullName}
   - **rememberMe**: "true" (nếu checked remember me)

## 🔄 Test Case 7: Browser Refresh

### Bước 1: Đăng Nhập

- Làm theo Test Case 2

### Bước 2: Refresh Page (F5)

- Kỳ vọng:
  - ✅ Vẫn ở trang dashboard (không redirect về login)
  - ✅ AuthContext được restore từ localStorage

### Bước 3: Clear LocalStorage & Refresh

- Mở DevTools > Application > LocalStorage > Clear All
- Refresh page
- Kỳ vọng:
  - ✅ Redirect về login
  - ✅ User phải đăng nhập lại

## 🚫 Test Case 8: Access Protected Route

### Bước 1: Chưa Đăng Nhập

- Trực tiếp truy cập: http://localhost:5173/dashboard
- Kỳ vọng:
  - ✅ Redirect tự động về /login

### Bước 2: Đã Đăng Nhập

- Sau khi đăng nhập, truy cập /dashboard
- Kỳ vọng:
  - ✅ Hiển thị dashboard (Coming Soon message)

## 🌐 Test Case 9: Network Error

### Bước 1: Stop Server

- Dừng server (Ctrl+C ở terminal)

### Bước 2: Thử Đăng Ký

- Điền form & submit
- Kỳ vọng:
  - ✅ Error message: **"Connection error. Please check the server."**

### Bước 3: Restart Server

- `npm run dev` ở terminal server
- Form error message biến mất
- Có thể submit lại

## 🎨 UI Elements Check

### Login Page

- [ ] Header "Log in" visible
- [ ] Email input field
- [ ] Password input field with toggle
- [ ] Remember me checkbox
- [ ] Terms text với links
- [ ] Login button (disabled khi form trống)
- [ ] Forgot password link
- [ ] Sign up link
- [ ] Error message display (khi có error)

### Register Page

- [ ] Header "Create Account" + subtitle
- [ ] Email input field
- [ ] Password input field with toggle
- [ ] Confirm Password input field with toggle
- [ ] Terms text với links
- [ ] Sign up button (disabled khi form trống)
- [ ] Success message display
- [ ] Log in link
- [ ] Error message display

## 📊 Performance Check

### Page Load Time

- Login page: < 1s
- Register page: < 1s
- Dashboard: < 2s (sau đăng nhập)

### API Response Time

- POST /api/auth/register: < 1s
- POST /api/auth/login: < 1s

---

**Tất cả test case đều PASS ✅ = Feature hoàn chỉnh & sẵn sàng production**
