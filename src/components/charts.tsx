"use client";

import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis,
  Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend,
} from "recharts";
import { Card } from "./ui";

const ACCENT = "#E11A22";
const GOLD = "#F5C542";
const GOOD = "#22C55E";
const BLUE = "#3B82F6";
const PALETTE = [ACCENT, GOLD, GOOD, BLUE, "#A855F7", "#F97316", "#9A9A9A"];

export function TrendLine({ data, xKey, lines, height = 240 }: {
  data: Record<string, unknown>[]; xKey: string;
  lines: { key: string; label: string; color?: string }[]; height?: number;
}) {
  return (
    <Card className="p-4">
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 8, right: 12, bottom: 4, left: -8 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={xKey} tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          {lines.map((l, i) => (
            <Line key={l.key} type="monotone" dataKey={l.key} name={l.label} stroke={l.color ?? PALETTE[i % PALETTE.length]} strokeWidth={2} dot={false} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}

export function BarChartSimple({ data, xKey, bars, height = 240 }: {
  data: Record<string, unknown>[]; xKey: string;
  bars: { key: string; label: string; color?: string }[]; height?: number;
}) {
  return (
    <Card className="p-4">
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 8, right: 12, bottom: 4, left: -8 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={xKey} tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          {bars.map((b, i) => (
            <Bar key={b.key} dataKey={b.key} name={b.label} fill={b.color ?? PALETTE[i % PALETTE.length]} radius={[4, 4, 0, 0]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}

export function DonutChart({ data, height = 240 }: { data: { name: string; value: number }[]; height?: number }) {
  return (
    <Card className="p-4">
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
            {data.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
          </Pie>
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: 11 }} />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  );
}

export { PALETTE };
