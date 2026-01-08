import React, { useMemo, useState } from "react";
import { fmtMoney, toISODate } from "../api.js";

function startOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function startOfCalendarGrid(monthDate) {
  const s = startOfMonth(monthDate);
  const day = s.getDay(); // 0 Sun..6 Sat
  const diff = (day + 6) % 7; // Monday=0
  const out = new Date(s);
  out.setDate(s.getDate() - diff);
  return out;
}

export default function CalendarMonth({ monthDate, daysData }) {
  const [selected, setSelected] = useState(null);

  const map = useMemo(() => {
    const m = new Map();
    for (const d of daysData || []) m.set(d.date, d.items);
    return m;
  }, [daysData]);

  const gridStart = useMemo(() => startOfCalendarGrid(monthDate), [monthDate]);

  const grid = useMemo(() => {
    const cells = [];
    const d = new Date(gridStart);
    for (let i = 0; i < 42; i++) {
      const iso = toISODate(d);
      const inMonth = d.getMonth() === monthDate.getMonth();
      const items = map.get(iso) ?? [];
      const income = items.filter(x => x.type === "income").reduce((s, x) => s + x.amount, 0);
      const expense = items.filter(x => x.type === "expense").reduce((s, x) => s + x.amount, 0);

      cells.push({ iso, day: d.getDate(), inMonth, items, income, expense });
      d.setDate(d.getDate() + 1);
    }
    return cells;
  }, [gridStart, monthDate, map]);

  const selectedItems = selected ? (map.get(selected) ?? []) : [];

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
      {/* Calendar */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5 shadow-glow backdrop-blur-xl">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-base font-extrabold tracking-tight">ปฏิทินธุรกรรม</div>
            <div className="text-sm text-slate-400">แตะวันที่เพื่อดูรายละเอียด</div>
          </div>

          <div className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300">
            {selected ? `เลือก: ${selected}` : "ยังไม่ได้เลือกวัน"}
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2 text-xs text-slate-400">
          {["จ", "อ", "พ", "พฤ", "ศ", "ส", "อา"].map((x) => (
            <div key={x} className="px-1 py-1 text-center">{x}</div>
          ))}
        </div>

        {/* Mobile: ลดความแน่นด้วย padding/ตัวเลข/ซ่อนข้อความบางส่วน */}
        <div className="mt-2 grid grid-cols-7 gap-2">
          {grid.map((c) => {
            const has = c.items.length > 0;
            const isSelected = selected === c.iso;

            return (
              <button
                key={c.iso}
                onClick={() => setSelected(c.iso)}
                className={[
                  "group relative overflow-hidden rounded-2xl border text-left transition",
                  "focus:outline-none focus:ring-2 focus:ring-sky-500/40",
                  // mobile padding smaller, desktop bigger
                  "p-2 sm:p-3",
                  c.inMonth ? "border-white/10 bg-slate-950/40" : "border-white/5 bg-slate-950/20 opacity-60",
                  isSelected ? "ring-2 ring-sky-500/30" : "hover:bg-white/[0.06]"
                ].join(" ")}
              >
                <div className="pointer-events-none absolute -top-10 right-0 h-24 w-24 rounded-full bg-white/10 blur-2xl opacity-0 transition group-hover:opacity-60" />

                <div className="flex items-start justify-between">
                  <div className="text-[12px] sm:text-sm font-extrabold">{c.day}</div>
                  {has ? (
                    <div className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] sm:text-[11px] text-slate-200">
                      {c.items.length}
                    </div>
                  ) : (
                    <div className="text-[10px] sm:text-[11px] text-slate-500">—</div>
                  )}
                </div>

                {has ? (
                  <div className="mt-2 space-y-1 text-[10px] sm:text-[11px]">
                    {/* มือถือ: แสดงแค่ยอดรวม (compact) / เดสก์ท็อป: แสดง label + money */}
                    {c.income > 0 ? (
                      <div className="text-emerald-200">
                        <span className="hidden sm:inline">รับ </span>
                        <span className="font-bold">{fmtMoney(c.income)}</span>
                      </div>
                    ) : null}
                    {c.expense > 0 ? (
                      <div className="text-rose-200">
                        <span className="hidden sm:inline">จ่าย </span>
                        <span className="font-bold">{fmtMoney(c.expense)}</span>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div className="mt-2 text-[10px] sm:text-[11px] text-slate-500">ไม่มี</div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Side panel (บนมือถือจะอยู่ด้านล่างโดยอัตโนมัติ เพราะไม่เข้า lg grid column) */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5 shadow-glow backdrop-blur-xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-base font-extrabold tracking-tight">รายละเอียดวัน</div>
            <div className="mt-1 text-sm text-slate-400">
              {selected ?? "เลือกวันที่จากปฏิทิน"}
            </div>
          </div>

          <div className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300">
            {selected ? `${selectedItems.length} รายการ` : "—"}
          </div>
        </div>

        {!selected ? (
          <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/30 p-4 text-sm text-slate-300">
            แตะวันที่เพื่อดูว่า “วันนั้นรับ/จ่ายจากอะไรบ้าง”
          </div>
        ) : null}

        <div className="mt-4 space-y-3">
          {selected && selectedItems.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4 text-sm text-slate-300">
              ไม่มีรายการในวันนี้
            </div>
          ) : null}

          {selectedItems.map((it) => (
            <div
              key={it.id}
              className="group rounded-2xl border border-white/10 bg-slate-950/30 p-4 transition hover:bg-white/[0.06]"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="truncate text-sm font-extrabold">{it.category}</div>
                  <div className="mt-1 line-clamp-2 text-xs text-slate-400">{it.note || "—"}</div>

                  <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-slate-200">
                    <span className={it.type === "income" ? "text-emerald-200" : "text-rose-200"}>
                      {it.type === "income" ? "รายรับ" : "รายจ่าย"}
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-300">{it.occurredOn}</span>
                  </div>
                </div>

                <div className={it.type === "income" ? "text-emerald-200" : "text-rose-200"}>
                  <div className="text-base sm:text-lg font-extrabold">
                    {it.type === "income" ? "+" : "-"}{fmtMoney(it.amount)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {selected ? (
          <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/30 p-4 text-xs text-slate-400">
            * Step ถัดไปจะเพิ่มปุ่ม “แก้ไข/ลบ” และ “เพิ่มรายการ” ให้ใช้งานบนมือถือแบบแตะง่าย
          </div>
        ) : null}
      </div>
    </div>
  );
}
