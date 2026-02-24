import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthProvider.jsx";

// ProtectedRoute คอมโพเนนต์เพื่อปกป้องหน้า
export default function ProtectedRoute({ children }) {
  const { user, ready } = useAuth(); // ใช้ useAuth เพื่อดึงข้อมูลผู้ใช้และสถานะการโหลด

  // หากแอปยังไม่ได้ตรวจสอบสิทธิ์
  if (!ready) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-slate-200 shadow-glow backdrop-blur-xl">
        กำลังตรวจสอบสิทธิ์...
      </div>
    );
  }

  // ถ้าผู้ใช้ไม่ได้ล็อกอิน จะเปลี่ยนเส้นทางไปหน้า login
  if (!user) return <Navigate to="/login" replace />;

  // ถ้าผู้ใช้ล็อกอินแล้ว แสดงเนื้อหาภายใน ProtectedRoute
  return children;
}
