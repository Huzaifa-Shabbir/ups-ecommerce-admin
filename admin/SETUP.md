# Quick Setup Guide

## Prerequisites

1. **Backend must be running** on `http://localhost:4000`
2. **Node.js** installed (v16 or higher)
3. **Admin user** must exist in the database with `role: 'admin'`

## Installation Steps

1. Navigate to the admin directory:
```bash
cd admin
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to:
```
http://localhost:5174/admin/login
```

## Backend Configuration

Make sure your backend CORS settings allow requests from the admin dashboard:

```javascript
// In backend/index.js or similar
app.use(
  cors({
    origin: [
      process.env.FRONTEND_URL,
      "http://localhost:5173",  // Frontend
      "http://localhost:5174"   // Admin Dashboard
    ],
    credentials: true,
  })
);
```

## Creating an Admin User

If you don't have an admin user yet, you can create one through your backend:

1. Use the signup endpoint with `role: 'admin'`:
```bash
POST http://localhost:4000/api/auth/signup
{
  "email": "admin@example.com",
  "username": "admin",
  "password": "yourpassword",
  "role": "admin"
}
```

Or update an existing user's role in your database to `'admin'`.

## Troubleshooting

### Port Already in Use
If port 5174 is already in use, you can change it in `vite.config.js`:
```javascript
server: {
  port: 5175, // or any other port
}
```

### Cannot Connect to Backend
- Verify backend is running: `http://localhost:4000`
- Check backend CORS configuration
- Verify API endpoints are correct in `src/services/api.js`

### Login Not Working
- Ensure user has `role: 'admin'` in database
- Check browser console for errors
- Verify backend `/api/auth/login` endpoint returns `{ token, user }`

## Next Steps

After successful login, you'll have access to:
- Dashboard with overview statistics
- All management sections (Products, Categories, Orders, etc.)
- Reports & Analytics


