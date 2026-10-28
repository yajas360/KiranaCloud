import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('kiranacloud_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  const checkAuth = async () => {
    try {
      const res = await api.get('/auth/me');
      if (res.data.success) {
        setUser(res.data.user);
        localStorage.setItem('kiranacloud_user', JSON.stringify(res.data.user));
      }
    } catch (err) {
      if (err.response?.status === 401) {
        setUser(null);
        localStorage.removeItem('kiranacloud_token');
        localStorage.removeItem('kiranacloud_user');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (identifier, password) => {
    setAuthError(null);
    try {
      const res = await api.post('/auth/login', {
        email: identifier,
        identifier: identifier,
        password,
      });
      if (res.data.success) {
        setUser(res.data.user);
        if (res.data.token) {
          localStorage.setItem('kiranacloud_token', res.data.token);
        }
        localStorage.setItem('kiranacloud_user', JSON.stringify(res.data.user));
        return { success: true };
      }
    } catch (err) {
      let message = 'Login failed. Please try again.';
      if (err.response?.data?.message) {
        message = err.response.data.message;
      } else if (err.response?.status === 401) {
        message = 'Invalid email or password. If you do not have an account, click Register Store below.';
      } else if (err.response?.status === 500) {
        message = 'Server database error. Please try again.';
      } else if (!err.response) {
        message = 'Network error: Cannot reach server at http://localhost:5000.';
      }
      setAuthError(message);
      return { success: false, message };
    }
  };

  const register = async (formData) => {
    setAuthError(null);
    try {
      const res = await api.post('/auth/register', formData);
      if (res.data.success) {
        setUser(res.data.user);
        if (res.data.token) {
          localStorage.setItem('kiranacloud_token', res.data.token);
        }
        localStorage.setItem('kiranacloud_user', JSON.stringify(res.data.user));
        return { success: true };
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed. Please try again.';
      setAuthError(message);
      return { success: false, message };
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.warn('Logout error', err);
    } finally {
      setUser(null);
      localStorage.removeItem('kiranacloud_token');
      localStorage.removeItem('kiranacloud_user');
    }
  };

  const updateProfile = (updatedData) => {
    setUser((prev) => {
      const nextUser = { ...prev, ...updatedData };
      localStorage.setItem('kiranacloud_user', JSON.stringify(nextUser));
      return nextUser;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        authError,
        isAuthenticated: !!user,
        storeName: user?.storeName || 'Corner Mart',
        storeAddress: user?.storeAddress || '',
        storePhone: user?.storePhone || '',
        currency: user?.currency || 'INR',
        currencySymbol: user?.currencySymbol || '₹',
        taxRate: user?.taxRate || 5,
        login,
        register,
        logout,
        checkAuth,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
