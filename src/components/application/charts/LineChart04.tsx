import {
  Area,
  AreaChart,
  CartesianGrid,
  Label,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

/**
 * Demo data — replace later with Supabase visits
 */
const lineData = [
  { date: new Date(2025, 0, 1), A: 600, B: 400, C: 100 },
  { date: new Date(2025, 1, 1), A: 620, B: 405, C: 160 },
  { date: new Date(2025, 2, 1), A: 630, B: 400, C: 170 },
  { date: new Date(2025, 3, 1), A: 650, B: 410, C: 190 },
  { date: new Date(2025, 4, 1), A: 600, B: 320, C: 200 },
  { date: new Date(2025, 5, 1), A: 650, B: 430, C: 230 },
  { date: new Date(2025, 6, 1), A: 620, B: 400, C: 200 },
  { date: new Date(2025, 7, 1), A: 750, B: 540, C: 300 },
  { date: new Date(2025, 8, 1), A: 780, B: 490, C: 390 },
  { date: new Date(2025, 9, 1), A: 750, B: 450, C: 300 },
  { date: new Date(2025, 10, 1), A: 780, B: 480, C: 340 },
  { date: new Date(2025, 11, 1), A: 820, B: 500, C: 450 },
];

export const LineChart04 = () => {
  return (
    <div className="h-60">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={lineData}>
          <CartesianGrid vertical={false} />

          <XAxis
            dataKey="date"
            tickFormatter={(value) =>
              value.toLocaleDateString(undefined, { month: "short" })
            }
          />

          <YAxis />

          <Tooltip
            formatter={(value) => Number(value).toLocaleString()}
            labelFormatter={(value) =>
              value.toLocaleDateString(undefined, {
                month: "short",
                year: "numeric",
              })
            }
          />

          <Legend />

          <Area dataKey="A" name="Visitors" stroke="currentColor" fillOpacity={0.2} />
          <Area dataKey="B" name="Mobile" stroke="currentColor" fillOpacity={0.2} />
          <Area dataKey="C" name="Desktop" stroke="currentColor" fillOpacity={0.2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
