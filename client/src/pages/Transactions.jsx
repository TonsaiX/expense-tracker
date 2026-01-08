import React, { useEffect, useMemo, useState } from "react";
import { api, fmtMoney } from "../api.js";

function cls(...a) {
  return a.filter(Boolean).join(" ");
}

function Toast({ show, tone = "ok", title, message, onClose }) {
  if (!show) return null;
  const toneCls =
    tone === "ok"
      ? "border-emerald-400/25 bg-emerald-500/10 text-emerald-100"
      : "border-rose-400/25 bg-rose-500/10 text-rose-100";

  return (
    <div className="fixed left-0 right-0 top-3 z-[60] px-4">
      <div className="mx-auto w-full max-w-3xl">
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

function Badge({ type }) {
  const isIncome = type === "income";
  return (
    <span
      className={cls(
        "inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-extrabold",
        "bg-white/5 border-white/10",
        isIncome ? "text-emerald-200" : "text-rose-200"
      )}
    >
      {isIncome ? "รายรับ" : "รายจ่าย"}
    </span>
  );
}

function toISODate(d) {
  // YYYY-MM-DD local
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function startOfMonthISO() {
  const d = new Date();
  const s = new Date(d.getFullYear(), d.getMonth(), 1);
  return toISODate(s);
}
function startOfNextMonthISO() {
  const d = new Date();
  const s = new Date(d.getFullYear(), d.getMonth() + 1, 1);
  return toISODate(s);
}

export default function Transactions() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // filters
  const [type, setType] = useState("all"); // all | income | expense
  const [q, setQ] = useState("");
  const [start, setStart] = useState(startOfMonthISO());
  const [end, setEnd] = useState(startOfNextMonthISO()); // exclusive
  const [sort, setSort] = useState("date_desc"); // date_desc/date_asc/amount_desc/amount_asc

  const [items, setItems] = useState([]);

  const [toast, setToast] = useState({ show: false, tone: "ok", title: "", message: "" });

  function showToast(tone, title, message) {
    setToast({ show: true, tone, title, message });
    window.clearTimeout(window.__toastTimer2);
    window.__toastTimer2 = window.setTimeout(() => {
      setToast((x) => ({ ...x, show: false }));
    }, 2600);
  }

  async function load() {
    setLoading(true);
    setErr("");

    try {
      const params = {};
      if (type !== "all") params.type = type;
      if (q.trim()) params.q = q.trim();
      if (start) params.start = start;
      if (end) params.end = end;

      const r = await api.get("/api/transactions", { params });
      setItems(r.data.items || []);
    } catch {
      setErr("โหลดรายการธุรกรรมไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // refresh when filters change (debounce for search)
  useEffect(() => {
    window.clearTimeout(window.__txFilterTimer);
    window.__txFilterTimer = window.setTimeout(() => {
      load();
    }, 180);

    return () => window.clearTimeout(window.__txFilterTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, q, start, end]);

  const sorted = useMemo(() => {
    const out = [...items];
    out.sort((a, b) => {
      if (sort === "date_desc") return b.occurredOn.localeCompare(a.occurredOn);
      if (sort === "date_asc") return a.occurredOn.localeCompare(b.occurredOn);
      if (sort === "amount_desc") return b.amount - a.amount;
      if (sort === "amount_asc") return a.amount - b.amount;
      return 0;
    });
    return out;
  }, [items, sort]);

  const stats = useMemo(() => {
    const income = sorted.filter(x => x.type === "income").reduce((s, x) => s + x.amount, 0);
    const expense = sorted.filter(x => x.type === "expense").reduce((s, x) => s + x.amount, 0);
    return { income, expense, net: income - expense };
  }, [sorted]);

  async function onDelete(id) {
    const ok = confirm("ต้องการลบรายการนี้ใช่ไหม? (ย้อนกลับไม่ได้)");
    if (!ok) return;

    try {
      await api.delete(`/api/transactions/${id}`);
      setItems((prev) => prev.filter((x) => x.id !== id));
      showToast("ok", "ลบสำเร็จ", "ลบรายการออกจากระบบแล้ว");
    } catch {
      showToast("err", "ลบไม่สำเร็จ", "ลองใหม่อีกครั้ง");
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
        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6 shadow-glow backdrop-blur-xl">
          <div className="pointer-events-none absolute -top-24 left-0 h-56 w-56 rounded-full bg-violet-500/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 right-0 h-56 w-56 rounded-full bg-sky-500/15 blur-3xl" />

          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold tracking-tight">ธุรกรรม</div>
              <div className="mt-1 text-sm text-slate-300">
                ค้นหา • กรอง • ดูสรุป • ลบรายการ
              </div>
            </div>

            <button
              onClick={load}
              className="h-11 rounded-2xl border border-white/10 bg-white/10 px-5 text-sm font-extrabold text-white shadow-soft transition hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
            >
              รีเฟรช
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-glow backdrop-blur-xl">
          <div className="grid gap-4 lg:grid-cols-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <div className="text-sm font-bold text-slate-200">ค้นหา</div>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="ค้นหา หมวดหมู่/หมายเหตุ..."
                className="mt-2 h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm outline-none focus:ring-2 focus:ring-sky-500/40"
              />
            </div>

            {/* Type */}
            <div>
              <div className="text-sm font-bold text-slate-200">ประเภท</div>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="mt-2 h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm outline-none focus:ring-2 focus:ring-sky-500/40"
              >
                <option value="all">ทั้งหมด</option>
                <option value="income">รายรับ</option>
                <option value="expense">รายจ่าย</option>
              </select>
            </div>

            {/* Sort */}
            <div>
              <div className="text-sm font-bold text-slate-200">เรียงลำดับ</div>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="mt-2 h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm outline-none focus:ring-2 focus:ring-sky-500/40"
              >
                <option value="date_desc">วันที่ใหม่ → เก่า</option>
                <option value="date_asc">วันที่เก่า → ใหม่</option>
                <option value="amount_desc">เงินมาก → น้อย</option>
                <option value="amount_asc">เงินน้อย → มาก</option>
              </select>
            </div>
          </div>

          {/* Date range */}
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <div className="text-sm font-bold text-slate-200">เริ่ม (รวมวันนี้)</div>
              <input
                type="date"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                className="mt-2 h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm outline-none focus:ring-2 focus:ring-sky-500/40"
              />
              <div className="mt-2 text-xs text-slate-400">ถ้าเว้นว่าง = ไม่จำกัด</div>
            </div>

            <div>
              <div className="text-sm font-bold text-slate-200">สิ้นสุด (ไม่รวมวัน)</div>
              <input
                type="date"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                className="mt-2 h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm outline-none focus:ring-2 focus:ring-sky-500/40"
              />
            </div>
          </div>

          {/* mini summary */}
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4">
              <div className="text-xs text-slate-400">รวมรายรับ (ช่วงนี้)</div>
              <div className="mt-1 text-lg font-extrabold text-emerald-200">{fmtMoney(stats.income)}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4">
              <div className="text-xs text-slate-400">รวมรายจ่าย (ช่วงนี้)</div>
              <div className="mt-1 text-lg font-extrabold text-rose-200">{fmtMoney(stats.expense)}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4">
              <div className="text-xs text-slate-400">คงเหลือสุทธิ (ช่วงนี้)</div>
              <div className={cls("mt-1 text-lg font-extrabold", stats.net >= 0 ? "text-emerald-200" : "text-rose-200")}>
                {fmtMoney(stats.net)}
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-glow backdrop-blur-xl">
          <div className="flex items-end justify-between gap-3">
            <div>
              <div className="text-base font-extrabold tracking-tight">รายการ</div>
              <div className="mt-1 text-sm text-slate-400">{sorted.length} รายการ</div>
            </div>
          </div>

          {err ? (
            <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">
              {err}
            </div>
          ) : null}

          {loading ? (
            <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/30 p-5 text-slate-200">
              กำลังโหลด...
            </div>
          ) : sorted.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/30 p-5 text-slate-300">
              ไม่มีรายการในช่วงที่เลือก
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="mt-4 hidden overflow-hidden rounded-2xl border border-white/10 lg:block">
                <table className="w-full">
                  <thead className="bg-slate-950/40 text-left text-xs text-slate-300">
                    <tr>
                      <th className="px-4 py-3">วันที่</th>
                      <th className="px-4 py-3">ประเภท</th>
                      <th className="px-4 py-3">หมวดหมู่</th>
                      <th className="px-4 py-3">หมายเหตุ</th>
                      <th className="px-4 py-3 text-right">จำนวนเงิน</th>
                      <th className="px-4 py-3 text-right">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10 bg-slate-950/20">
                    {sorted.map((it) => (
                      <tr key={it.id} className="hover:bg-white/[0.04]">
                        <td className="px-4 py-3 text-sm text-slate-200">{it.occurredOn}</td>
                        <td className="px-4 py-3">
                          <Badge type={it.type} />
                        </td>
                        <td className="px-4 py-3 text-sm font-bold text-slate-100">{it.category}</td>
                        <td className="px-4 py-3 text-sm text-slate-300">{it.note || "—"}</td>
                        <td className={cls("px-4 py-3 text-right text-sm font-extrabold", it.type === "income" ? "text-emerald-200" : "text-rose-200")}>
                          {it.type === "income" ? "+" : "-"}{fmtMoney(it.amount)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => onDelete(it.id)}
                            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-extrabold text-slate-200 transition hover:bg-rose-500/10 hover:text-rose-100 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
                          >
                            ลบ
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="mt-4 grid gap-3 lg:hidden">
                {sorted.map((it) => (
                  <div
                    key={it.id}
                    className="rounded-2xl border border-white/10 bg-slate-950/30 p-4 transition hover:bg-white/[0.06]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge type={it.type} />
                          <span className="text-xs text-slate-400">{it.occurredOn}</span>
                        </div>

                        <div className="mt-2 truncate text-sm font-extrabold text-slate-100">
                          {it.category}
                        </div>
                        <div className="mt-1 line-clamp-2 text-xs text-slate-400">
                          {it.note || "—"}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className={cls("text-base font-extrabold", it.type === "income" ? "text-emerald-200" : "text-rose-200")}>
                          {it.type === "income" ? "+" : "-"}{fmtMoney(it.amount)}
                        </div>
                        <button
                          onClick={() => onDelete(it.id)}
                          className="mt-2 h-10 rounded-2xl border border-white/10 bg-white/5 px-4 text-xs font-extrabold text-slate-200 transition hover:bg-rose-500/10 hover:text-rose-100 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
                        >
                          ลบ
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
