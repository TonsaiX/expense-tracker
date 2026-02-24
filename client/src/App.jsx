import React from "react"; // นำเข้า React สำหรับการสร้างคอมโพเนนต์
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom"; // นำเข้าฟังก์ชันจาก React Router สำหรับการจัดการ routing

import ThemeProvider from "./theme/ThemeProvider.jsx"; // นำเข้า ThemeProvider สำหรับการจัดการธีม
import AuthProvider from "./auth/AuthProvider.jsx"; // นำเข้า AuthProvider สำหรับการจัดการการยืนยันตัวตน
import ProtectedRoute from "./auth/ProtectedRoute.jsx"; // นำเข้า ProtectedRoute สำหรับการป้องกันเส้นทางที่ต้องการการยืนยันตัวตน

import Navbar from "./components/Navbar.jsx"; // นำเข้า Navbar คอมโพเนนต์สำหรับแถบเมนู
import Dashboard from "./pages/Dashboard.jsx"; // นำเข้า Dashboard คอมโพเนนต์สำหรับหน้าหลัก
import Entry from "./pages/Entry.jsx"; // นำเข้า Entry คอมโพเนนต์สำหรับหน้าบันทึกข้อมูล
import Transactions from "./pages/Transactions.jsx"; // นำเข้า Transactions คอมโพเนนต์สำหรับหน้าธุรกรรม
import Login from "./pages/Login.jsx"; // นำเข้า Login คอมโพเนนต์สำหรับหน้าล็อกอิน
import Register from "./pages/Register.jsx"; // นำเข้า Register คอมโพเนนต์สำหรับหน้าลงทะเบียน
import Account from "./pages/Account.jsx"; // นำเข้า Account คอมโพเนนต์สำหรับหน้าบัญชีผู้ใช้

// Layout component สำหรับการจัดโครงสร้างหน้า
function Layout() {
  const loc = useLocation(); // ใช้ useLocation hook เพื่อดึงข้อมูลเส้นทางปัจจุบัน
  const isAuthPage = loc.pathname === "/login" || loc.pathname === "/register"; // ตรวจสอบว่าเป็นหน้าล็อกอินหรือหน้าลงทะเบียนหรือไม่

  return (
    <div className="min-h-screen">
      {/* หากไม่ใช่หน้าล็อกอินหรือหน้าลงทะเบียน ให้แสดง Navbar */}
      {!isAuthPage ? <Navbar /> : null}

      {/* เนื้อหาของแต่ละหน้า */}
      <div className="mx-auto w-full max-w-6xl px-4 py-6 pb-24 sm:pb-6">
        <Routes>
          {/* หากเส้นทางเป็น "/" ให้ redirect ไปที่ "/dashboard" */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* เส้นทางสำหรับหน้า Login และ Register */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* เส้นทางสำหรับหน้าต่างๆ ที่ต้องการการยืนยันตัวตน */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute> {/* ป้องกันเส้นทางนี้ด้วยการยืนยันตัวตน */}
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/entry"
            element={
              <ProtectedRoute> {/* ป้องกันเส้นทางนี้ด้วยการยืนยันตัวตน */}
                <Entry />
              </ProtectedRoute>
            }
          />
          <Route
            path="/transactions"
            element={
              <ProtectedRoute> {/* ป้องกันเส้นทางนี้ด้วยการยืนยันตัวตน */}
                <Transactions />
              </ProtectedRoute>
            }
          />
          <Route
            path="/account"
            element={
              <ProtectedRoute> {/* ป้องกันเส้นทางนี้ด้วยการยืนยันตัวตน */}
                <Account />
              </ProtectedRoute>
            }
          />

          {/* เส้นทางสำหรับทุกเส้นทางที่ไม่ตรงกับที่กำหนดจะ redirect ไปที่ "/" */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>

      {/* Footer */}
      <div className="mx-auto w-full max-w-6xl px-4 pb-10">
        <div className="text-xs" style={{ color: "var(--muted)" }}>
          © MySpend • 2026
        </div>
      </div>
    </div>
  );
}

// App component สำหรับการตั้งค่าและเชื่อมโยง provider ต่างๆ
export default function App() {
  return (
    <BrowserRouter> {/* ใช้ BrowserRouter เพื่อรองรับการทำงานของ routing */}
      <ThemeProvider> {/* ใช้ ThemeProvider เพื่อให้ธีมทั่วทั้งแอป */}
        <AuthProvider> {/* ใช้ AuthProvider เพื่อจัดการการยืนยันตัวตน */}
          <Layout /> {/* แสดง Layout ที่มีการใช้งาน routing */}
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
