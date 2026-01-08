import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthProvider.jsx";

export default function ProtectedRoute({ children }) {
  const { user, ready } = useAuth();

  if (!ready) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-slate-200 shadow-glow backdrop-blur-xl">
        กำลังตรวจสอบสิทธิ์...
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  return children;
}
