import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider.jsx";

function cls(...a) { return a.filter(Boolean).join(" "); }

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      await login(email.trim(), password);
      nav("/dashboard");
    } catch (e2) {
      setErr("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-5">
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 shadow-glow backdrop-blur-xl">
        <div className="pointer-events-none absolute -top-24 left-0 h-56 w-56 rounded-full bg-sky-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 right-0 h-56 w-56 rounded-full bg-violet-500/20 blur-3xl" />

        <div className="relative">
          <div className="text-2xl font-extrabold tracking-tight">เข้าสู่ระบบ</div>
          <div className="mt-1 text-sm text-slate-300">กรุณากรอก Email เเละ Password ของท่าน</div>
        </div>
      </div>

      {err ? (
        <div className="rounded-2xl border border-rose-400/25 bg-rose-500/10 p-4 text-sm text-rose-100">
          {err}
        </div>
      ) : null}

      <form onSubmit={onSubmit} className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-glow backdrop-blur-xl space-y-4">
        <div>
          <div className="text-sm font-bold text-slate-200">อีเมล</div>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="name@example.com"
            className="mt-2 h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm outline-none focus:ring-2 focus:ring-sky-500/40"
            required
          />
        </div>

        <div>
          <div className="text-sm font-bold text-slate-200">รหัสผ่าน</div>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder="อย่างน้อย 8 ตัวอักษร"
            className="mt-2 h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm outline-none focus:ring-2 focus:ring-sky-500/40"
            required
          />
        </div>

        <button
          disabled={busy}
          className={cls(
            "h-12 w-full rounded-2xl border border-white/10 bg-white/10 text-sm font-extrabold text-white shadow-soft transition",
            "hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-sky-500/40",
            busy ? "opacity-60 cursor-not-allowed" : ""
          )}
        >
          {busy ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
        </button>

        <div className="text-center text-sm text-slate-300">
          ยังไม่มีบัญชี?{" "}
          <Link to="/register" className="font-extrabold text-sky-200 hover:underline">
            สมัครสมาชิก
          </Link>
        </div>
      </form>
    </div>
  );
}
