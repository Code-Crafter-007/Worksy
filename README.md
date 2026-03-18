## 🛠️ Tech Stack

### 🎨 Frontend
- React (Vite)
- React Router
- Axios
- Tailwind CSS (custom theme based on Worksy design system)

---

### ⚙️ Backend
- Node.js
- Express.js
- JSON Web Tokens (JWT) for session management
- CORS
- dotenv

---

### 🗄️ Database & Authentication
- Supabase (PostgreSQL)
- Supabase Auth (Email/Password)
- Supabase JavaScript Client

---

## 🧠 Architecture Overview

Worksy follows a **hybrid architecture**:

### 1. Authentication (Supabase Auth)
- Users sign up / login via Supabase Auth
- Supabase returns a JWT session
- Backend verifies the token for protected routes

---

### 2. Database (Supabase PostgreSQL)
- All application data stored in PostgreSQL
- Accessed via:
  - Supabase client (optional)
  - OR backend queries (recommended)

---

### 3. Backend (Express API Layer)
- Handles:
  - business logic
  - validation
  - authorization
- Acts as a secure layer between frontend and database

---

### 4. Frontend (React + Vite)
- Handles UI and user interaction
- Calls backend APIs via Axios
- Maintains session using JWT

---

## 🔐 Auth Flow (Important)

1. User logs in via Supabase Auth
2. Supabase returns access token
3. Frontend stores token
4. Token is sent in headers:

```