import { useState } from 'react';
import { loginUser, registerUser } from '../services/authService';
import { AuthContext } from './authContextValue';

const USER_KEY = 'worksy_user';
const TOKEN_KEY = 'worksy_token';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem(USER_KEY);
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const loading = false;

  const persistAuth = (authPayload) => {
    localStorage.setItem(TOKEN_KEY, authPayload.token);
    localStorage.setItem(USER_KEY, JSON.stringify(authPayload.user));
    setUser(authPayload.user);
  };

  const login = async (credentials) => {
    const data = await loginUser(credentials);
    persistAuth(data);
    return data;
  };

  const register = async (payload) => {
    const data = await registerUser(payload);
    persistAuth(data);
    return data;
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
  };

  const value = { user, loading, isAuthenticated: Boolean(user), login, register, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
