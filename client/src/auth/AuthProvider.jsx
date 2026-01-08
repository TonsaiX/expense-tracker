import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api, refreshAccessToken, setAccessToken } from "../api.js";

const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  async function bootstrap() {
    try {
      const r = await refreshAccessToken(); // uses refresh cookie
      setUser(r.user);
    } catch {
      setUser(null);
      setAccessToken(null);
    } finally {
      setReady(true);
    }
  }

  useEffect(() => {
    bootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function login(email, password) {
    const r = await api.post("/api/auth/login", { email, password });
    setAccessToken(r.data.accessToken);
    setUser(r.data.user);
    return r.data.user;
  }

  async function register(name, email, password) {
    const r = await api.post("/api/auth/register", { name, email, password });
    setAccessToken(r.data.accessToken);
    setUser(r.data.user);
    return r.data.user;
  }

  async function logout() {
    try {
      await api.post("/api/auth/logout");
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  }

  async function updateProfile(name, email) {
    const r = await api.put("/api/account", { name, email });
    setUser(r.data.user);
    return r.data.user;
  }

  async function changePassword(currentPassword, newPassword) {
    const r = await api.post("/api/account/change-password", { currentPassword, newPassword });
    // password change returns new tokens (production rotate)
    setAccessToken(r.data.accessToken);
    setUser(r.data.user);
    return true;
  }

  const value = useMemo(
    () => ({
      user,
      ready,
      login,
      register,
      logout,
      updateProfile,
      changePassword
    }),
    [user, ready]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
