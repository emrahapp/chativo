"use client";

import {
  ResponsiveContainer,
  LineChart, Line,
  BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
import { formatDateShort } from "@/lib/analytics/format";

const BRAND = "#6554E8";
const RATING_COLORS = ["#10B981", "#EF4444", "#9CA3AF"];

export function DailyMessagesChart({ data }: { data: { date: string; count: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <defs>
          <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={BRAND} stopOpacity={0.35} />
            <stop offset="100%" stopColor={BRAND} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="#ECECF4" strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={(v) => formatDateShort(v)}
          stroke="#9CA3AF"
          fontSize={11}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="#9CA3AF"
          fontSize={11}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={tooltipStyle}
          labelFormatter={(v) => formatDateShort(String(v))}
          formatter={(v: number) => [v, "Mesaj"]}
        />
        <Line
          type="monotone"
          dataKey="count"
          stroke={BRAND}
          strokeWidth={2.5}
          dot={{ r: 0 }}
          activeDot={{ r: 5, strokeWidth: 0, fill: BRAND }}
          fill="url(#lineGrad)"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function PerBotChart({ data }: { data: { bot: string; messages: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(180, data.length * 36)}>
      <BarChart data={data} layout="vertical" margin={{ left: 0, right: 16 }}>
        <CartesianGrid stroke="#ECECF4" strokeDasharray="3 3" horizontal={false} />
        <XAxis type="number" stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
        <YAxis
          type="category"
          dataKey="bot"
          stroke="#374151"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          width={120}
        />
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(v: number) => [v, "Mesaj"]}
        />
        <Bar dataKey="messages" fill={BRAND} radius={[0, 8, 8, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function RatingDonut({
  positive,
  negative,
  none,
}: {
  positive: number;
  negative: number;
  none: number;
}) {
  const data = [
    { name: "Olumlu", value: positive },
    { name: "Olumsuz", value: negative },
    { name: "Oylanmadı", value: none },
  ];
  const total = positive + negative + none;
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          innerRadius={48}
          outerRadius={80}
          paddingAngle={2}
          stroke="none"
        >
          {data.map((_, i) => (
            <Cell key={i} fill={RATING_COLORS[i]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(v: number, n: string) =>
            [`${v} (${total ? Math.round((v / total) * 100) : 0}%)`, n]
          }
        />
        <Legend
          verticalAlign="bottom"
          iconType="circle"
          wrapperStyle={{ fontSize: 12, color: "#6B7280" }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

const tooltipStyle = {
  background: "#fff",
  border: "1px solid #ECECF4",
  borderRadius: 10,
  fontSize: 12,
  boxShadow: "0 4px 24px rgba(17,24,39,0.06)",
};
