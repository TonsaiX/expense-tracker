import React, { useEffect, useMemo, useState } from "react";
import { api, fmtMoney, monthKey, toISODate } from "../api.js";
import StatCard from "../components/StatCard.jsx";
import CalendarMonth from "../components/CalendarMonth.jsx";
import ChartsSummary from "../components/ChartsSummary.jsx";
import AiInsights from "../components/AiInsights.jsx";
import BudgetCard from "../components/BudgetCard.jsx";

function cls(...a) {
  return a.filter(Boolean).join(" ");
}

function firstDayOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function firstDayOfNextMonth(d) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 1);
}
function firstDayOfYear(y) {
  return new Date(y, 0, 1);
}
function firstDayOfNextYear(y) {
  return new Date(y + 1, 0, 1);
}
function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
function yearKey(d = new Date()) {
  return String(d.getFullYear());
}

function fillYearMonths(yearStr, items) {
  // items from backend: [{ month:"YYYY-MM", income, expense }]
  const map = new Map();
  for (const it of items || []) {
    if (it?.month) map.set(it.month, it);
  }

  const out = [];
  for (let m = 1; m <= 12; m++) {
    const mm = String(m).padStart(2, "0");
    const key = `${yearStr}-${mm}`;

    const row = map.get(key);
    out.push({
      month: key,
      income: row ? Number(row.income || 0) : 0,
      expense: row ? Number(row.expense || 0) : 0
    });
  }
  return out;
}

