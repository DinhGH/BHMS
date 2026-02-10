## BHMS - Boarding House Management System

### Project Setup Instructions

#### Prerequisites

- Node.js (v16 or higher)
- npm (v7 or higher)
- MySQL Database

#### Environment Configuration

##### Server (.env)

The server `.env` file is already configured with the following settings:

```env
DATABASE_URL="mysql://root:WhCdOVBMQYdebCiLACFurkHFNcviHzRF@mainline.proxy.rlwy.net:34064/bhms"
JWT_SECRET="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"
CLOUDINARY_CLOUD_NAME=dfez8v1fj
CLOUDINARY_API_KEY=284116546926161
CLOUDINARY_API_SECRET=pDkpabnpQVTSdivXj67sckBXhCg
PORT=3000
EMAIL_USER=huynhtandinh2707@gmail.com
EMAIL_PASS=fwne muif zzod mfjz
```

##### Client (.env)

The client `.env` file is configured to connect to the server:

```env
VITE_API_BASE_URL=http://localhost:3000/api
```

#### Database Setup

1. Ensure your MySQL database is running and accessible
2. Run Prisma migrations:

```bash
cd server
npx prisma migrate deploy
```

#### Installation & Running

##### Server

```bash
cd server
npm install
npm run dev  # For development with hot reload
# or
npm start    # For production
```

The server will run on `http://localhost:3000`

##### Client

```bash
cd client
npm install
npm run dev   # For development
# or
npm run build # For production build
```

The client will run on `http://localhost:5173` (default Vite port)

### Features Implemented

#### Authentication

- **Login**: Email/password authentication with JWT tokens
- **Registration**: New user signup with email validation and password confirmation
  - Email must be unique
  - Password must be at least 6 characters
  - Passwords must match

#### Components

- `Login.jsx` - Login form with show/hide password toggle
- `Register.jsx` - Registration form with 3 fields:
  - Email
  - Password (with show/hide toggle)
  - Confirm Password (with show/hide toggle)
- `AuthContext.jsx` - Manages authentication state across the app
- `ProtectedRoute.jsx` - Protects routes that require authentication

#### API Endpoints

- `POST /api/auth/register` - Register new user
  - Request: `{ email, password, passwordConfirm }`
  - Response: `{ success, message, data, token }`
- `POST /api/auth/login` - Login user
  - Request: `{ email, password }`
  - Response: `{ success, message, data, token }`

#### Database Schema

The application uses Prisma ORM with a User model that supports:

- Email-based authentication
- Password hashing with bcryptjs
- JWT token-based sessions
- User roles (ADMIN, OWNER, TENANT)
- User status (ACTIVE, BLOCKED)

### Project Structure

```
client/
├── src/
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── Login.css
│   │   └── Register.css
│   ├── contexts/
│   │   └── AuthContext.jsx
│   ├── components/
│   │   └── ProtectedRoute.jsx
│   ├── shared/utils/
│   │   └── authService.js
│   ├── services/
│   │   └── api.js
│   └── App.jsx

server/
├── controllers/
│   └── authController.js
├── routes/
│   └── authRoutes.js
├── prisma/
│   └── schema.prisma
├── lib/
│   └── prisma.js
├── .env
└── index.js
```

### How to Use

1. **Start the Server**:

   ```bash
   cd server
   npm run dev
   ```

2. **Start the Client** (in another terminal):

   ```bash
   cd client
   npm run dev
   ```

3. **Access the Application**:
   - Open `http://localhost:5173` in your browser
   - You'll be redirected to the login page

4. **Create a New Account**:
   - Click "Sign up" link on the login page
   - Fill in email, password, and confirm password
   - Click "Sign up" button
   - You'll be logged in and redirected to the dashboard

5. **Login**:
   - Use your registered email and password
   - Click "Log in" button
   - You'll be redirected to the dashboard

### Error Handling

The application includes comprehensive error handling:

- Email validation (must be unique and valid format)
- Password validation (minimum 6 characters)
- Password confirmation validation
- Server connection error handling
- User-friendly error messages displayed on the form

### Security Features

- Passwords are hashed using bcryptjs
- JWT tokens with 7-day expiration
- Protected routes require authentication
- Tokens stored in localStorage and sent with each API request
- CORS enabled for safe cross-origin requests

### Future Enhancements

- Email verification
- Password reset functionality
- Google and Facebook OAuth integration
- Two-factor authentication
- User profile management
