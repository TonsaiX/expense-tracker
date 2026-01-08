import React from "react";

const toneStyles = {
  green: "from-emerald-300/28 to-emerald-300/0",
  red: "from-rose-300/28 to-rose-300/0",
  blue: "from-sky-300/28 to-sky-300/0",
  violet: "from-violet-300/28 to-violet-300/0",
  pink: "from-pink-300/28 to-pink-300/0",
  slate: "from-white/12 to-white/0"
};

export default function StatCard({ title, value, hint, tone = "slate" }) {
  return (
    <div className="group relative overflow-hidden glass-card p-5 cute-hover">
      <div
        className={[
          "pointer-events-none absolute -top-24 left-1/2 h-48 w-72 -translate-x-1/2 rounded-full blur-3xl",
          "bg-gradient-to-b",
          toneStyles[tone] ?? toneStyles.slate
        ].join(" ")}
      />
      <div className="relative">
        <div className="text-sm" style={{ color: "var(--muted)" }}>{title}</div>
        <div className="mt-2 text-3xl font-extrabold tracking-tight">{value}</div>
        {hint ? <div className="mt-1 text-xs" style={{ color: "var(--muted)" }}>{hint}</div> : null}
        <div className="mt-4 h-px w-full bg-gradient-to-r from-white/16 via-white/6 to-transparent" />
      </div>
    </div>
  );
}
