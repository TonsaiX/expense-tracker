import React, { useMemo } from "react";
import { fmtMoney } from "../api.js";

// ฟังก์ชันที่ใช้สำหรับรวมคลาสที่ใช้ในหลายๆ ที่
function cls(...a) {
  return a.filter(Boolean).join(" ");
}

// ฟังก์ชันสำหรับแสดงเปอร์เซ็นต์
function pct(v) {
  if (v === null || v === undefined) return "—";
  return `${(v * 100).toFixed(0)}%`; // คืนค่าผลลัพธ์เป็นเปอร์เซ็นต์
}

export default function AiInsights({ data }) {
  // ดึงข้อมูล verdict จาก ai data และตั้งค่าเริ่มต้นเป็น "neutral"
  const verdict = data?.ai?.verdict ?? "neutral";

  // ใช้ useMemo เพื่อคำนวณค่าของ badge ที่จะนำไปใช้ในคอมโพเนนต์
  const badge = useMemo(() => {
    if (verdict === "good") return "border-emerald-400/25 bg-emerald-500/10 text-emerald-100";
    if (verdict === "risk") return "border-rose-400/25 bg-rose-500/10 text-rose-100";
    return "border-white/10 bg-white/5 text-slate-200";
  }, [verdict]);

  // ใช้ useMemo เพื่อคำนวณสีของคะแนนสุขภาพการเงิน
  const scoreColor = useMemo(() => {
    const s = data?.ai?.score ?? 0;
    if (s >= 70) return "text-emerald-200"; // ถ้าคะแนนมากกว่าหรือเท่ากับ 70 ให้ใช้สีเขียว
    if (s <= 40) return "text-rose-200"; // ถ้าคะแนนน้อยกว่าหรือเท่ากับ 40 ให้ใช้สีแดง
    return "text-sky-200"; // ถ้าคะแนนระหว่าง 41 - 69 ให้ใช้สีฟ้า
  }, [data]);

  // ดึงข้อมูลการเปรียบเทียบค่าใช้จ่ายและรายรับกับค่าเฉลี่ย
  const expenseVsAvg = data?.baseline?.expenseVsAvg ?? null;
  const incomeVsAvg = data?.baseline?.incomeVsAvg ?? null;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 shadow-glow backdrop-blur-xl">
      <div className="pointer-events-none absolute -top-24 left-0 h-56 w-56 rounded-full bg-sky-500/18 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 right-0 h-56 w-56 rounded-full bg-violet-500/18 blur-3xl" />

      <div className="relative">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-base font-extrabold tracking-tight">AI Insights</div>
            <div className="mt-1 text-sm text-slate-400">
              ทำนายแนวโน้มการใช้เงิน (อิงจากข้อมูลจริงในระบบ)
            </div>
          </div>

          {/* แสดงข้อความจาก AI */}
          <div className={cls("rounded-full border px-3 py-1 text-[11px] font-extrabold", badge)}>
            {data?.ai?.message ?? "—"}
          </div>
        </div>

        {/* Score + predictions */}
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4">
            <div className="text-xs text-slate-400">คะแนนสุขภาพการเงิน (0–100)</div>
            <div className={cls("mt-1 text-3xl font-extrabold", scoreColor)}>
              {data?.ai?.score ?? "—"}
            </div>
            <div className="mt-2 text-xs text-slate-400">
              คำนวณจากพฤติกรรมการใช้เงินเทียบค่าเฉลี่ย
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4">
            <div className="text-xs text-slate-400">คาดการณ์สิ้นเดือน (รายจ่าย)</div>
            <div className="mt-1 text-xl font-extrabold text-rose-200">
              {fmtMoney(data?.forecast?.expense ?? 0)}
            </div>
            <div className="mt-2 text-xs text-slate-400">
              Pace: {fmtMoney(data?.toDate?.expensePerDay ?? 0)}/วัน • ใช้ไปแล้ว{" "}
              {data?.dayOfMonth}/{data?.daysInMonth} วัน
            </div>
          </div>
        </div>

        {/* Comparisons */}
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4">
            <div className="text-xs text-slate-400">เทียบค่าเฉลี่ย 3 เดือนก่อนหน้า</div>

            <div className="mt-3 space-y-2 text-sm">
              {/* รายจ่ายเปรียบเทียบค่าเฉลี่ย */}
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-300">รายจ่าย (คาดการณ์)</span>
                <span
                  className={cls(
                    "font-extrabold",
                    expenseVsAvg === null
                      ? "text-slate-200"
                      : expenseVsAvg <= 0
                      ? "text-emerald-200"
                      : "text-rose-200"
                  )}
                >
                  {expenseVsAvg === null
                    ? "—"
                    : `${expenseVsAvg > 0 ? "+" : ""}${(expenseVsAvg * 100).toFixed(0)}%`}
                </span>
              </div>

              {/* รายรับเปรียบเทียบค่าเฉลี่ย */}
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-300">รายรับ (คาดการณ์)</span>
                <span
                  className={cls(
                    "font-extrabold",
                    incomeVsAvg === null
                      ? "text-slate-200"
                      : incomeVsAvg >= 0
                      ? "text-emerald-200"
                      : "text-rose-200"
                  )}
                >
                  {incomeVsAvg === null
                    ? "—"
                    : `${incomeVsAvg > 0 ? "+" : ""}${(incomeVsAvg * 100).toFixed(0)}%`}
                </span>
              </div>
            </div>

            <div className="mt-3 text-xs text-slate-400">
              ถ้ารายจ่ายเป็น “ค่าบวก” แปลว่าใช้มากกว่าเฉลี่ย
            </div>
          </div>

          {/* Short recommendations */}
          <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4">
            <div className="text-xs text-slate-400">คำแนะนำสั้น ๆ</div>

            <ul className="mt-3 space-y-2 text-sm text-slate-200">
              <li className="flex gap-2">
                <span className="text-sky-200">•</span>
                ถ้า “คาดการณ์รายจ่าย” สูง ให้กำหนดเพดานรายวันประมาณ{" "}
                <span className="font-extrabold text-slate-100">
                  {fmtMoney(
                    (data?.forecast?.expense ?? 0) /
                      Math.max(1, data?.daysInMonth ?? 30)
                  )}
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-sky-200">•</span>
                บันทึกรายการทุกวัน จะช่วยให้ AI วิเคราะห์ได้แม่นยำขึ้น
              </li>
              <li className="flex gap-2">
                <span className="text-sky-200">•</span>
                ลองดูหมวดที่ใช้บ่อยที่สุด แล้วตั้งงบเฉพาะหมวดนั้น
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/30 p-4 text-xs text-slate-400">
          * การทำนายใช้วิธี pace รายวัน + เทียบค่าเฉลี่ย 3 เดือนก่อนหน้า
        </div>
      </div>
    </div>
  );
}
