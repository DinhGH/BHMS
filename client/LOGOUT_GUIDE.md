# 📋 Hướng Dẫn Sử Dụng Logout Feature

## Tổng Quan
Chức năng logout đã được implement ở backend và frontend. Các thành viên khác có thể dễ dàng sử dụng nó.

---

## 1️⃣ Cách Sử Dụng Logout trong Component

### Option A: Sử dụng helper function (Recommended)

```jsx
import { useNavigate } from 'react-router-dom';
import { logout } from '../utils/authService';

const YourComponent = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout(navigate);
  };

  return (
    <button onClick={handleLogout}>
      Logout
    </button>
  );
};

export default YourComponent;
```

### Option B: Sử dụng trực tiếp (Nếu không muốn dùng helper)

```jsx
import { useNavigate } from 'react-router-dom';

const YourComponent = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Gọi API logout
      await fetch('http://localhost:5000/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      // Xóa token
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Chuyển hướng về login
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Vẫn xóa token ngay cả nếu lỗi
      localStorage.removeItem('token');
      navigate('/login');
    }
  };

  return (
    <button onClick={handleLogout}>
      Logout
    </button>
  );
};

export default YourComponent;
```

---

## 2️⃣ Hàm Helper Có Sẵn

File: `src/utils/authService.js`

### `logout(navigate)`
Logout user - xóa token và chuyển hướng về login
```javascript
await logout(navigate);
```

### `getToken()`
Lấy token hiện tại
```javascript
const token = getToken();
```

### `getCurrentUser()`
Lấy thông tin user hiện tại
```javascript
const user = getCurrentUser();
console.log(user.name, user.email, user.role);
```

### `isAuthenticated()`
Kiểm tra user có đang đăng nhập
```javascript
if (isAuthenticated()) {
  // User đã login
}
```

---

## 3️⃣ Ví Dụ Component Logout Button

```jsx
import { useNavigate } from 'react-router-dom';
import { logout, getCurrentUser } from '../utils/authService';

const Header = () => {
  const navigate = useNavigate();
  const user = getCurrentUser();

  return (
    <header>
      <div>Welcome, {user?.name}</div>
      <button onClick={() => logout(navigate)}>
        Logout
      </button>
    </header>
  );
};

export default Header;
```

---

## 4️⃣ API Endpoint

**POST** `/api/auth/logout`
- **Headers**: 
  - `Authorization: Bearer {token}`
  - `Content-Type: application/json`
- **Response**: 
  ```json
  {
    "message": "Logout successful"
  }
  ```

---

## ⚠️ Quan Trọng

1. **Luôn sử dụng `useNavigate` từ React Router** để chuyển hướng
2. **Token được lưu trong `localStorage` với key `token`**
3. **Khi logout, nên xóa cả `token` và `user` khỏi localStorage**
4. **Nếu API gặp lỗi, vẫn xóa token và chuyển hướng về login**

---

## 📁 File Structure
```
client/src/
├── utils/
│   └── authService.js    ← Helper functions
├── components/
│   └── Navbar.jsx        ← Ví dụ component
└── pages/
    └── Login.jsx         ← Login page
```

---

**Nếu có câu hỏi, liên hệ ban phát triển login!** ✅
