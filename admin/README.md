# UPS E-Commerce Admin Dashboard

A comprehensive admin dashboard for managing the UPS E-Commerce Store.

## Features

- **Admin Login** with JWT authentication and "Remember Me" functionality
- **Main Dashboard** with overview cards, recent activity, and charts
- **Navigation Menu** with all management sections
- **Manage Products** - View, add, edit, and delete products
- **Manage Categories** - Organize products into categories
- **Manage Orders** - View and manage customer orders
- **Manage Customers** - View customer information and statistics
- **Manage Services** - Manage available services
- **Manage Feedback** - View and manage customer feedback
- **Manage Payments** - Track payment transactions
- **Reports & Analytics** - Comprehensive business insights

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Backend API running on `http://localhost:4000`

## Installation

1. Navigate to the admin directory:
```bash
cd admin
```

2. Install dependencies:
```bash
npm install
```

## Running the Application

Start the development server:
```bash
npm run dev
```

The admin dashboard will be available at `http://localhost:5174`

## Building for Production

Build the application:
```bash
npm run build
```

Preview the production build:
```bash
npm run preview
```

## Configuration

### API Endpoint

The default API endpoint is set to `http://localhost:4000/api`. You can modify this in `src/services/api.js`:

```javascript
const API_BASE_URL = "http://localhost:4000/api";
```

### Authentication

The admin dashboard uses JWT authentication. Make sure your backend:
- Has a `/api/auth/login` endpoint that accepts `{ identifier, password }`
- Returns `{ token, user }` where `user.role === 'admin'`
- Supports Bearer token authentication in the Authorization header

## Project Structure

```
admin/
├── src/
│   ├── components/
│   │   ├── Layout/
│   │   │   └── AdminLayout.jsx    # Main layout with sidebar navigation
│   │   └── ProtectedRoute.jsx     # Route protection component
│   ├── context/
│   │   └── AuthContext.jsx        # Authentication context
│   ├── pages/
│   │   ├── Login/
│   │   │   └── Login.jsx          # Admin login page
│   │   ├── Dashboard/
│   │   │   └── Dashboard.jsx      # Main dashboard
│   │   ├── Products/
│   │   │   └── Products.jsx        # Products management
│   │   ├── Categories/
│   │   │   └── Categories.jsx     # Categories management
│   │   ├── Orders/
│   │   │   └── Orders.jsx         # Orders management
│   │   ├── Customers/
│   │   │   └── Customers.jsx      # Customers management
│   │   ├── Services/
│   │   │   └── Services.jsx       # Services management
│   │   ├── Feedback/
│   │   │   └── Feedback.jsx       # Feedback management
│   │   ├── Payments/
│   │   │   └── Payments.jsx       # Payments management
│   │   └── Reports/
│   │       └── Reports.jsx        # Reports & Analytics
│   ├── services/
│   │   └── api.js                 # API service functions
│   ├── App.jsx                    # Main app component with routing
│   ├── main.jsx                   # Entry point
│   └── index.css                  # Global styles
├── package.json
├── vite.config.js
└── tailwind.config.js
```

## Technologies Used

- **React 19** - UI library
- **React Router** - Routing
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Recharts** - Charts and graphs
- **Lucide React** - Icons

## Security Notes

- Admin routes are protected and require authentication
- Only users with `role === 'admin'` can access the dashboard
- JWT tokens are stored securely (localStorage for "Remember Me", sessionStorage otherwise)
- All API requests include the authentication token in the Authorization header

## Troubleshooting

### Cannot connect to backend
- Ensure the backend is running on `http://localhost:4000`
- Check CORS settings in your backend to allow requests from `http://localhost:5174`

### Login fails
- Verify your admin credentials have `role: 'admin'` in the database
- Check browser console for error messages
- Ensure the backend `/api/auth/login` endpoint is working correctly

### Charts not displaying
- Ensure `recharts` is installed: `npm install recharts`
- Check browser console for any errors

## License

This project is part of the UPS E-Commerce Store system.


