import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api, refreshAccessToken, setAccessToken } from "../api.js";

// สร้าง AuthContext สำหรับการจัดการข้อมูลการยืนยันตัวตน
const AuthContext = createContext(null);

// custom hook สำหรับใช้งาน AuthContext
export function useAuth() {
  return useContext(AuthContext); // ใช้ context เพื่อเข้าถึงข้อมูลการยืนยันตัวตน
}

// AuthProvider เป็น Provider สำหรับส่งข้อมูลให้กับคอมโพเนนต์ลูกๆ
export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // เก็บข้อมูลผู้ใช้
  const [ready, setReady] = useState(false); // ใช้บอกว่าแอปฯ พร้อมใช้งานหรือไม่

  // ฟังก์ชัน bootstrap ใช้เพื่อรีเฟรช token และโหลดข้อมูลผู้ใช้
  async function bootstrap() {
    try {
      const r = await refreshAccessToken(); // ใช้ refresh cookie เพื่อรีเฟรช token
      setUser(r.user); // ตั้งค่าผู้ใช้หากสำเร็จ
    } catch {
      setUser(null); // หากเกิดข้อผิดพลาด ล้างข้อมูลผู้ใช้
      setAccessToken(null); // ล้าง token
    } finally {
      setReady(true); // ระบุว่าแอปฯ พร้อมใช้งาน
    }
  }

  // เรียกใช้งานฟังก์ชัน bootstrap เมื่อเริ่มต้น
  useEffect(() => {
    bootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ฟังก์ชันสำหรับล็อกอิน
  async function login(email, password) {
    const r = await api.post("/api/auth/login", { email, password });
    setAccessToken(r.data.accessToken); // ตั้งค่า accessToken
    setUser(r.data.user); // ตั้งค่าผู้ใช้
    return r.data.user;
  }

  // ฟังก์ชันสำหรับสมัครสมาชิก
  async function register(name, email, password) {
    const r = await api.post("/api/auth/register", { name, email, password });
    setAccessToken(r.data.accessToken); // ตั้งค่า accessToken
    setUser(r.data.user); // ตั้งค่าผู้ใช้
    return r.data.user;
  }

  // ฟังก์ชันสำหรับออกจากระบบ
  async function logout() {
    try {
      await api.post("/api/auth/logout"); // ส่งคำขอออกจากระบบ
    } finally {
      setAccessToken(null); // ล้าง accessToken
      setUser(null); // ล้างข้อมูลผู้ใช้
    }
  }

  // ฟังก์ชันสำหรับอัปเดตโปรไฟล์
  async function updateProfile(name, email) {
    const r = await api.put("/api/account", { name, email });
    setUser(r.data.user); // อัปเดตข้อมูลผู้ใช้
    return r.data.user;
  }

  // ฟังก์ชันสำหรับเปลี่ยนรหัสผ่าน
  async function changePassword(currentPassword, newPassword) {
    const r = await api.post("/api/account/change-password", { currentPassword, newPassword });
    setAccessToken(r.data.accessToken); // ตั้งค่า accessToken ใหม่หลังจากเปลี่ยนรหัสผ่าน
    setUser(r.data.user); // อัปเดตข้อมูลผู้ใช้
    return true;
  }

  // ค่าที่จะส่งไปยัง Provider
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

  // ส่งข้อมูลให้คอมโพเนนต์ลูกๆ
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
