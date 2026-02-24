import React, { useMemo, useState } from "react"; // นำเข้า React และ hook ที่จำเป็น
import { api, fmtMoney, toISODate } from "../api.js"; // นำเข้าฟังก์ชันที่ใช้ในการจัดการ API และการแสดงผล

// ฟังก์ชันช่วยเพื่อให้ได้วันที่ในรูปแบบ ISO (YYYY-MM-DD)
function todayISO() {
  return toISODate(new Date()); // คืนค่าวันนี้ในรูปแบบ ISO
}

// ฟังก์ชันช่วยสำหรับการรวม classNames
function cls(...a) {
  return a.filter(Boolean).join(" "); // รวม classNames ที่ไม่เป็นค่าว่าง
}

// หมวดหมู่ค่าใช้จ่ายและรายรับที่กำหนดไว้ล่วงหน้า
const DEFAULT_CATEGORIES = {
  expense: ["อาหาร", "เดินทาง", "ช้อปปิ้ง", "บิล/ค่าน้ำไฟ", "สุขภาพ", "บันเทิง", "การศึกษา", "อื่นๆ"],
  income: ["เงินเดือน", "รายได้เสริม", "โบนัส", "ของขวัญ", "คืนเงิน", "อื่นๆ"]
};

// คอมโพเนนต์สำหรับการแสดง Toast Notification
function Toast({ show, tone = "ok", title, message, onClose }) {
  if (!show) return null; // ถ้าไม่แสดง toast ก็จะ return null ออกไป

  // การเลือกคลาสสีตาม tone
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
              onClick={onClose} // เมื่อปิด Toast
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

export default function Entry() {
  // สถานะต่างๆ ของฟอร์ม
  const [type, setType] = useState("expense"); // ชนิดของรายการ (รายรับ/รายจ่าย)
  const [amount, setAmount] = useState(""); // จำนวนเงิน
  const [category, setCategory] = useState(""); // หมวดหมู่
  const [occurredOn, setOccurredOn] = useState(todayISO()); // วันที่ของรายการ
  const [note, setNote] = useState(""); // หมายเหตุ

  const [saving, setSaving] = useState(false); // ใช้เพื่อบอกสถานะการบันทึก
  const [toast, setToast] = useState({ show: false, tone: "ok", title: "", message: "" }); // สถานะ Toast

  // หมวดหมู่ที่รวบรวมมาให้ตามประเภท (รายจ่าย/รายรับ)
  const quickCats = useMemo(() => DEFAULT_CATEGORIES[type], [type]);

  // แปลงจำนวนเงินที่รับมาจาก input เป็นตัวเลข
  const parsedAmount = useMemo(() => {
    const n = Number(amount);
    return Number.isFinite(n) ? n : 0;
  }, [amount]);

  // ฟังก์ชันสำหรับแสดงผล Toast
  function showToast(tone, title, message) {
    setToast({ show: true, tone, title, message });
    window.clearTimeout(window.__toastTimer); // ลบ timeout ที่ใช้ก่อนหน้า
    window.__toastTimer = window.setTimeout(() => {
      setToast((x) => ({ ...x, show: false })); // ซ่อน Toast หลังจาก 2.6 วินาที
    }, 2600);
  }

  // ฟังก์ชันสำหรับเช็คการเกินงบ
  async function checkBudgetAlert(monthKey) {
    try {
      const r = await api.get("/api/budgets/status", { params: { month: monthKey } });
      const s = r.data;
      if (s.budgetAmount && s.exceeded) {
        showToast(
          "err",
          "⚠️ ใช้เงินเกินงบแล้ว",
          `งบ ${fmtMoney(s.budgetAmount)} • ใช้ไป ${fmtMoney(s.expenseTotal)} • เกิน ${fmtMoney(Math.abs(s.remaining))}`
        );
      }
    } catch {
      // ไม่ต้องแสดง toast ถ้าเช็คงบพลาด
    }
  }

  // ฟังก์ชันสำหรับการบันทึกข้อมูลรายการ
  async function onSubmit(e) {
    e.preventDefault(); // หยุดการส่งฟอร์มแบบปกติ
    if (!category.trim()) return showToast("err", "กรอกไม่ครบ", "กรุณาใส่หมวดหมู่");
    if (!amount || parsedAmount <= 0) return showToast("err", "จำนวนเงินไม่ถูกต้อง", "จำนวนเงินต้องมากกว่า 0");
    if (!occurredOn) return showToast("err", "กรอกไม่ครบ", "กรุณาเลือกวันที่");

    setSaving(true); // กำลังบันทึก
    try {
      const payload = {
        type,
        amount: parsedAmount,
        category: category.trim(),
        note: note.trim() ? note.trim() : null,
        occurredOn
      };

      await api.post("/api/transactions", payload); // ส่งข้อมูลไปยัง API

      showToast("ok", "บันทึกสำเร็จ", `${type === "income" ? "รายรับ" : "รายจ่าย"} ${fmtMoney(parsedAmount)} • ${category}`);

      // ✅ ถ้าเป็นรายจ่าย -> เช็คงบเดือนนั้นแล้วแจ้งเตือนทันทีถ้าเกิน
      if (type === "expense") {
        const monthKey = occurredOn.slice(0, 7); // ดึงคีย์เดือนจากวันที่
        await checkBudgetAlert(monthKey); // เช็คการเกินงบ
      }

      // รีเซ็ตค่า (แต่ยังคงเก็บประเภทและวันที่สำหรับการกรอกข้อมูลเร็วขึ้น)
      setAmount("");
      setCategory("");
      setNote("");
    } catch {
      showToast("err", "บันทึกไม่สำเร็จ", "กรุณาลองใหม่อีกครั้ง"); // แสดง Toast หากเกิดข้อผิดพลาด
    } finally {
      setSaving(false); // เปลี่ยนสถานะการบันทึก
    }
  }

  return (
    <>
      {/* แสดงผล Toast notification */}
      <Toast
        show={toast.show}
        tone={toast.tone}
        title={toast.title}
        message={toast.message}
        onClose={() => setToast((x) => ({ ...x, show: false }))}
      />

      <div className="space-y-5">
        {/* ส่วนของการบันทึกรายการ */}
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6 shadow-glow backdrop-blur-xl">
          <div className="pointer-events-none absolute -top-24 left-0 h-56 w-56 rounded-full bg-emerald-500/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 right-0 h-56 w-56 rounded-full bg-sky-500/15 blur-3xl" />

          <div className="relative">
            <div className="text-2xl sm:text-3xl font-extrabold tracking-tight">บันทึกรายการ</div>
            <div className="mt-1 text-sm text-slate-300">
              บันทึกรายรับ/รายจ่าย • ถ้า “รายจ่ายเกินงบ” ระบบจะแจ้งเตือนทันที
            </div>
          </div>
        </div>

        {/* ปุ่มเลือกประเภทรายการ (รายจ่าย หรือ รายรับ) */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6 shadow-glow backdrop-blur-xl">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setType("expense")}
              className={cls(
                "flex-1 rounded-2xl border px-4 py-3 text-sm font-extrabold transition",
                "focus:outline-none focus:ring-2 focus:ring-sky-500/40",
                type === "expense"
                  ? "border-rose-400/25 bg-rose-500/10 text-rose-100"
                  : "border-white/10 bg-slate-950/30 text-slate-200 hover:bg-white/[0.06]"
              )}
            >
              รายจ่าย
            </button>
            <button
              type="button"
              onClick={() => setType("income")}
              className={cls(
                "flex-1 rounded-2xl border px-4 py-3 text-sm font-extrabold transition",
                "focus:outline-none focus:ring-2 focus:ring-sky-500/40",
                type === "income"
                  ? "border-emerald-400/25 bg-emerald-500/10 text-emerald-100"
                  : "border-white/10 bg-slate-950/30 text-slate-200 hover:bg-white/[0.06]"
              )}
            >
              รายรับ
            </button>
          </div>

          {/* ฟอร์มสำหรับกรอกข้อมูลการบันทึก */}
          <form onSubmit={onSubmit} className="mt-5 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4">
                <div className="text-sm font-bold text-slate-200">จำนวนเงิน</div>
                <div className="mt-2">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={amount}
                    onChange={(e) => {
                      let value = e.target.value;

                      // อนุญาตเฉพาะตัวเลข และจุดทศนิยม
                      if (!/^\d*\.?\d*$/.test(value)) return;

                      // จำกัดทศนิยมไม่เกิน 2 ตำแหน่ง
                      if (value.includes(".")) {
                        const [integer, decimal] = value.split(".");
                        if (decimal.length > 2) return;
                      }

                      setAmount(value);
                    }}
                    placeholder="เช่น 120.50"
                    className="h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-base font-extrabold outline-none focus:ring-2 focus:ring-sky-500/40"
                  />
                </div>
                <div className="mt-2 text-xs text-slate-400">
                  Preview: <span className="font-bold text-slate-200">{fmtMoney(parsedAmount)}</span>
                </div>
              </div>

              {/* วันที่ */}
              <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4">
                <div className="text-sm font-bold text-slate-200">วันที่</div>
                <div className="mt-2">
                  <input
                    type="date"
                    value={occurredOn}
                    onChange={(e) => setOccurredOn(e.target.value)}
                    className="h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm font-bold outline-none focus:ring-2 focus:ring-sky-500/40"
                  />
                </div>
                <div className="mt-2 text-xs text-slate-400">เลือกวันที่เกิดรายการ</div>
              </div>
            </div>

            {/* หมวดหมู่ */}
            <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <div className="text-sm font-bold text-slate-200">หมวดหมู่</div>
                  <div className="mt-1 text-xs text-slate-400">พิมพ์หรือแตะหมวดหมู่แนะนำ</div>
                </div>
                <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-slate-200">
                  {type === "income" ? "Income" : "Expense"}
                </div>
              </div>

              <div className="mt-3">
                <input
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder={type === "income" ? "เช่น เงินเดือน" : "เช่น อาหาร"}
                  className="h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm font-bold outline-none focus:ring-2 focus:ring-sky-500/40"
                />
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {quickCats.map((c) => (
                  <button
                    type="button"
                    key={c}
                    onClick={() => setCategory(c)}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-extrabold text-slate-200 transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* หมายเหตุ */}
            <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4">
              <div className="text-sm font-bold text-slate-200">หมายเหตุ (ไม่บังคับ)</div>
              <div className="mt-2">
                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="เช่น กาแฟตอนเช้า / ค่ารถไฟฟ้า"
                  className="h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm outline-none focus:ring-2 focus:ring-sky-500/40"
                />
              </div>
              <div className="mt-2 text-xs text-slate-400">ช่วยให้ค้นหาในหน้าธุรกรรมได้ง่าย</div>
            </div>

            {/* ปุ่มบันทึก */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-slate-300">
                ถ้ารายจ่ายเดือนนี้เกินงบ ระบบจะแจ้งเตือนทันทีหลังบันทึก
              </div>

              <button
                disabled={saving}
                className={cls(
                  "h-12 rounded-2xl px-6 text-sm font-extrabold transition",
                  "border border-white/10 bg-white/10 text-white shadow-soft",
                  "hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-sky-500/40",
                  saving ? "opacity-60 cursor-not-allowed" : ""
                )}
                type="submit"
              >
                {saving ? "กำลังบันทึก..." : "บันทึก"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
