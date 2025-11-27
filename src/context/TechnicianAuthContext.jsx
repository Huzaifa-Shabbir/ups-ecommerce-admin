import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const TechnicianAuthContext = createContext(undefined);

const API_AUTH_BASE = 'http://localhost:4000/api/auth';
const REMEMBER_ME_KEY = 'technicianRememberMe';
const TOKEN_KEY = 'technicianToken';
const USER_KEY = 'technicianUser';

export const TechnicianAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY);

    if (savedUser) {
      try {
        setToken('session');
        setUser(JSON.parse(savedUser));
      } catch (err) {
        console.error('Error loading saved technician credentials:', err);
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem(REMEMBER_ME_KEY);
        sessionStorage.removeItem(USER_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const parseResponse = async (response) => {
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      return response.json();
    }
    const text = await response.text().catch(() => '');
    throw new Error(`Server returned non-JSON response (status ${response.status}). Response body starts with: ${text.slice(0, 200)}`);
  };

  const login = useCallback(async (identifier, password, rememberMe = false) => {
    setIsLoading(true);
    setError(null);
    try {
      const loginIdentifier = identifier?.trim();
      if (!loginIdentifier) {
        throw new Error('Email is required');
      }

      const res = await fetch(`${API_AUTH_BASE}/login/technician`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: loginIdentifier, password }),
      });

      const data = await parseResponse(res);
      
      // Backend returns 400 with { error: "..." } on validation/auth failures
      if (!res.ok || data.error) {
        const errorMsg = data.error || data.message || `Login failed (status ${res.status})`;
        throw new Error(errorMsg);
      }

      // Backend returns { success: true, user: {...} } on success
      if (!data.success || !data.user) {
        throw new Error('Invalid response from server');
      }

      const userData = data.user;

      if (userData.role && userData.role !== 'technician') {
        throw new Error('Access denied. Technician credentials required.');
      }

      const normalizedUser = {
        id: userData.user_Id || userData.user_id || userData.id,
        email: userData.email,
        username: userData.username,
        role: userData.role || 'technician',
        name: userData.name || userData.full_name || userData.username,
      };

      setToken(authToken || 'session');
      setUser(normalizedUser);

      if (rememberMe) {
        localStorage.setItem(USER_KEY, JSON.stringify(normalizedUser));
        localStorage.setItem(REMEMBER_ME_KEY, 'true');
        sessionStorage.removeItem(USER_KEY);
      } else {
        sessionStorage.setItem(USER_KEY, JSON.stringify(normalizedUser));
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

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(REMEMBER_ME_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
  }, []);

  return (
    <TechnicianAuthContext.Provider value={{ user, token, isLoading, error, login, logout, clearError }}>
      {children}
    </TechnicianAuthContext.Provider>
  );
};

export const useTechnicianAuth = () => {
  const context = useContext(TechnicianAuthContext);
  if (!context) throw new Error('useTechnicianAuth must be used within TechnicianAuthProvider');
  return context;
};



