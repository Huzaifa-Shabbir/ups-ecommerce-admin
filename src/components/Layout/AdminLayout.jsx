import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import ChangePassword from '../ChangePassword/ChangePassword';
import {
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingCart,
  Users,
  Wrench,
  MessageSquare,
  CreditCard,
  BarChart3,
  Menu,
  X,
  LogOut,
  ChevronRight,
  BookOpen,
  UserCog,
  Key,
  Moon,
  Sun,
} from 'lucide-react';

const AdminLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();

  const menuItems = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/admin/products', label: 'Manage Products', icon: Package },
    { path: '/admin/categories', label: 'Manage Categories', icon: FolderTree },
    { path: '/admin/orders', label: 'Manage Orders', icon: ShoppingCart },
    { path: '/admin/customers', label: 'Manage Customers', icon: Users },
    { path: '/admin/services', label: 'Manage Services', icon: Wrench },
    { path: '/admin/technicians', label: 'Manage Technicians', icon: UserCog },
    { path: '/admin/resources', label: 'Knowledge Resources', icon: BookOpen },
    { path: '/admin/feedback', label: 'Manage Feedback', icon: MessageSquare },
    { path: '/admin/payments', label: 'Manage Payments', icon: CreditCard },
    { path: '/admin/reports', label: 'Reports & Analytics', icon: BarChart3 },
  ];

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className={`min-h-screen flex transition-colors duration-300 ${
      isDarkMode ? 'bg-slate-900' : 'bg-gray-50'
    }`}>
      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className={`fixed inset-0 z-40 lg:hidden transition-colors ${
            isDarkMode ? 'bg-black bg-opacity-70' : 'bg-black bg-opacity-50'
          }`}
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } fixed lg:static inset-y-0 left-0 z-50 transition-all duration-300 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${
          isDarkMode 
            ? 'bg-slate-800/90 backdrop-blur-xl border-r border-slate-700/50' 
            : 'bg-white border-r border-gray-200'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo/Header */}
          <div className={`h-16 flex items-center justify-between px-4 border-b transition-colors ${
            isDarkMode ? 'border-slate-700/50' : 'border-gray-200'
          }`}>
            {sidebarOpen && (
              <h1 className={`text-xl font-bold transition-colors ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>UPS Admin</h1>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className={`lg:flex hidden p-2 rounded-lg transition ${
                isDarkMode ? 'hover:bg-slate-700/50' : 'hover:bg-gray-100'
              }`}
            >
              <Menu className={`w-5 h-5 transition-colors ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`} />
            </button>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className={`lg:hidden p-2 rounded-lg transition ${
                isDarkMode ? 'hover:bg-slate-700/50' : 'hover:bg-gray-100'
              }`}
            >
              <X className={`w-5 h-5 transition-colors ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4 px-2">
            <ul className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
                        active
                          ? isDarkMode
                            ? 'bg-indigo-600/20 text-indigo-400 font-semibold'
                            : 'bg-blue-50 text-blue-700 font-semibold'
                          : isDarkMode
                            ? 'text-gray-300 hover:bg-slate-700/50'
                            : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${
                        active 
                          ? isDarkMode ? 'text-indigo-400' : 'text-blue-600'
                          : isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`} />
                      {sidebarOpen && (
                        <>
                          <span className="flex-1">{item.label}</span>
                          {active && <ChevronRight className="w-4 h-4" />}
                        </>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* User Section */}
          <div className={`border-t p-4 transition-colors ${
            isDarkMode ? 'border-slate-700/50' : 'border-gray-200'
          }`}>
            {sidebarOpen && user && (
              <div className={`mb-4 px-4 py-2 rounded-lg transition-colors ${
                isDarkMode ? 'bg-slate-700/30' : 'bg-gray-50'
              }`}>
                <p className={`text-sm font-semibold transition-colors ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>{user.username || user.email}</p>
                <p className={`text-xs transition-colors ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>Administrator</p>
              </div>
            )}
            <div className="space-y-1">
              <button
                onClick={toggleTheme}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
                  isDarkMode
                    ? 'text-yellow-400 hover:bg-slate-700/50'
                    : 'text-slate-700 hover:bg-gray-100'
                }`}
              >
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                {sidebarOpen && <span>Toggle Theme</span>}
              </button>
              <button
                onClick={() => setShowChangePassword(true)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
                  isDarkMode
                    ? 'text-indigo-400 hover:bg-slate-700/50'
                    : 'text-blue-600 hover:bg-blue-50'
                }`}
              >
                <Key className="w-5 h-5" />
                {sidebarOpen && <span>Change Password</span>}
              </button>
              <button
                onClick={handleLogout}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
                  isDarkMode
                    ? 'text-red-400 hover:bg-slate-700/50'
                    : 'text-red-600 hover:bg-red-50'
                }`}
              >
                <LogOut className="w-5 h-5" />
                {sidebarOpen && <span>Logout</span>}
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:ml-0">
        {/* Top Bar */}
        <header className={`h-16 border-b flex items-center justify-between px-4 lg:px-6 transition-colors ${
          isDarkMode 
            ? 'bg-slate-800/90 backdrop-blur-xl border-slate-700/50' 
            : 'bg-white border-gray-200'
        }`}>
          <button
            onClick={() => setMobileMenuOpen(true)}
            className={`lg:hidden p-2 rounded-lg transition ${
              isDarkMode ? 'hover:bg-slate-700/50' : 'hover:bg-gray-100'
            }`}
          >
            <Menu className={`w-6 h-6 transition-colors ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`} />
          </button>
          <div className="flex-1" />
          {user && (
            <div className="flex items-center space-x-4">
              <div className="text-right hidden sm:block">
                <p className={`text-sm font-semibold transition-colors ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>{user.username || user.email}</p>
                <p className={`text-xs transition-colors ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>Admin</p>
              </div>
            </div>
          )}
        </header>

        {/* Page Content */}
        <main className={`flex-1 overflow-y-auto p-4 lg:p-6 transition-colors ${
          isDarkMode ? 'bg-slate-900' : 'bg-gray-50'
        }`}>{children}</main>
      </div>

      {/* Change Password Modal */}
      {showChangePassword && user && (
        <ChangePassword onClose={() => setShowChangePassword(false)} user={user} />
      )}
    </div>
  );
};

export default AdminLayout;