export default function Dashboard() {
  // mode: day | month | year
  const [mode, setMode] = useState("month");

  // pickers
  const [pickedDay, setPickedDay] = useState(toISODate(new Date())); // YYYY-MM-DD
  const [pickedMonth, setPickedMonth] = useState(monthKey(new Date())); // YYYY-MM
  const [pickedYear, setPickedYear] = useState(yearKey(new Date())); // YYYY

  // data
  const [summary, setSummary] = useState({ incomeTotal: 0, expenseTotal: 0, net: 0 });
  const [balance, setBalance] = useState({ netAllTime: 0 });
  const [calendarDays, setCalendarDays] = useState([]);
  const [seriesMonths, setSeriesMonths] = useState([]); // ✅ always 12 items in year mode
  const [insights, setInsights] = useState(null);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const range = useMemo(() => {
    if (mode === "day") {
      const d = new Date(pickedDay);
      const start = toISODate(d);
      const end = toISODate(addDays(d, 1));
      return { start, end, titleHint: `รายวัน: ${pickedDay}` };
    }

    if (mode === "year") {
      const y = Number(pickedYear);
      const start = toISODate(firstDayOfYear(y));
      const end = toISODate(firstDayOfNextYear(y));
      return { start, end, titleHint: `รายปี: ${pickedYear}` };
    }

    const [yy, mm] = pickedMonth.split("-").map(Number);
    const md = new Date(yy, mm - 1, 1);
    const start = toISODate(firstDayOfMonth(md));
    const end = toISODate(firstDayOfNextMonth(md));
    return { start, end, titleHint: `รายเดือน: ${pickedMonth}` };
  }, [mode, pickedDay, pickedMonth, pickedYear]);

  const monthDate = useMemo(() => {
    const [y, m] = pickedMonth.split("-").map(Number);
    return new Date(y, m - 1, 1);
  }, [pickedMonth]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setErr("");

    const calls = [
      api.get("/api/dashboard/summary-range", { params: { start: range.start, end: range.end } }),
      api.get("/api/dashboard/balance")
    ];

    if (mode === "month") {
      calls.push(api.get("/api/dashboard/calendar", { params: { start: range.start, end: range.end } }));
    }

    if (mode === "year") {
      calls.push(api.get("/api/dashboard/series", { params: { start: range.start, end: range.end, bucket: "month" } }));
    }

    if (mode === "month") {
      calls.push(api.get("/api/insights/monthly", { params: { month: pickedMonth } }));
    }

    Promise.all(calls)
      .then((results) => {
        if (!alive) return;

        const summaryRes = results[0].data;
        const balanceRes = results[1].data;

        setSummary({
          incomeTotal: Number(summaryRes.incomeTotal ?? 0),
          expenseTotal: Number(summaryRes.expenseTotal ?? 0),
          net: Number(summaryRes.net ?? 0)
        });

        setBalance({
          netAllTime: Number(balanceRes.netAllTime ?? 0)
        });

        let idx = 2;

        if (mode === "month") {
          const cal = results[idx].data;
          setCalendarDays(cal.days || []);
          idx += 1;
        } else {
          setCalendarDays([]);
        }

        if (mode === "year") {
          const ser = results[idx].data;
          // ✅ เติมเดือนให้ครบ 12 เดือน
          const filled = fillYearMonths(pickedYear, ser.items || []);
          setSeriesMonths(filled);
          idx += 1;
        } else {
          setSeriesMonths([]);
        }

        if (mode === "month") {
          const ins = results[idx]?.data ?? null;
          setInsights(ins);
        } else {
          setInsights(null);
        }
      })
      .catch(() => {
        if (!alive) return;
        setErr("โหลดข้อมูล Dashboard ไม่สำเร็จ");
      })
      .finally(() => {
        if (!alive) return;
        setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [mode, range.start, range.end, pickedMonth, pickedYear]);

  const netTone = useMemo(() => {
    const n = summary?.net ?? 0;
    return n >= 0 ? "green" : "red";
  }, [summary]);

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6 shadow-glow backdrop-blur-xl">
        <div className="pointer-events-none absolute -top-24 left-0 h-56 w-56 rounded-full bg-sky-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 right-0 h-56 w-56 rounded-full bg-violet-500/20 blur-3xl" />

        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold tracking-tight">บันทึกรายรับ-รายจ่าย</div>
            <div className="mt-1 text-sm text-slate-300">
              เลือกดูได้: รายวัน • รายเดือน • รายปี
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-950/30 p-2">
              {[
                { key: "day", label: "รายวัน" },
                { key: "month", label: "รายเดือน" },
                { key: "year", label: "รายปี" }
              ].map((x) => (
                <button
                  key={x.key}
                  onClick={() => setMode(x.key)}
                  className={cls(
                    "rounded-xl px-4 py-2 text-sm font-extrabold transition",
                    "focus:outline-none focus:ring-2 focus:ring-sky-500/40",
                    mode === x.key ? "bg-white/10 text-white shadow-soft" : "text-slate-200 hover:bg-white/10"
                  )}
                >
                  {x.label}
                </button>
              ))}
            </div>

            {mode === "day" ? (
              <input
                type="date"
                value={pickedDay}
                onChange={(e) => setPickedDay(e.target.value)}
                className="h-11 rounded-2xl border border-white/10 bg-slate-950/40 px-4 text-sm font-bold outline-none focus:ring-2 focus:ring-sky-500/40"
              />
            ) : mode === "year" ? (
              <input
                type="number"
                value={pickedYear}
                onChange={(e) => setPickedYear(e.target.value)}
                min="2000"
                max="2100"
                className="h-11 w-32 rounded-2xl border border-white/10 bg-slate-950/40 px-4 text-sm font-bold outline-none focus:ring-2 focus:ring-sky-500/40"
              />
            ) : (
              <input
                type="month"
                value={pickedMonth}
                onChange={(e) => setPickedMonth(e.target.value)}
                className="h-11 rounded-2xl border border-white/10 bg-slate-950/40 px-4 text-sm font-bold outline-none focus:ring-2 focus:ring-sky-500/40"
              />
            )}
          </div>
        </div>
      </div>

      {err ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">{err}</div>
      ) : null}

      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title={`รายรับรวม (${mode === "day" ? "รายวัน" : mode === "year" ? "รายปี" : "รายเดือน"})`}
          value={fmtMoney(summary?.incomeTotal ?? 0)}
          hint={range.titleHint}
          tone="green"
        />
        <StatCard
          title={`รายจ่ายรวม (${mode === "day" ? "รายวัน" : mode === "year" ? "รายปี" : "รายเดือน"})`}
          value={fmtMoney(summary?.expenseTotal ?? 0)}
          hint={range.titleHint}
          tone="red"
        />
        <StatCard title="ยอดคงเหลือ" value={fmtMoney(summary?.net ?? 0)} hint="รายรับ - รายจ่าย" tone={netTone} />
      </div>

      {/* All time balance */}
      <div className="grid gap-4">
        <StatCard
          title="ยอดเงินคงเหลือทั้งหมด"
          value={fmtMoney(balance?.netAllTime ?? 0)}
          hint="รวมจากธุรกรรมทั้งหมด"
          tone="blue"
        />
      </div>

      {/* Charts */}
      {loading ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-slate-200 shadow-glow backdrop-blur-xl">
          กำลังโหลด...
        </div>
      ) : (
        <ChartsSummary
          summary={summary}
          seriesMonths={mode === "year" ? seriesMonths : []}
          mode={mode}
        />
      )}

      {/* AI + Budget: เฉพาะรายเดือน */}
      {mode === "month" && !loading ? (
        <>
          <AiInsights data={insights} />
          <BudgetCard month={pickedMonth} />
        </>
      ) : null}

      

      {/* Calendar: เฉพาะรายเดือน */}
      {mode === "month" ? (
        loading ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-slate-200 shadow-glow backdrop-blur-xl">
            กำลังโหลดปฏิทิน...
          </div>
        ) : (
          <CalendarMonth monthDate={monthDate} daysData={calendarDays} />
        )
      ) : (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300 shadow-soft backdrop-blur-xl">
          * ปฏิทินแสดงเฉพาะโหมด “รายเดือน”
        </div>
      )}
    </div>
  );
}
