import React, { useEffect, useMemo, useState } from "react"; // นำเข้า React และ hooks ที่จำเป็น
import { api, fmtMoney, monthKey, toISODate } from "../api.js"; // นำเข้าฟังก์ชันต่างๆ จาก api.js
import StatCard from "../components/StatCard.jsx"; // คอมโพเนนต์สำหรับแสดงสถิติต่างๆ
import CalendarMonth from "../components/CalendarMonth.jsx"; // คอมโพเนนต์สำหรับแสดงปฏิทินรายเดือน
import ChartsSummary from "../components/ChartsSummary.jsx"; // คอมโพเนนต์สำหรับแสดงกราฟสรุป
import AiInsights from "../components/AiInsights.jsx"; // คอมโพเนนต์สำหรับแสดงข้อมูลจาก AI
import BudgetCard from "../components/BudgetCard.jsx"; // คอมโพเนนต์สำหรับแสดงงบประมาณ

function cls(...a) {
  return a.filter(Boolean).join(" "); // ฟังก์ชันช่วยรวม classNames ที่ให้มา
}

// ฟังก์ชันช่วยในการคำนวณวันแรกของเดือน
function firstDayOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1); // คืนค่าวันแรกของเดือนที่กำหนด
}

// ฟังก์ชันช่วยในการคำนวณวันแรกของเดือนถัดไป
function firstDayOfNextMonth(d) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 1); // คืนค่าวันแรกของเดือนถัดไป
}

// ฟังก์ชันช่วยในการคำนวณวันแรกของปี
function firstDayOfYear(y) {
  return new Date(y, 0, 1); // คืนค่าวันแรกของปี
}

// ฟังก์ชันช่วยในการคำนวณวันแรกของปีถัดไป
function firstDayOfNextYear(y) {
  return new Date(y + 1, 0, 1); // คืนค่าวันแรกของปีถัดไป
}

// ฟังก์ชันช่วยในการเพิ่มจำนวนวันให้กับวันที่
function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n); // เพิ่มจำนวนวันตามที่ระบุ
  return x;
}

// ฟังก์ชันช่วยในการดึงปีจากวันที่
function yearKey(d = new Date()) {
  return String(d.getFullYear()); // คืนค่าปีของวันที่ในรูปแบบ string
}

// ฟังก์ชันช่วยเติมข้อมูลจาก backend ให้ครบทั้ง 12 เดือน
function fillYearMonths(yearStr, items) {
  const map = new Map(); // ใช้ Map เพื่อเก็บข้อมูลตามเดือน
  for (const it of items || []) {
    if (it?.month) map.set(it.month, it); // เติมข้อมูลตามเดือน
  }

  const out = [];
  for (let m = 1; m <= 12; m++) {
    const mm = String(m).padStart(2, "0"); // เติมเลขเดือนให้ครบ 2 หลัก
    const key = `${yearStr}-${mm}`;

    const row = map.get(key); // ดึงข้อมูลจาก Map ตามเดือน
    out.push({
      month: key,
      income: row ? Number(row.income || 0) : 0,
      expense: row ? Number(row.expense || 0) : 0
    });
  }
  return out; // คืนข้อมูลที่ได้
}

export default function Dashboard() {
  const [mode, setMode] = useState("month"); // โหมดการแสดงผล: "day", "month", "year"

  // ค่าที่เลือกจากผู้ใช้
  const [pickedDay, setPickedDay] = useState(toISODate(new Date())); // วันที่ที่เลือก
  const [pickedMonth, setPickedMonth] = useState(monthKey(new Date())); // เดือนที่เลือก
  const [pickedYear, setPickedYear] = useState(yearKey(new Date())); // ปีที่เลือก

  // ข้อมูลที่ได้รับจาก API
  const [summary, setSummary] = useState({ incomeTotal: 0, expenseTotal: 0, net: 0 });
  const [balance, setBalance] = useState({ netAllTime: 0 });
  const [calendarDays, setCalendarDays] = useState([]);
  const [seriesMonths, setSeriesMonths] = useState([]);
  const [insights, setInsights] = useState(null);

  const [loading, setLoading] = useState(true); // สถานะการโหลดข้อมูล
  const [err, setErr] = useState(""); // ข้อความข้อผิดพลาด

  // ใช้ useMemo เพื่อคำนวณช่วงเวลา (start, end) ตามโหมดที่เลือก
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
    return new Date(y, m - 1, 1); // คืนค่าวันแรกของเดือนที่เลือก
  }, [pickedMonth]);

  // useEffect สำหรับดึงข้อมูลจาก API เมื่อค่าหรือช่วงเวลาเปลี่ยนแปลง
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setErr(""); // รีเซ็ตข้อความข้อผิดพลาด

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
          const filled = fillYearMonths(pickedYear, ser.items || []); // เติมเดือนให้ครบ 12 เดือน
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
      alive = false; // clean-up function
    };
  }, [mode, range.start, range.end, pickedMonth, pickedYear]);

  const netTone = useMemo(() => {
    const n = summary?.net ?? 0;
    return n >= 0 ? "green" : "red"; // สีตามสถานะยอดคงเหลือ
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
            <div className="mt-1 text-sm text-slate-300">เลือกดูได้: รายวัน • รายเดือน • รายปี</div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {/* Button for mode selection (Day, Month, Year) */}
            <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-950/30 p-2">
              {[{ key: "day", label: "รายวัน" }, { key: "month", label: "รายเดือน" }, { key: "year", label: "รายปี" }].map((x) => (
                <button
                  key={x.key}
                  onClick={() => setMode(x.key)}
                  className={cls(
                    "rounded-xl px-4 py-2 text-sm font-extrabold transition",
                    mode === x.key ? "bg-white/10 text-white shadow-soft" : "text-slate-200 hover:bg-white/10"
                  )}
                >
                  {x.label}
                </button>
              ))}
            </div>

            {/* Input field for picking date, month, or year */}
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

      {/* Error message */}
      {err ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">{err}</div>
      ) : null}

      {/* Stat cards */}
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

      {/* AI + Budget */}
      {mode === "month" && !loading ? (
        <>
          <AiInsights data={insights} />
          <BudgetCard month={pickedMonth} />
        </>
      ) : null}

      {/* Calendar */}
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
