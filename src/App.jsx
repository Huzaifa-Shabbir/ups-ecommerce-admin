import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { TechnicianAuthProvider } from './context/TechnicianAuthContext';
import { ThemeProvider } from './context/ThemeContext';
import AdminLayout from './components/Layout/AdminLayout';
import ProtectedRoute from './components/ProtectedRoute';
import TechnicianProtectedRoute from './components/TechnicianProtectedRoute';
import Login from './pages/Login/Login';
import Dashboard from './pages/Dashboard/Dashboard';
import Products from './pages/Products/Products';
import Categories from './pages/Categories/Categories';
import Orders from './pages/Orders/Orders';
import Customers from './pages/Customers/Customers';
import Services from './pages/Services/Services';
import Feedback from './pages/Feedback/Feedback';
import Payments from './pages/Payments/Payments';
import Reports from './pages/Reports/Reports';
import Resources from './pages/Resources/Resources';
import Technicians from './pages/Technicians/Technicians';
import TechnicianLayout from './components/Layout/TechnicianLayout';
import TechnicianDashboard from './pages/Technician/Dashboard';
import TechnicianResourceCenter from './pages/Technician/ResourceCenter';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <TechnicianAuthProvider>
          <Router>
          <Routes>
            <Route path="/admin/login" element={<Login />} />
            <Route path="/technician/login" element={<Login />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <Dashboard />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <Dashboard />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/products"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <Products />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/resources"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <Resources />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/categories"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <Categories />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/orders"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <Orders />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/customers"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <Customers />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/services"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <Services />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/technicians"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <Technicians />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/feedback"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <Feedback />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/payments"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <Payments />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/reports"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <Reports />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
            <Route
              path="/technician"
              element={<Navigate to="/technician/dashboard" replace />}
            />
            <Route
              path="/technician/dashboard"
              element={
                <TechnicianProtectedRoute>
                  <TechnicianLayout>
                    <TechnicianDashboard />
                  </TechnicianLayout>
                </TechnicianProtectedRoute>
              }
            />
            <Route
              path="/technician/resources"
              element={
                <TechnicianProtectedRoute>
                  <TechnicianLayout>
                    <TechnicianResourceCenter />
                  </TechnicianLayout>
                </TechnicianProtectedRoute>
              }
            />
            <Route path="/" element={<Navigate to="/admin/login" replace />} />
        </Routes>
      </Router>
      </TechnicianAuthProvider>
    </AuthProvider>
    </ThemeProvider>
  );
}

export default App;


