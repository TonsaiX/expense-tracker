import React, { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as ReTooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from "recharts";
import { fmtMoney } from "../api.js";

function TooltipBox({ active, payload, label, kind }) {
  if (!active || !payload || payload.length === 0) return null;

  if (kind === "pie") {
    const v = payload?.[0]?.value ?? 0;
    const name = payload?.[0]?.name ?? "";
    return (
      <div className="rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-slate-100 shadow-glow backdrop-blur-xl">
        <div className="font-extrabold">{name}</div>
        <div className="mt-1 text-slate-200">{fmtMoney(v)}</div>
      </div>
    );
  }

  const income = payload.find((p) => p.dataKey === "income")?.value ?? 0;
  const expense = payload.find((p) => p.dataKey === "expense")?.value ?? 0;

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-slate-100 shadow-glow backdrop-blur-xl">
      <div className="font-extrabold">{label}</div>
      <div className="mt-2 space-y-1">
        <div className="flex items-center justify-between gap-4">
          <span className="text-emerald-200">รายรับ</span>
          <span className="font-bold">{fmtMoney(income)}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-rose-200">รายจ่าย</span>
          <span className="font-bold">{fmtMoney(expense)}</span>
        </div>
      </div>
    </div>
  );
}

const TH_MONTH = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

function monthLabel(monthKey) {
  // monthKey: "YYYY-MM"
  const m = Number(String(monthKey || "").slice(5, 7));
  return TH_MONTH[m - 1] ?? String(monthKey || "");
}

export default function ChartsSummary({ summary, seriesMonths, mode }) {
  const [C, setC] = useState({
    income: "#22c55e",
    expense: "#fb7185",
    grid: "rgba(255,255,255,0.10)",
    axis: "rgba(226,232,240,0.70)",
    border: "rgba(255,255,255,0.10)",
    muted: "rgba(226,232,240,0.70)"
  });

  useEffect(() => {
    const css = getComputedStyle(document.documentElement);
    const v = (name, fallback) => (css.getPropertyValue(name)?.trim() || fallback);
    setC({
      income: v("--good", "#22c55e"),
      expense: v("--bad", "#fb7185"),
      grid: v("--border", "rgba(255,255,255,0.10)"),
      axis: v("--muted", "rgba(226,232,240,0.70)"),
      border: v("--border", "rgba(255,255,255,0.10)"),
      muted: v("--muted", "rgba(226,232,240,0.70)")
    });
  }, []);

  const showYear = mode === "year";

  // Pie
  const pieData = useMemo(() => {
    const income = Number(summary?.incomeTotal ?? 0);
    const expense = Number(summary?.expenseTotal ?? 0);
    return [
      { name: "รายรับ", value: income, key: "income" },
      { name: "รายจ่าย", value: expense, key: "expense" }
    ];
  }, [summary]);

  const hasAnyPie = useMemo(() => {
    const inc = Number(summary?.incomeTotal ?? 0);
    const exp = Number(summary?.expenseTotal ?? 0);
    return inc > 0 || exp > 0;
  }, [summary]);

  // Year bar data
  const barData = useMemo(() => {
    const src = Array.isArray(seriesMonths) ? seriesMonths : [];
    return src.map((it) => ({
      monthLabel: monthLabel(it.month),
      monthKey: it.month,
      income: Number(it.income || 0),
      expense: Number(it.expense || 0)
    }));
  }, [seriesMonths]);

  return (
    <div className={showYear ? "grid gap-4 lg:grid-cols-2" : "grid gap-4"}>
      {/* ✅ Pie: ปกติแสดงทุกโหมด แต่ “รายปีบนมือถือ” ให้ซ่อน */}
      <div
        className={[
          "relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 shadow-glow backdrop-blur-xl",
          showYear ? "hidden lg:block" : ""
        ].join(" ")}
      >
        <div className="relative">
          <div className="flex items-end justify-between gap-3">
            <div>
              <div className="text-base font-extrabold tracking-tight">สัดส่วนรายรับ/รายจ่าย</div>
              <div className="mt-1 text-sm text-slate-400">
                ภาพรวมช่วงที่เลือก ({mode === "year" ? "รายปี" : mode === "month" ? "รายเดือน" : "รายวัน"})
              </div>
            </div>
          </div>

          <div className="mt-4 h-[260px]">
            {hasAnyPie ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} paddingAngle={3}>
                    {pieData.map((entry) => (
                      <Cell
                        key={entry.key}
                        fill={entry.key === "income" ? C.income : C.expense}
                        stroke={C.border}
                      />
                    ))}
                  </Pie>
                  <ReTooltip content={<TooltipBox kind="pie" />} />
                  <Legend wrapperStyle={{ color: C.muted, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="grid h-full place-items-center rounded-2xl border border-white/10 bg-slate-950/30 text-sm text-slate-300">
                ยังไม่มีข้อมูล
              </div>
            )}
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4">
              <div className="text-xs text-slate-400">รายรับรวม</div>
              <div className="mt-1 font-extrabold text-emerald-200">{fmtMoney(summary?.incomeTotal ?? 0)}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4">
              <div className="text-xs text-slate-400">รายจ่ายรวม</div>
              <div className="mt-1 font-extrabold text-rose-200">{fmtMoney(summary?.expenseTotal ?? 0)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ Bar: แสดงเฉพาะรายปี
          - มือถือ: แสดง (แทน Pie)
          - จอใหญ่: แสดงคู่กับ Pie */}
      {showYear ? (
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 shadow-glow backdrop-blur-xl">
          <div className="relative">
            <div className="flex items-end justify-between gap-3">
              <div>
                <div className="text-base font-extrabold tracking-tight">รายรับ vs รายจ่ายรายเดือน</div>
                <div className="mt-1 text-sm text-slate-400">รายปี • เปรียบเทียบแต่ละเดือน</div>
              </div>
            </div>

            <div className="mt-4 h-[280px] sm:h-[300px]">
              {barData.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} barGap={6}>
                    <CartesianGrid stroke={C.grid} vertical={false} />
                    <XAxis
                      dataKey="monthLabel"
                      stroke={C.axis}
                      tick={{ fontSize: 11, fill: C.axis }}
                      tickLine={false}
                      axisLine={{ stroke: C.grid }}
                    />
                    <YAxis
                      stroke={C.axis}
                      tick={{ fontSize: 11, fill: C.axis }}
                      tickLine={false}
                      axisLine={{ stroke: C.grid }}
                      width={48}
                    />
                    <ReTooltip content={<TooltipBox kind="bar" />} />
                    <Legend wrapperStyle={{ color: C.muted, fontSize: 12 }} />
                    <Bar dataKey="income" name="รายรับ" fill={C.income} radius={[10, 10, 0, 0]} />
                    <Bar dataKey="expense" name="รายจ่าย" fill={C.expense} radius={[10, 10, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="grid h-full place-items-center rounded-2xl border border-white/10 bg-slate-950/30 text-sm text-slate-300">
                  ยังไม่มีข้อมูลรายเดือนในปีนี้
                </div>
              )}
            </div>

            {/* ✅ เฉพาะมือถือ บอกว่าเปลี่ยนมาใช้ Bar แทน Pie */}
            <div className="mt-3 rounded-2xl border border-white/10 bg-slate-950/30 p-4 text-xs text-slate-400 lg:hidden">
              * โหมดรายปีบนมือถือจะแสดง BarChart แทน PieChart
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
