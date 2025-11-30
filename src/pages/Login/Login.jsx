import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTechnicianAuth } from '../../context/TechnicianAuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Mail, Lock, Eye, EyeOff, Shield, AlertCircle, UserCog, RotateCcw, Moon, Sun } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const adminAuth = useAuth();
  const technicianAuth = useTechnicianAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const [isTechnicianMode, setIsTechnicianMode] = useState(false);
  const [isFlipping, setIsFlipping] = useState(false);
  
  const activeAuth = isTechnicianMode ? technicianAuth : adminAuth;
  const { login, isLoading, error, clearError, user, token } = activeAuth;
  const [formData, setFormData] = useState({ identifier: '', password: '' });
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  // Load saved credentials on mount if remember me was checked
  useEffect(() => {
    const REMEMBER_ME_KEY = isTechnicianMode ? 'technicianRememberMe' : 'adminRememberMe';
    const USER_KEY = isTechnicianMode ? 'technicianUser' : 'adminUser';
    
    const wasRemembered = localStorage.getItem(REMEMBER_ME_KEY) === 'true';
    if (wasRemembered) {
      const savedUser = localStorage.getItem(USER_KEY);
      if (savedUser) {
        try {
          const user = JSON.parse(savedUser);
          setFormData(prev => ({ ...prev, identifier: user.email || '' }));
          setRememberMe(true);
        } catch (err) {
          console.error('Error loading saved credentials:', err);
        }
      }
    }
  }, [isTechnicianMode]);

  const [heading, subheading] = isTechnicianMode
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

  const handleSwitch = () => {
    setIsFlipping(true);
    // Clear form data and errors when switching
    setFormData({ identifier: '', password: '' });
    setValidationErrors({});
    // Clear errors from both contexts
    adminAuth.clearError();
    technicianAuth.clearError();
    
    setTimeout(() => {
      setIsTechnicianMode(!isTechnicianMode);
      setIsFlipping(false);
    }, 300); // Half of the animation duration
  };

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
    <div className={`min-h-screen flex items-center justify-center p-4 transition-all duration-500 ${
      isDarkMode 
        ? 'bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950' 
        : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'
    }`}>
      {/* Theme Toggle Button */}
      <button
        onClick={toggleTheme}
        className={`absolute top-6 right-6 p-3 rounded-full shadow-2xl hover:shadow-3xl transition-all transform hover:scale-110 z-50 backdrop-blur-sm ${
          isDarkMode 
            ? 'bg-slate-800/80 border border-slate-700/50 hover:bg-slate-700/80' 
            : 'bg-white/90 border border-gray-200/50 hover:bg-white'
        }`}
        aria-label="Toggle theme"
      >
        {isDarkMode ? (
          <Sun className="w-5 h-5 text-yellow-400" />
        ) : (
          <Moon className="w-5 h-5 text-slate-700" />
        )}
      </button>

      {/* Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {isDarkMode ? (
          <>
            <div className="absolute top-20 left-10 w-96 h-96 bg-blue-500/20 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-pulse"></div>
            <div className="absolute top-40 right-10 w-96 h-96 bg-indigo-500/20 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-pulse animation-delay-2000"></div>
            <div className="absolute -bottom-20 left-20 w-96 h-96 bg-purple-500/20 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-pulse animation-delay-4000"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/10 rounded-full mix-blend-screen filter blur-3xl opacity-20"></div>
          </>
        ) : (
          <>
            <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
            <div className="absolute top-40 right-10 w-72 h-72 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
            <div className="absolute -bottom-8 left-20 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-4000"></div>
          </>
        )}
      </div>

      <div className="relative w-full max-w-md">
        {/* Flip Card Container */}
        <div className="perspective-1000">
          <div 
            className={`flip-card preserve-3d ${isTechnicianMode ? 'flipped' : ''}`}
            style={{ minHeight: '600px' }}
          >
            {/* Admin Card (Front) */}
            <div className="flip-card-front backface-hidden w-full">
              <div className={`rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl border transition-all duration-500 ${
                isDarkMode 
                  ? 'bg-slate-800/30 border-slate-700/50 shadow-indigo-500/10' 
                  : 'bg-white border-transparent'
              }`}>
                <div className="p-8">
                  {/* Header */}
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl mb-4">
                      <Shield className="w-8 h-8 text-white" />
                    </div>
                    <h1 className={`text-3xl font-bold mb-2 transition-colors ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>Admin Login</h1>
                    <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                      Enter your credentials to access the admin dashboard
                    </p>
                  </div>

                  {/* Error Message */}
                  {error && !isTechnicianMode && (
                    <div className={`mb-6 p-4 border-l-4 border-red-500 rounded-lg flex items-start space-x-3 backdrop-blur-sm transition-all ${
                      isDarkMode 
                        ? 'bg-red-900/20 border-red-400/50' 
                        : 'bg-red-50'
                    }`}>
                      <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <p className={`text-sm font-medium ${
                        isDarkMode ? 'text-red-300' : 'text-red-700'
                      }`}>{error}</p>
                    </div>
                  )}

                  {/* Login Form */}
                  <form onSubmit={handleSubmit} className="space-y-6">
                      {/* Email Input */}
                      <div>
                        <label htmlFor="admin-identifier" className={`block text-sm font-semibold mb-2 transition-colors ${
                          isDarkMode ? 'text-gray-200' : 'text-gray-700'
                        }`}>
                          {identifierLabel}
                        </label>
                        <div className="relative">
                          <Mail className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-colors ${
                            isDarkMode ? 'text-indigo-400' : 'text-gray-400'
                          }`} />
                          <input
                            id="admin-identifier"
                            type="text"
                            name="identifier"
                            value={formData.identifier}
                            onChange={handleChange}
                            className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all backdrop-blur-sm ${
                              validationErrors.identifier 
                                ? 'border-red-500' 
                                : isDarkMode 
                                  ? 'border-slate-600/50 bg-slate-700/30 text-white placeholder-gray-400 focus:border-blue-400/50' 
                                  : 'border-gray-200'
                            } ${isDarkMode ? 'text-white' : ''}`}
                            placeholder={identifierPlaceholder}
                          />
                        </div>
                        {validationErrors.identifier && (
                          <p className={`mt-2 text-sm transition-colors ${
                            isDarkMode ? 'text-red-400' : 'text-red-600'
                          }`}>{validationErrors.identifier}</p>
                        )}
                      </div>

                      {/* Password Input */}
                      <div>
                        <label htmlFor="admin-password" className={`block text-sm font-semibold mb-2 transition-colors ${
                          isDarkMode ? 'text-gray-200' : 'text-gray-700'
                        }`}>
                          Password
                        </label>
                        <div className="relative">
                          <Lock className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-colors ${
                            isDarkMode ? 'text-indigo-400' : 'text-gray-400'
                          }`} />
                          <input
                            id="admin-password"
                            type={showPassword ? 'text' : 'password'}
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            className={`w-full pl-12 pr-12 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all backdrop-blur-sm ${
                              validationErrors.password 
                                ? 'border-red-500' 
                                : isDarkMode 
                                  ? 'border-slate-600/50 bg-slate-700/30 text-white placeholder-gray-400 focus:border-blue-400/50' 
                                  : 'border-gray-200'
                            } ${isDarkMode ? 'text-white' : ''}`}
                            placeholder="Enter your password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className={`absolute right-4 top-1/2 transform -translate-y-1/2 transition-colors ${
                              isDarkMode ? 'text-indigo-400 hover:text-indigo-300' : 'text-gray-400 hover:text-gray-600'
                            }`}
                          >
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                        {validationErrors.password && (
                          <p className={`mt-2 text-sm transition-colors ${
                            isDarkMode ? 'text-red-400' : 'text-red-600'
                          }`}>{validationErrors.password}</p>
                        )}
                      </div>

                      {/* Remember Me */}
                      <div className="flex items-center">
                        <input
                          id="admin-rememberMe"
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="admin-rememberMe" className={`ml-2 text-sm cursor-pointer transition-colors ${
                          isDarkMode ? 'text-gray-200' : 'text-gray-700'
                        }`}>
                          Remember me
                        </label>
                      </div>

                      {/* Submit Button */}
                      <button
                        type="submit"
                        disabled={isLoading}
                        className={`w-full text-white py-3.5 rounded-xl font-semibold focus:ring-4 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 ${
                          isDarkMode
                            ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-500 hover:via-purple-500 hover:to-indigo-500 focus:ring-indigo-500/50 shadow-lg shadow-indigo-500/30'
                            : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:ring-blue-300'
                        }`}
                      >
                        {isLoading ? (
                          <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <span>Sign In</span>
                        )}
                      </button>
                    </form>

                  {/* Security Notice */}
                  <div className={`mt-6 p-4 rounded-lg border backdrop-blur-sm transition-all ${
                    isDarkMode 
                      ? 'bg-blue-900/20 border-blue-700/30' 
                      : 'bg-blue-50 border-blue-200'
                  }`}>
                    <p className={`text-xs text-center transition-colors ${
                      isDarkMode ? 'text-blue-300' : 'text-blue-800'
                    }`}>
                      <Shield className="w-4 h-4 inline mr-1" />
                      This is a secure admin area. Unauthorized access is prohibited.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Technician Card (Back) */}
            <div className="flip-card-back backface-hidden w-full">
              <div className={`rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl border transition-all duration-500 ${
                isDarkMode 
                  ? 'bg-slate-800/30 border-slate-700/50 shadow-purple-500/10' 
                  : 'bg-white border-transparent'
              }`}>
                <div className="p-8">
                  {/* Header */}
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl mb-4">
                      <UserCog className="w-8 h-8 text-white" />
                    </div>
                    <h1 className={`text-3xl font-bold mb-2 transition-colors ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>Technician Login</h1>
                    <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                      Access your technician dashboard and assigned jobs
                    </p>
                  </div>

                  {/* Error Message */}
                  {error && isTechnicianMode && (
                    <div className={`mb-6 p-4 border-l-4 border-red-500 rounded-lg flex items-start space-x-3 backdrop-blur-sm transition-all ${
                      isDarkMode 
                        ? 'bg-red-900/20 border-red-400/50' 
                        : 'bg-red-50'
                    }`}>
                      <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <p className={`text-sm font-medium transition-colors ${
                        isDarkMode ? 'text-red-300' : 'text-red-700'
                      }`}>{error}</p>
                    </div>
                  )}

                  {/* Login Form */}
                  <form onSubmit={handleSubmit} className="space-y-6">
                      {/* Email Input */}
                      <div>
                        <label htmlFor="tech-identifier" className={`block text-sm font-semibold mb-2 transition-colors ${
                          isDarkMode ? 'text-gray-200' : 'text-gray-700'
                        }`}>
                          {identifierLabel}
                        </label>
                        <div className="relative">
                          <Mail className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-colors ${
                            isDarkMode ? 'text-purple-400' : 'text-gray-400'
                          }`} />
                          <input
                            id="tech-identifier"
                            type="text"
                            name="identifier"
                            value={formData.identifier}
                            onChange={handleChange}
                            className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all backdrop-blur-sm ${
                              validationErrors.identifier 
                                ? 'border-red-500' 
                                : isDarkMode 
                                  ? 'border-slate-600/50 bg-slate-700/30 text-white placeholder-gray-400 focus:border-purple-400/50' 
                                  : 'border-gray-200'
                            } ${isDarkMode ? 'text-white' : ''}`}
                            placeholder={identifierPlaceholder}
                          />
                        </div>
                        {validationErrors.identifier && (
                          <p className={`mt-2 text-sm transition-colors ${
                            isDarkMode ? 'text-red-400' : 'text-red-600'
                          }`}>{validationErrors.identifier}</p>
                        )}
                      </div>

                      {/* Password Input */}
                      <div>
                        <label htmlFor="tech-password" className={`block text-sm font-semibold mb-2 transition-colors ${
                          isDarkMode ? 'text-gray-200' : 'text-gray-700'
                        }`}>
                          Password
                        </label>
                        <div className="relative">
                          <Lock className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-colors ${
                            isDarkMode ? 'text-purple-400' : 'text-gray-400'
                          }`} />
                          <input
                            id="tech-password"
                            type={showPassword ? 'text' : 'password'}
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            className={`w-full pl-12 pr-12 py-3 border-2 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all backdrop-blur-sm ${
                              validationErrors.password 
                                ? 'border-red-500' 
                                : isDarkMode 
                                  ? 'border-slate-600/50 bg-slate-700/30 text-white placeholder-gray-400 focus:border-purple-400/50' 
                                  : 'border-gray-200'
                            } ${isDarkMode ? 'text-white' : ''}`}
                            placeholder="Enter your password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className={`absolute right-4 top-1/2 transform -translate-y-1/2 transition-colors ${
                              isDarkMode ? 'text-purple-400 hover:text-purple-300' : 'text-gray-400 hover:text-gray-600'
                            }`}
                          >
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                        {validationErrors.password && (
                          <p className={`mt-2 text-sm transition-colors ${
                            isDarkMode ? 'text-red-400' : 'text-red-600'
                          }`}>{validationErrors.password}</p>
                        )}
                      </div>

                      {/* Remember Me */}
                      <div className="flex items-center">
                        <input
                          id="tech-rememberMe"
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                        />
                        <label htmlFor="tech-rememberMe" className={`ml-2 text-sm cursor-pointer transition-colors ${
                          isDarkMode ? 'text-gray-200' : 'text-gray-700'
                        }`}>
                          Remember me
                        </label>
                      </div>

                      {/* Submit Button */}
                      <button
                        type="submit"
                        disabled={isLoading}
                        className={`w-full text-white py-3.5 rounded-xl font-semibold focus:ring-4 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 ${
                          isDarkMode
                            ? 'bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 hover:from-purple-500 hover:via-pink-500 hover:to-purple-500 focus:ring-purple-500/50 shadow-lg shadow-purple-500/30'
                            : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 focus:ring-purple-300'
                        }`}
                      >
                        {isLoading ? (
                          <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <span>Sign In</span>
                        )}
                      </button>
                    </form>

                  {/* Security Notice */}
                  <div className={`mt-6 p-4 rounded-lg border backdrop-blur-sm transition-all ${
                    isDarkMode 
                      ? 'bg-purple-900/20 border-purple-700/30' 
                      : 'bg-purple-50 border-purple-200'
                  }`}>
                    <p className={`text-xs text-center transition-colors ${
                      isDarkMode ? 'text-purple-300' : 'text-purple-800'
                    }`}>
                      <Shield className="w-4 h-4 inline mr-1" />
                      This portal is restricted to verified technicians.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Switch Button */}
        <div className="mt-6 flex justify-center">
          <button
            onClick={handleSwitch}
            className={`flex items-center space-x-2 px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105 border-2 backdrop-blur-sm ${
              isDarkMode
                ? 'bg-slate-800/40 border-slate-700/50 hover:border-indigo-500/50 hover:bg-slate-700/40'
                : 'bg-white border-gray-200 hover:border-blue-500'
            }`}
            disabled={isFlipping}
          >
            <RotateCcw className={`w-5 h-5 transition-all duration-300 ${isFlipping ? 'rotate-180' : ''} ${
              isDarkMode ? 'text-indigo-400' : 'text-gray-600'
            }`} />
            <span className={`font-semibold transition-colors ${
              isDarkMode ? 'text-gray-200' : 'text-gray-700'
            }`}>
              Switch to {isTechnicianMode ? 'Admin' : 'Technician'} Login
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;

