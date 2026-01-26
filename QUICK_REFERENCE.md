# ⚡ Quick Reference Guide

## 🎯 Live Server URLs

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **API Base**: http://localhost:3000/api

## 🚀 Quick Start (2 Terminal Windows)

### Terminal 1: Backend

```bash
cd z:\Express\BHMS\server
npm run dev
```

✅ Output: `Server running on port 3000`

### Terminal 2: Frontend

```bash
cd z:\Express\BHMS\client
npm run dev
```

✅ Output: `Local: http://localhost:5173/`

---

## 📋 User Registration Flow

1. Go to http://localhost:5173
2. Click "Sign up"
3. Fill in:
   - Email: `any@email.com`
   - Password: `password123`
   - Confirm: `password123`
4. Click "Sign up" button
5. ✅ Redirected to dashboard

---

## 🔐 User Login Flow

1. Go to http://localhost:5173 (or click "Log in" link)
2. Fill in:
   - Email: `any@email.com`
   - Password: `password123`
3. Click "Log in" button
4. ✅ Redirected to dashboard

---

## 🌐 Key Routes

| Route           | Purpose                       |
| --------------- | ----------------------------- |
| `/`             | Redirects to `/login`         |
| `/login`        | Login page                    |
| `/register`     | Register page                 |
| `/dashboard`    | Protected - shows after login |
| `/auth-success` | OAuth callback (not used)     |

---

## 💾 Important Files to Know

### Backend (3000)

```
server/
├── index.js ......................... Server entry point
├── controllers/authController.js .... Register & login logic
├── routes/authRoutes.js ............ API endpoints
├── prisma/schema.prisma ........... Database structure
└── .env ............................ Environment config
```

### Frontend (5173)

```
client/
├── src/
│   ├── pages/Login.jsx ............ Login form
│   ├── pages/Register.jsx ........ Register form (3 fields)
│   ├── contexts/AuthContext.jsx .. Auth state management
│   ├── components/ProtectedRoute.jsx ... Route protection
│   ├── services/api.js .......... API client setup
│   ├── shared/utils/authService.js . Login/register functions
│   └── App.jsx ................. Routes & providers
└── .env .......................... Frontend config
```

---

## 📡 API Endpoints

### Register

```
POST http://localhost:3000/api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "passwordConfirm": "password123"
}

Response:
{
  "success": true,
  "message": "User registered successfully",
  "data": { "id": 1, "email": "user@example.com", "role": "TENANT" },
  "token": "eyJ..."
}
```

### Login

```
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

Response:
{
  "success": true,
  "message": "Login successful",
  "data": { "id": 1, "email": "user@example.com", "role": "TENANT" },
  "token": "eyJ..."
}
```

---

## 🔍 Testing with Postman/Curl

### Register (Curl)

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email":"test@example.com",
    "password":"password123",
    "passwordConfirm":"password123"
  }'
```

### Login (Curl)

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email":"test@example.com",
    "password":"password123"
  }'
```

---

## 🧪 Form Validation Rules

### Email

- ✅ Must be valid email format
- ✅ Must be unique in database
- ❌ Cannot be empty

### Password

- ✅ Minimum 6 characters
- ✅ Must match passwordConfirm
- ✅ Cannot be empty
- ❌ No maximum length limit

### Confirm Password

- ✅ Must match password exactly
- ❌ Cannot be empty

---

## 🎨 UI Features

### Login Page

- Email/password inputs
- Password visibility toggle
- Remember me checkbox
- Forgot password link
- Sign up link
- Error messages

### Register Page

- Email input
- Password input with toggle
- Confirm password input with toggle
- Success/error messages
- Log in link
- All 3 fields required

---

## 🔑 Environment Variables

### Server (.env)

```env
DATABASE_URL="mysql://..."
JWT_SECRET="GOCSPX-..."
PORT=3000
```

### Client (.env)

```env
VITE_API_BASE_URL=http://localhost:3000/api
```

---

## 📚 Documentation Files

| File                    | Purpose                       |
| ----------------------- | ----------------------------- |
| SETUP.md                | Installation & setup guide    |
| REGISTRATION_FEATURE.md | Feature summary in Vietnamese |
| TEST_GUIDE.md           | How to test all features      |
| TECHNICAL_DOCS.md       | Deep technical details        |
| COMPLETION_REPORT.md    | What was implemented          |
| **QUICK_REFERENCE.md**  | **This file!**                |

---

## ⚠️ Common Issues & Solutions

### "Cannot connect to server"

```
Check: Is server running? (port 3000)
Fix: npm run dev in server folder
```

### "Email already registered"

```
Try: Use different email address
Or: Check database & clear if needed
```

### "Password must be at least 6 characters"

```
Use: password123 (or any 6+ char string)
```

### "Passwords do not match"

```
Check: Password and Confirm Password are identical
```

### "Blank page / Cannot find localhost:5173"

```
Check: Is client running? (port 5173)
Fix: npm run dev in client folder
```

### "Token not saved to localStorage"

```
Check: Browser localStorage enabled
Fix: Allow cookies/storage in browser settings
```

---

## 🔐 Security Notes

✅ **Passwords are NEVER stored**

- Only hashed versions stored (bcryptjs)
- Cannot recover original password

✅ **JWT tokens are SECURE**

- 7-day expiration
- Stored in localStorage
- Sent in API headers

✅ **Protected routes work**

- Only logged-in users access /dashboard
- Automatic redirect to /login if not authenticated

---

## 📊 Database Info

- **Provider**: MySQL
- **ORM**: Prisma
- **Tables**: User, Owner, Tenant, and more
- **Connection**: Via DATABASE_URL in .env

---

## ✨ What's Different from Login

### Register has:

1. **3 input fields** (email, password, confirm password)
2. **Password confirmation** validation
3. **Success message** on completion
4. **Auto role assignment** to TENANT
5. **Auto tenant record** creation

### Login has:

1. **2 input fields** (email, password)
2. **Remember me** checkbox
3. **Forgot password** link
4. **No confirmation** needed

---

## 🎯 Key Differences from Original Request

✅ **Removed**:

- Google OAuth integration
- Facebook OAuth integration

✅ **Added**:

- Full backend authentication system
- Prisma database integration
- JWT token management
- Complete form validation
- Password hashing
- Protected routes

✅ **No changes needed**:

- UI design (matches your mockup)
- Field names and layout
- Styling and responsiveness

---

## 📞 Support Files

- SETUP.md → How to run
- TEST_GUIDE.md → How to test
- TECHNICAL_DOCS.md → How it works
- COMPLETION_REPORT.md → What's done

Pick any document based on what you need!

---

**Status**: ✅ READY TO USE
**Both servers running**: ✅ YES
**Test it now**: http://localhost:5173
