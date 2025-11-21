import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const AuthContext = createContext(undefined);

const API_AUTH_BASE = 'http://localhost:4000/api/auth';
const REMEMBER_ME_KEY = 'adminRememberMe';
const TOKEN_KEY = 'adminToken';
const USER_KEY = 'adminUser';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load saved credentials on mount
  useEffect(() => {
    const savedToken = localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
    const savedUser = localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY);
    const rememberMe = localStorage.getItem(REMEMBER_ME_KEY) === 'true';

    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch (err) {
        console.error('Error loading saved credentials:', err);
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem(REMEMBER_ME_KEY);
        sessionStorage.removeItem(TOKEN_KEY);
        sessionStorage.removeItem(USER_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  // Helper: parse JSON when appropriate, otherwise throw informative error
  const parseResponse = async (response) => {
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      return response.json();
    } else {
      const text = await response.text().catch(() => '');
      throw new Error(`Server returned non-JSON response (status ${response.status}). Response body starts with: ${text.slice(0, 200)}`);
    }
  };

  const login = useCallback(async (identifier, password, rememberMe = false) => {
    setIsLoading(true);
    setError(null);
    try {
      // The backend exposes role-specific login endpoints. Admins must authenticate
      // at /api/auth/login/admin and the backend expects { email, password } in the body.
      const res = await fetch(`${API_AUTH_BASE}/login/admin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // receive refresh token cookie
        // map the identifier field (email or username) to `email` which the backend expects
        body: JSON.stringify({ email: identifier, password }),
      });

      if (!res.ok) {
        const payload = await (res.headers.get('content-type')?.includes('application/json') 
          ? res.json() 
          : Promise.resolve({ error: `Login failed (status ${res.status})` }));
        throw new Error(payload.error || payload.message || `Login failed (status ${res.status})`);
      }

      const data = await parseResponse(res);

      // Backend returns shape like { success: true, user: { ... } } or { error: '...' }
      if (data.error) {
        throw new Error(data.error || 'Login failed');
      }

      // Normalize response: token may not be provided; backend may rely on session cookies
      const authToken = data.token || data.accessToken || null;
      const userData = data.user || data;

      // Check if user is admin
      if (userData && userData.role !== 'admin') {
        throw new Error('Access denied. Admin privileges required.');
      }

      const normalizedUser = {
        id: userData.user_id || userData.id,
        email: userData.email,
        username: userData.username,
        role: userData.role || 'user',
      };

  // If backend uses session cookies and does not return an auth token,
  // use a short-lived sentinel value to represent an authenticated session
  // on the client. We don't persist this sentinel to storage.
  setToken(authToken || 'session');
      setUser(normalizedUser);

      // Only persist token if it's a non-null/non-undefined value. Some backends
      // rely on session cookies instead of returning a token; avoid storing
      // the literal 'null' which causes the frontend to send Authorization: Bearer null.
      if (rememberMe) {
        if (authToken) localStorage.setItem(TOKEN_KEY, authToken);
        localStorage.setItem(USER_KEY, JSON.stringify(normalizedUser));
        localStorage.setItem(REMEMBER_ME_KEY, 'true');
        sessionStorage.removeItem(TOKEN_KEY);
        sessionStorage.removeItem(USER_KEY);
      } else {
        if (authToken) sessionStorage.setItem(TOKEN_KEY, authToken);
        sessionStorage.setItem(USER_KEY, JSON.stringify(normalizedUser));
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem(REMEMBER_ME_KEY);
      }

      return { token: authToken, user: normalizedUser };
    } catch (err) {
      const errorMessage = err.message || 'Login failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch(`${API_AUTH_BASE}/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setToken(null);
      setUser(null);
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(REMEMBER_ME_KEY);
      sessionStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(USER_KEY);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, isLoading, error, login, logout, clearError }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
