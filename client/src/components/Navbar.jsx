import React, { useMemo, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider.jsx";
import { useTheme } from "../theme/ThemeProvider.jsx";

// ฟังก์ชันนี้ใช้เพื่อรวมคลาสหลายๆ ตัวให้เป็นคลาสเดียว
function cls(...a) { return a.filter(Boolean).join(" "); }

// เมนูที่แสดงใน Navbar (สำหรับ Desktop)
function NavItem({ to, children }) {
  return (
    <NavLink
      to={to}  // นำไปที่ลิงก์ที่กำหนด
      className={({ isActive }) => 
        cls(
          "rounded-full px-4 py-2 text-sm font-semibold transition",  // การตั้งค่าตัวเลือกในการแสดงผล
          isActive ? "glass-chip text-white" : "text-slate-200 hover:bg-white/10"  // ถ้าเลือกเมนูนี้แล้วจะมีสไตล์พิเศษ
        )
      }
    >
      {children}  // แสดงเนื้อหาของเมนู
    </NavLink>
  );
}

// เมนูสำหรับมือถือที่ด้านล่าง
function MobileItem({ to, label }) {
  return (
    <NavLink
      to={to}  // ลิงก์ที่ต้องการไป
      className={({ isActive }) =>
        cls(
          "flex-1 rounded-2xl px-3 py-2 text-center text-xs font-extrabold transition",  // การตั้งค่าเมนูในมือถือ
          isActive ? "glass-chip text-white" : "text-slate-200 hover:bg-white/10"  // เมนูที่เลือกแล้วจะมีสไตล์พิเศษ
        )
      }
    >
      {label}  // แสดงชื่อของเมนู
    </NavLink>
  );
}

// ฟังก์ชันนี้จะเปลี่ยนธีมของแอป
function ThemeButton({ active, label, emoji, onClick }) {
  return (
    <button
      onClick={onClick}  // เมื่อคลิกจะเปลี่ยนธีม
      className={cls(
        "flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-bold",
        active ? "bg-white/10" : "hover:bg-white/10"  // เปลี่ยนสีเมื่อธีมถูกเลือก
      )}
    >
      <span className="flex items-center gap-2">
        <span>{emoji}</span>  {/* แสดงอิโมจิของธีม */}
        <span className="text-slate-200">{label}</span>  {/* ชื่อธีม */}
      </span>
      {active ? <span className="text-xs text-sky-200 font-extrabold">ใช้แล้ว</span> : null}  {/* ข้อความแสดงว่าเลือกแล้ว */}
    </button>
  );
}

// เมนู Navbar หลัก
export default function Navbar() {
  const { user, logout } = useAuth();  // ดึงข้อมูลผู้ใช้จาก AuthContext
  const { theme, setTheme } = useTheme();  // ดึงธีมจาก ThemeProvider
  const nav = useNavigate();  // ใช้สำหรับการนำทาง
  const loggedIn = !!user;  // ตรวจสอบสถานะล็อกอิน

  const [open, setOpen] = useState(false);  // เปิด/ปิดเมนูของผู้ใช้
  const btnRef = useRef(null);  // อ้างอิงถึงปุ่มที่ใช้เปิดเมนู

  const initials = useMemo(() => {
    const n = user?.name || "";
    return n.trim().slice(0, 1).toUpperCase() || "U";  // ชื่อย่อของผู้ใช้
  }, [user]);

  return (
    <>
      {/* Navbar */}
      <div className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/55 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-4 py-3">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-3xl glass-card">
              <div className="h-4 w-4 rounded-full bg-gradient-to-tr from-pink-300 via-violet-300 to-sky-300" />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-extrabold tracking-wide">MySpend</div>
              <div className="text-xs" style={{ color: "var(--muted)" }}>
                theme: <span className="font-bold text-slate-200">{theme}</span>
              </div>
            </div>
          </div>

          {/* เมนูหลัก */}
          {loggedIn ? (
            <div className="mx-auto hidden items-center gap-2 rounded-full glass-card px-1 py-1 sm:flex">
              <NavItem to="/dashboard">ภาพรวม</NavItem>
              <NavItem to="/entry">บันทึก</NavItem>
              <NavItem to="/transactions">ธุรกรรม</NavItem>
            </div>
          ) : (
            <div className="mx-auto hidden sm:block text-sm text-slate-300">กรุณาเข้าสู่ระบบเพื่อใช้งาน</div>
          )}

          {/* User avatar และ เมนูของผู้ใช้ */}
          <div className="ml-auto flex items-center gap-2">
            {loggedIn ? (
              <div className="relative">
                <button
                  ref={btnRef}
                  onClick={() => setOpen((v) => !v)}
                  className={cls(
                    "flex items-center gap-2 rounded-full px-3 py-2 glass-card cute-hover",
                    "focus:outline-none focus:ring-2 focus:ring-sky-500/40"
                  )}
                >
                  <div className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-tr from-pink-300 via-violet-300 to-sky-300 text-sm font-extrabold text-slate-950">
                    {initials}
                  </div>
                  <div className="hidden sm:block text-left leading-tight">
                    <div className="text-[11px]" style={{ color: "var(--muted)" }}>Hi,</div>
                    <div className="text-sm font-extrabold">{user.name}</div>
                  </div>
                </button>

                {/* เมนูสำหรับผู้ใช้ */}
                {open ? (
                  <div
                    className="absolute right-0 mt-2 w-64 overflow-hidden glass-card theme-dropdown"
                    onMouseLeave={() => setOpen(false)}
                  >
                    {/* แสดงเมนูการตั้งค่า */}
                    <div className="px-4 py-3 text-xs font-extrabold" style={{ color: "var(--muted)" }}>
                      Theme
                    </div>

                    <ThemeButton
                      emoji="🍓"
                      label="Cute"
                      active={theme === "cute"}
                      onClick={() => setTheme("cute")}
                    />
                    <ThemeButton
                      emoji="🌙"
                      label="Dark"
                      active={theme === "dark"}
                      onClick={() => setTheme("dark")}
                    />
                    <ThemeButton
                      emoji="🧊"
                      label="Minimal"
                      active={theme === "minimal"}
                      onClick={() => setTheme("minimal")}
                    />

                    {/* ตัวเลือกเพิ่มเติม */}
                    <div className="h-px bg-white/10" />

                    <button
                      onClick={() => { setOpen(false); nav("/account"); }}
                      className="w-full px-4 py-3 text-left text-sm font-bold text-slate-200 hover:bg-white/10"
                    >
                      ตั้งค่าบัญชี
                    </button>
                    <button
                      onClick={async () => {
                        setOpen(false);
                        await logout();
                        nav("/login");
                      }}
                      className="w-full px-4 py-3 text-left text-sm font-bold text-rose-200 hover:bg-rose-500/10"
                    >
                      ออกจากระบบ
                    </button>
                  </div>
                ) : null}
              </div>
            ) : (
              <button
                onClick={() => nav("/login")}
                className="h-11 px-4 text-sm font-extrabold text-white glass-btn cute-hover focus:outline-none focus:ring-2 focus:ring-sky-500/40"
              >
                เข้าสู่ระบบ
              </button>
            )}
          </div>
        </div>
      </div>

      {/* เมนูด้านล่างสำหรับมือถือ */}
      {loggedIn ? (
        <div className="fixed bottom-3 left-0 right-0 z-50 sm:hidden">
          <div className="mx-auto w-full max-w-6xl px-4">
            <div className="rounded-3xl glass-card p-2">
              <div className="flex gap-2">
                <MobileItem to="/dashboard" label="Dashboard" />
                <MobileItem to="/entry" label="บันทึก" />
                <MobileItem to="/transactions" label="ธุรกรรม" />
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="h-16 sm:hidden" />
    </>
  );
}

