import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTechnicianAuth } from '../../context/TechnicianAuthContext';
import ChangePassword from '../ChangePassword/ChangePassword';
import { LayoutDashboard, ClipboardList, BookOpen, Menu, X, LogOut, Wrench, Key } from 'lucide-react';

const TechnicianLayout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useTechnicianAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);

  const menuItems = [
    { path: '/technician/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/technician/resources', label: 'Resources', icon: BookOpen },
  ];

  const isActive = (path) => location.pathname === path;

  const handleLogout = async () => {
    await logout();
    navigate('/technician/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-white border-r border-gray-200 fixed lg:static inset-y-0 left-0 z-50 transition-all duration-300 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100">
            {sidebarOpen && (
              <div className="flex items-center space-x-2">
                <Wrench className="w-6 h-6 text-blue-600" />
                <span className="font-semibold text-gray-900">Technician Hub</span>
              </div>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 transition hidden lg:block"
            >
              <Menu className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 rounded-lg hover:bg-gray-100 transition lg:hidden"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto py-4 px-2">
            <ul className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
                        active ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-700 hover:bg-gray-100'
                      }`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Icon className={`w-5 h-5 ${active ? 'text-blue-600' : 'text-gray-500'}`} />
                      {sidebarOpen && <span className="flex-1">{item.label}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="border-t border-gray-100 p-4">
            {sidebarOpen && user && (
              <div className="mb-4">
                <p className="text-sm font-semibold text-gray-900">{user.name || user.username || 'Technician'}</p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
            )}
            <div className="space-y-1">
              <button
                onClick={() => setShowChangePassword(true)}
                className="w-full flex items-center space-x-3 px-4 py-3 text-blue-600 hover:bg-blue-50 rounded-lg transition"
              >
                <Key className="w-5 h-5" />
                {sidebarOpen && <span>Change Password</span>}
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center space-x-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition"
              >
                <LogOut className="w-5 h-5" />
                {sidebarOpen && <span>Logout</span>}
              </button>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col lg:ml-0">
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 lg:px-6">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition"
          >
            <Menu className="w-6 h-6 text-gray-600" />
          </button>
          <div className="flex-1" />
          {user && (
            <div className="flex items-center space-x-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-gray-900">{user.name || user.username}</p>
                <p className="text-xs text-gray-500">Technician</p>
              </div>
            </div>
          )}
        </header>
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>

      {/* Change Password Modal */}
      {showChangePassword && user && (
        <ChangePassword onClose={() => setShowChangePassword(false)} user={user} />
      )}
    </div>
  );
};

export default TechnicianLayout;



