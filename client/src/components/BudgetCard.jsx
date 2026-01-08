import React, { useEffect, useMemo, useState } from "react";
import { api, fmtMoney } from "../api.js";

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

export default function BudgetCard({ month }) {
  const [status, setStatus] = useState(null);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [toast, setToast] = useState({ show: false, tone: "ok", title: "", message: "" });

  function showToast(tone, title, message) {
    setToast({ show: true, tone, title, message });
    window.clearTimeout(window.__toastBudget);
    window.__toastBudget = window.setTimeout(() => {
      setToast((x) => ({ ...x, show: false }));
    }, 2600);
  }

  async function load() {
    setLoading(true);
    try {
      const [b, s] = await Promise.all([
        api.get("/api/budgets", { params: { month } }),
        api.get("/api/budgets/status", { params: { month } })
      ]);
      setStatus(s.data);
      setAmount(b.data.budget?.amount ? String(b.data.budget.amount) : "");
    } catch {
      showToast("err", "โหลดงบไม่สำเร็จ", "ลองใหม่อีกครั้ง");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month]);

  const percent = useMemo(() => {
    const p = status?.percentUsed;
    if (p === null || p === undefined) return 0;
    return Math.max(0, Math.min(1.5, p));
  }, [status]);

  const barTone = useMemo(() => {
    if (!status?.budgetAmount) return "bg-white/10";
    if (status.exceeded) return "bg-rose-400/70";
    if ((status.percentUsed ?? 0) >= 0.85) return "bg-amber-300/70";
    return "bg-emerald-400/70";
  }, [status]);

  async function onSave(e) {
    e.preventDefault();
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) {
      return showToast("err", "งบไม่ถูกต้อง", "กรุณากรอกตัวเลขมากกว่า 0");
    }

    setSaving(true);
    try {
      await api.put("/api/budgets", { amount: n }, { params: { month } });
      await load();
      showToast("ok", "บันทึกงบสำเร็จ", `ตั้งงบเดือน ${month} = ${fmtMoney(n)}`);
    } catch (err) {
      showToast("err", "บันทึกงบไม่สำเร็จ", "ลองใหม่อีกครั้ง");
    } finally {
      setSaving(false);
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

      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 shadow-glow backdrop-blur-xl">
        <div className="pointer-events-none absolute -top-24 left-0 h-56 w-56 rounded-full bg-amber-300/12 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 right-0 h-56 w-56 rounded-full bg-rose-500/12 blur-3xl" />

        <div className="relative">
          <div className="flex items-end justify-between gap-3">
            <div>
              <div className="text-base font-extrabold tracking-tight">งบประมาณรายเดือน</div>
              <div className="mt-1 text-sm text-slate-400">แจ้งเตือนเมื่อรายจ่ายเกินงบ</div>
            </div>
            <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-slate-200">
              {month}
            </div>
          </div>

          {loading ? (
            <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/30 p-5 text-slate-200">
              กำลังโหลด...
            </div>
          ) : (
            <>
              {/* Status */}
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4">
                  <div className="text-xs text-slate-400">งบ</div>
                  <div className="mt-1 text-lg font-extrabold text-slate-100">
                    {status?.budgetAmount ? fmtMoney(status.budgetAmount) : "ยังไม่ได้ตั้ง"}
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4">
                  <div className="text-xs text-slate-400">ใช้ไป (รายจ่าย)</div>
                  <div className="mt-1 text-lg font-extrabold text-rose-200">
                    {fmtMoney(status?.expenseTotal ?? 0)}
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4">
                  <div className="text-xs text-slate-400">คงเหลือ</div>
                  <div className={cls("mt-1 text-lg font-extrabold", status?.budgetAmount ? ((status.remaining ?? 0) >= 0 ? "text-emerald-200" : "text-rose-200") : "text-slate-200")}>
                    {status?.budgetAmount ? fmtMoney(status.remaining ?? 0) : "—"}
                  </div>
                </div>
              </div>

              {/* Progress */}
              <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/30 p-4">
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span>% ใช้งบ</span>
                  <span className={cls("font-extrabold", status?.exceeded ? "text-rose-200" : "text-slate-100")}>
                    {status?.budgetAmount ? `${Math.round((status.percentUsed ?? 0) * 100)}%` : "—"}
                  </span>
                </div>

                <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/10">
                  <div
                    className={cls("h-full rounded-full transition-all", barTone)}
                    style={{ width: `${Math.min(100, Math.round(percent * 100))}%` }}
                  />
                </div>

                {status?.budgetAmount ? (
                  <div className="mt-3 text-xs text-slate-400">
                    {status.exceeded
                      ? "⚠️ ใช้เงินเกินงบแล้ว — แนะนำลดรายจ่ายที่ไม่จำเป็น"
                      : "อยู่ในงบ — ดีมาก!"}
                  </div>
                ) : (
                  <div className="mt-3 text-xs text-slate-400">
                    ตั้งงบเพื่อให้ระบบแจ้งเตือนเมื่อใช้เกิน
                  </div>
                )}
              </div>

              {/* Set budget */}
              <form onSubmit={onSave} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                <input
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="ตั้งงบ (บาท) เช่น 15000"
                  className="h-12 flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 text-sm outline-none focus:ring-2 focus:ring-sky-500/40"
                />
                <button
                  disabled={saving}
                  className={cls(
                    "h-12 rounded-2xl border border-white/10 bg-white/10 px-6 text-sm font-extrabold text-white shadow-soft transition",
                    "hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-sky-500/40",
                    saving ? "opacity-60 cursor-not-allowed" : ""
                  )}
                >
                  {saving ? "กำลังบันทึก..." : "บันทึกงบ"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </>
  );
}
