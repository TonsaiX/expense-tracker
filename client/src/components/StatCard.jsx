import React from "react";

// กำหนดสีไล่จากบนลงล่างตามธีมสีที่เลือก (tone)
const toneStyles = {
  green: "from-emerald-300/28 to-emerald-300/0",  // ไล่สีเขียว
  red: "from-rose-300/28 to-rose-300/0",        // ไล่สีแดง
  blue: "from-sky-300/28 to-sky-300/0",          // ไล่สีฟ้า
  violet: "from-violet-300/28 to-violet-300/0",  // ไล่สีม่วง
  pink: "from-pink-300/28 to-pink-300/0",        // ไล่สีชมพู
  slate: "from-white/12 to-white/0"              // สีเทา (ค่าเริ่มต้น)
};

// คอมโพเนนต์ StatCard ที่รับ props title, value, hint, และ tone
export default function StatCard({ title, value, hint, tone = "slate" }) {
  return (
    <div className="group relative overflow-hidden glass-card p-5 cute-hover">
      {/* พื้นหลังที่เป็นไล่สีตาม tone */}
      <div
        className={[
          "pointer-events-none absolute -top-24 left-1/2 h-48 w-72 -translate-x-1/2 rounded-full blur-3xl",
          "bg-gradient-to-b",  // ใช้พื้นหลังไล่สีจากบนลงล่าง
          toneStyles[tone] ?? toneStyles.slate // เลือก tone หรือใช้สีเทาเป็นค่าเริ่มต้น
        ].join(" ")}
      />
      <div className="relative">
        {/* แสดงหัวข้อ (title) ของสถิติ */}
        <div className="text-sm" style={{ color: "var(--muted)" }}>{title}</div>
        {/* แสดงค่า (value) ของสถิติ */}
        <div className="mt-2 text-3xl font-extrabold tracking-tight">{value}</div>
        {/* แสดง hint ถ้ามี */}
        {hint ? <div className="mt-1 text-xs" style={{ color: "var(--muted)" }}>{hint}</div> : null}
        {/* เส้นแบ่งขนาดเล็ก */}
        <div className="mt-4 h-px w-full bg-gradient-to-r from-white/16 via-white/6 to-transparent" />
      </div>
    </div>
  );
}
