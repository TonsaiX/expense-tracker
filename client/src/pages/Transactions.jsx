import React, { useEffect, useMemo, useState } from "react"; // นำเข้า React และ Hooks ที่จำเป็น
import { api, fmtMoney } from "../api.js"; // นำเข้า API และฟังก์ชันสำหรับจัดการเงิน

function cls(...a) { return a.filter(Boolean).join(" "); } // ฟังก์ชันสำหรับรวมคลาส CSS

// Toast component สำหรับแสดงข้อความแจ้งเตือน
function Toast({ show, tone = "ok", title, message, onClose }) {
  if (!show) return null; // ถ้าไม่ต้องการแสดง Toast จะไม่แสดงอะไร
  const toneCls =
    tone === "ok"
      ? "border-emerald-400/25 bg-emerald-500/10 text-emerald-100"
      : "border-rose-400/25 bg-rose-500/10 text-rose-100"; // เลือกสีตาม tone

  return (
    <div className="fixed left-0 right-0 top-3 z-[60] px-4">
      <div className="mx-auto w-full max-w-3xl">
        <div className={cls("rounded-2xl border p-4 shadow-glow backdrop-blur-xl", toneCls)}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-extrabold">{title}</div>
              <div className="mt-1 text-sm opacity-90">{message}</div> {/* แสดงข้อความ */}
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

// Badge component สำหรับแสดงประเภทของรายการ (รายรับ/รายจ่าย)
function Badge({ type }) {
  const isIncome = type === "income"; // เช็คว่าประเภทคือรายรับหรือรายจ่าย
  return (
    <span
      className={cls(
        "inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-extrabold",
        "bg-white/5 border-white/10",
        isIncome ? "text-emerald-200" : "text-rose-200"
      )}
    >
      {isIncome ? "รายรับ" : "รายจ่าย"} {/* แสดงคำว่า "รายรับ" หรือ "รายจ่าย" */}
    </span>
  );
}

// ฟังก์ชันสำหรับแปลงวันที่ให้เป็นรูปแบบ ISO (YYYY-MM-DD)
function toISODate(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`; // คืนค่าในรูปแบบ YYYY-MM-DD
}

// ฟังก์ชันสำหรับวันที่แรกของเดือนในรูปแบบ ISO
function startOfMonthISO() {
  const d = new Date();
  const s = new Date(d.getFullYear(), d.getMonth(), 1);
  return toISODate(s); // คืนค่าวันที่แรกของเดือน
}

// ฟังก์ชันสำหรับวันที่แรกของเดือนถัดไปในรูปแบบ ISO
function startOfNextMonthISO() {
  const d = new Date();
  const s = new Date(d.getFullYear(), d.getMonth() + 1, 1);
  return toISODate(s); // คืนค่าวันที่แรกของเดือนถัดไป
}

export default function Transactions() {
  const [loading, setLoading] = useState(true); // สถานะการโหลดข้อมูล
  const [err, setErr] = useState(""); // สถานะข้อผิดพลาด

  // filters (ตัวกรอง)
  const [type, setType] = useState("all"); // กรองตามประเภท (รายรับ, รายจ่าย, หรือทั้งหมด)
  const [q, setQ] = useState(""); // ค่าค้นหา
  const [start, setStart] = useState(startOfMonthISO()); // วันที่เริ่มต้น
  const [end, setEnd] = useState(startOfNextMonthISO()); // วันที่สิ้นสุด (ไม่รวมวัน)

  const [sort, setSort] = useState("date_desc"); // การเรียงลำดับ (ตามวันที่ หรือจำนวนเงิน)
  const [items, setItems] = useState([]); // รายการข้อมูลธุรกรรม

  const [toast, setToast] = useState({ show: false, tone: "ok", title: "", message: "" }); // สำหรับแสดง Toast แจ้งเตือน

  // ฟังก์ชันแสดงข้อความ Toast
  function showToast(tone, title, message) {
    setToast({ show: true, tone, title, message });
    window.clearTimeout(window.__toastTimer2);
    window.__toastTimer2 = window.setTimeout(() => {
      setToast((x) => ({ ...x, show: false }));
    }, 2600);
  }

  // ฟังก์ชันสำหรับโหลดข้อมูลธุรกรรม
  async function load() {
    setLoading(true);
    setErr("");

    try {
      const params = {};
      if (type !== "all") params.type = type; // กรองตามประเภท
      if (q.trim()) params.q = q.trim(); // ค้นหาตามคำค้น
      if (start) params.start = start; // กำหนดวันที่เริ่มต้น
      if (end) params.end = end; // กำหนดวันที่สิ้นสุด

      const r = await api.get("/api/transactions", { params }); // เรียกข้อมูลจาก API
      setItems(r.data.items || []); // เก็บข้อมูลที่ได้จาก API
    } catch {
      setErr("โหลดรายการธุรกรรมไม่สำเร็จ"); // หากเกิดข้อผิดพลาดให้แสดงข้อความ
    } finally {
      setLoading(false); // ตั้งค่าสถานะการโหลดเป็น false
    }
  }

  useEffect(() => {
    load(); // เรียกฟังก์ชันโหลดข้อมูลเมื่อเริ่มต้น
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ใช้ Debounce เมื่อฟิลเตอร์เปลี่ยนแปลง
  useEffect(() => {
    window.clearTimeout(window.__txFilterTimer);
    window.__txFilterTimer = window.setTimeout(() => {
      load(); // รีเฟรชข้อมูลเมื่อฟิลเตอร์เปลี่ยนแปลง
    }, 180);

    return () => window.clearTimeout(window.__txFilterTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, q, start, end]);

  // การจัดเรียงข้อมูลตามตัวเลือกของผู้ใช้
  const sorted = useMemo(() => {
    const out = [...items];
    out.sort((a, b) => {
      if (sort === "date_desc") return b.occurredOn.localeCompare(a.occurredOn); // เรียงตามวันที่ (ใหม่ไปเก่า)
      if (sort === "date_asc") return a.occurredOn.localeCompare(b.occurredOn); // เรียงตามวันที่ (เก่าไปใหม่)
      if (sort === "amount_desc") return b.amount - a.amount; // เรียงตามจำนวนเงิน (มากไปน้อย)
      if (sort === "amount_asc") return a.amount - b.amount; // เรียงตามจำนวนเงิน (น้อยไปมาก)
      return 0;
    });
    return out;
  }, [items, sort]);

  // สรุปข้อมูล (รายรับ, รายจ่าย, และยอดสุทธิ)
  const stats = useMemo(() => {
    const income = sorted.filter(x => x.type === "income").reduce((s, x) => s + x.amount, 0);
    const expense = sorted.filter(x => x.type === "expense").reduce((s, x) => s + x.amount, 0);
    return { income, expense, net: income - expense }; // คำนวณยอดสุทธิ
  }, [sorted]);

  // ฟังก์ชันสำหรับลบรายการธุรกรรม
  async function onDelete(id) {
    const ok = confirm("ต้องการลบรายการนี้ใช่ไหม? (ย้อนกลับไม่ได้)"); // ถามยืนยันการลบ
    if (!ok) return;

    try {
      await api.delete(`/api/transactions/${id}`); // ส่งคำขอลบไปยัง API
      setItems((prev) => prev.filter((x) => x.id !== id)); // อัปเดตรายการหลังจากลบสำเร็จ
      showToast("ok", "ลบสำเร็จ", "ลบรายการออกจากระบบแล้ว");
    } catch {
      showToast("err", "ลบไม่สำเร็จ", "ลองใหม่อีกครั้ง"); // หากลบไม่สำเร็จ แสดงข้อผิดพลาด
    }
  }

  return (
    <>
      <Toast
        show={toast.show}
        tone={toast.tone}
        title={toast.title}
        message={toast.message}
        onClose={() => setToast((x) => ({ ...x, show: false }))} // ปิด Toast เมื่อกดปุ่ม
      />

      <div className="space-y-5">
        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6 shadow-glow backdrop-blur-xl">
          <div className="pointer-events-none absolute -top-24 left-0 h-56 w-56 rounded-full bg-violet-500/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 right-0 h-56 w-56 rounded-full bg-sky-500/15 blur-3xl" />

          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold tracking-tight">ธุรกรรม</div>
              <div className="mt-1 text-sm text-slate-300">ค้นหา • กรอง • ดูสรุป • ลบรายการ</div>
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
