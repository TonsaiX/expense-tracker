import React, { useEffect, useState } from "react";
import { api } from "../api.js";
import { useAuth } from "../auth/AuthProvider.jsx";

function cls(...a) { return a.filter(Boolean).join(" "); }

function Toast({ show, tone = "ok", title, message, onClose }) {
  if (!show) return null;
  const toneCls =
    tone === "ok"
      ? "border-emerald-400/25 bg-emerald-500/10 text-emerald-100"
      : "border-rose-400/25 bg-rose-500/10 text-rose-100";

  return (
    <div className="fixed left-0 right-0 top-3 z-[60] px-4">
      <div className="mx-auto w-full max-w-2xl">
        <div className={cls("rounded-2xl border p-4 shadow-glow backdrop-blur-xl", toneCls)}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-extrabold">{title}</div>
              <div className="mt-1 text-sm opacity-90">{message}</div>
            </div>
            <button
              onClick={onClose}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold text-white/90 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
            >
              ปิด
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Account() {
  const { user, updateProfile, changePassword } = useAuth();

  const [profileLoading, setProfileLoading] = useState(true);
  const [createdAt, setCreatedAt] = useState(null);

  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");

  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNew, setConfirmNew] = useState("");
  const [savingPw, setSavingPw] = useState(false);

  const [toast, setToast] = useState({ show: false, tone: "ok", title: "", message: "" });

  function showToast(tone, title, message) {
    setToast({ show: true, tone, title, message });
    window.clearTimeout(window.__toastAcc);
    window.__toastAcc = window.setTimeout(() => {
      setToast((x) => ({ ...x, show: false }));
    }, 2600);
  }

  useEffect(() => {
    let alive = true;
    setProfileLoading(true);
    api.get("/api/account")
      .then((r) => {
        if (!alive) return;
        setName(r.data.name);
        setEmail(r.data.email);
        setCreatedAt(r.data.createdAt);
      })
      .catch(() => {
        if (!alive) return;
        showToast("err", "โหลดข้อมูลไม่สำเร็จ", "ลองใหม่อีกครั้ง");
      })
      .finally(() => {
        if (!alive) return;
        setProfileLoading(false);
      });

    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSaveProfile(e) {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await updateProfile(name.trim(), email.trim());
      showToast("ok", "บันทึกสำเร็จ", "อัปเดตข้อมูลบัญชีแล้ว");
    } catch (err) {
      const msg = err?.response?.data?.message;
      if (msg === "Email already in use") {
        showToast("err", "อีเมลถูกใช้แล้ว", "กรุณาใช้อีเมลอื่น");
      } else {
        showToast("err", "บันทึกไม่สำเร็จ", "ตรวจสอบข้อมูลแล้วลองใหม่");
      }
    } finally {
      setSavingProfile(false);
    }
  }

  async function onChangePassword(e) {
    e.preventDefault();
    if (newPassword.length < 8) return showToast("err", "รหัสผ่านสั้นเกินไป", "อย่างน้อย 8 ตัวอักษร");
    if (newPassword !== confirmNew) return showToast("err", "ยืนยันรหัสผ่านไม่ตรงกัน", "กรุณาพิมพ์ให้ตรงกัน");

    setSavingPw(true);
    try {
      await changePassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNew("");
      showToast("ok", "เปลี่ยนรหัสผ่านสำเร็จ");
    } catch (err) {
      const msg = err?.response?.data?.message;
      if (msg === "Invalid current password") {
        showToast("err", "รหัสผ่านเดิมไม่ถูกต้อง", "กรุณาลองใหม่");
      } else if (msg === "New password must be different") {
        showToast("err", "รหัสผ่านใหม่ต้องต่างจากเดิม", "กรุณาเปลี่ยนรหัสผ่านใหม่");
      } else {
        showToast("err", "เปลี่ยนรหัสผ่านไม่สำเร็จ", "ลองใหม่อีกครั้ง");
      }
    } finally {
      setSavingPw(false);
    }
  }

  return (
    <>
      <Toast
        show={toast.show}
        tone={toast.tone}
        title={toast.title}
        message={toast.message}
        onClose={() => setToast((x) => ({ ...x, show: false }))}
      />

      <div className="space-y-5">
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6 shadow-glow backdrop-blur-xl">
          <div className="pointer-events-none absolute -top-24 left-0 h-56 w-56 rounded-full bg-sky-500/18 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 right-0 h-56 w-56 rounded-full bg-emerald-500/18 blur-3xl" />

          <div className="relative">
            <div className="text-2xl sm:text-3xl font-extrabold tracking-tight">ตั้งค่าบัญชี</div>
            <div className="mt-1 text-sm text-slate-300">
              แก้ไขโปรไฟล์ + เปลี่ยนรหัสผ่าน
            </div>
          </div>
        </div>

        {/* Profile */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6 shadow-glow backdrop-blur-xl">
          <div className="flex items-end justify-between gap-3">
            <div>
              <div className="text-base font-extrabold tracking-tight">โปรไฟล์</div>
              <div className="mt-1 text-sm text-slate-400">
                อัปเดตชื่อ/อีเมลของคุณ
              </div>
            </div>
            <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-slate-200">
              {user?.id ? "Logged in" : "—"}
            </div>
          </div>

          {profileLoading ? (
            <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/30 p-5 text-slate-200">
              กำลังโหลด...
            </div>
          ) : (
            <form onSubmit={onSaveProfile} className="mt-4 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4">
                  <div className="text-sm font-bold text-slate-200">ชื่อ</div>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-2 h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm outline-none focus:ring-2 focus:ring-sky-500/40"
                    required
                  />
                </div>

                <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4">
                  <div className="text-sm font-bold text-slate-200">อีเมล</div>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    className="mt-2 h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm outline-none focus:ring-2 focus:ring-sky-500/40"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-xs text-slate-400">
                  สร้างเมื่อ: {createdAt ? new Date(createdAt).toLocaleString() : "—"}
                </div>

                <button
                  disabled={savingProfile}
                  className={cls(
                    "h-12 rounded-2xl px-6 text-sm font-extrabold transition",
                    "border border-white/10 bg-white/10 text-white shadow-soft",
                    "hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-sky-500/40",
                    savingProfile ? "opacity-60 cursor-not-allowed" : ""
                  )}
                >
                  {savingProfile ? "กำลังบันทึก..." : "บันทึกโปรไฟล์"}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Change password */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6 shadow-glow backdrop-blur-xl">
          <div>
            <div className="text-base font-extrabold tracking-tight">เปลี่ยนรหัสผ่าน</div>
            <div className="mt-1 text-sm text-slate-400">
              เพื่อความปลอดภัย จดจำรหัสผ้านของคุณให้ดี
            </div>
          </div>

          <form onSubmit={onChangePassword} className="mt-4 space-y-4">
            <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4">
              <div className="text-sm font-bold text-slate-200">รหัสผ่านปัจจุบัน</div>
              <input
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                type="password"
                className="mt-2 h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm outline-none focus:ring-2 focus:ring-sky-500/40"
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4">
                <div className="text-sm font-bold text-slate-200">รหัสผ่านใหม่</div>
                <input
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  type="password"
                  className="mt-2 h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm outline-none focus:ring-2 focus:ring-sky-500/40"
                  required
                  minLength={8}
                />
                <div className="mt-2 text-xs text-slate-400">อย่างน้อย 8 ตัวอักษร</div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4">
                <div className="text-sm font-bold text-slate-200">ยืนยันรหัสผ่านใหม่</div>
                <input
                  value={confirmNew}
                  onChange={(e) => setConfirmNew(e.target.value)}
                  type="password"
                  className="mt-2 h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm outline-none focus:ring-2 focus:ring-sky-500/40"
                  required
                  minLength={8}
                />
              </div>
            </div>

            <button
              disabled={savingPw}
              className={cls(
                "h-12 w-full rounded-2xl border border-white/10 bg-white/10 text-sm font-extrabold text-white shadow-soft transition",
                "hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-sky-500/40",
                savingPw ? "opacity-60 cursor-not-allowed" : ""
              )}
            >
              {savingPw ? "กำลังเปลี่ยนรหัสผ่าน..." : "เปลี่ยนรหัสผ่าน"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
