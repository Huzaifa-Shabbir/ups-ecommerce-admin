import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTechnicianAuth } from '../../context/TechnicianAuthContext';
import { Mail, Lock, Eye, EyeOff, Shield, AlertCircle, UserCog } from 'lucide-react';

const Login = ({ role = 'admin' }) => {
  const navigate = useNavigate();
  const adminAuth = useAuth();
  const technicianAuth = useTechnicianAuth();
  const isTechnicianPortal = role === 'technician';
  const activeAuth = isTechnicianPortal ? technicianAuth : adminAuth;
  const { login, isLoading, error, clearError, user, token } = activeAuth;
  const [formData, setFormData] = useState({ identifier: '', password: '' });
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [heading, subheading] = isTechnicianPortal
    ? ['Technician Login', 'Access your technician dashboard and assigned jobs']
    : ['Admin Login', 'Enter your credentials to access the admin dashboard'];
  const identifierLabel = 'Email';
  const identifierPlaceholder = 'Enter your email';

  useEffect(() => {
    if (adminAuth.user && adminAuth.token) {
      navigate('/admin/dashboard');
    }
  }, [adminAuth.user, adminAuth.token, navigate]);

  useEffect(() => {
    if (technicianAuth.user && technicianAuth.token) {
      navigate('/technician/dashboard');
    }
  }, [technicianAuth.user, technicianAuth.token, navigate]);

  const validateForm = () => {
    const errors = {};
    if (!formData.identifier.trim()) {
      errors.identifier = 'Email is required';
    }
    if (!formData.password) {
      errors.password = 'Password is required';
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setValidationErrors(prev => ({ ...prev, [name]: '' }));
    clearError();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      await login(formData.identifier, formData.password, rememberMe);
      // Navigation is handled by the auth context -> Login effect which watches user and token.
      // Avoid calling navigate here to prevent navigation loops when backend uses session cookies.
    } catch (err) {
      // Error is handled by context
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      {/* Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-4000"></div>
      </div>

      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl mb-4">
              {isTechnicianPortal ? <UserCog className="w-8 h-8 text-white" /> : <Shield className="w-8 h-8 text-white" />}
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{heading}</h1>
            <p className="text-gray-600">{subheading}</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-700 text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Input */}
            <div>
              <label htmlFor="identifier" className="block text-sm font-semibold text-gray-700 mb-2">
                {identifierLabel}
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="identifier"
                  type="text"
                  name="identifier"
                  value={formData.identifier}
                  onChange={handleChange}
                  className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${
                    validationErrors.identifier ? 'border-red-500' : 'border-gray-200'
                  }`}
                  placeholder={identifierPlaceholder}
                />
              </div>
              {validationErrors.identifier && (
                <p className="mt-2 text-sm text-red-600">{validationErrors.identifier}</p>
              )}
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full pl-12 pr-12 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${
                    validationErrors.password ? 'border-red-500' : 'border-gray-200'
                  }`}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {validationErrors.password && (
                <p className="mt-2 text-sm text-red-600">{validationErrors.password}</p>
              )}
            </div>

            {/* Remember Me */}
            <div className="flex items-center">
              <input
                id="rememberMe"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="rememberMe" className="ml-2 text-sm text-gray-700 cursor-pointer">
                Remember me
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3.5 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 focus:ring-4 focus:ring-blue-300 transition transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>

          {/* Security Notice */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-800 text-center">
              <Shield className="w-4 h-4 inline mr-1" />
              {isTechnicianPortal
                ? 'This portal is restricted to verified technicians.'
                : 'This is a secure admin area. Unauthorized access is prohibited.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

