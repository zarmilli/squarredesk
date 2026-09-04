import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts";

const data = [
  { name: "Jan", total: 4200 },
  { name: "Feb", total: 5100 },
  { name: "Mar", total: 3900 },
  { name: "Apr", total: 6200 },
  { name: "May", total: 5700 },
  { name: "Jun", total: 6800 },
  { name: "Jul", total: 6100 },
  { name: "Aug", total: 7300 },
  { name: "Sep", total: 6400 },
  { name: "Oct", total: 7900 },
  { name: "Nov", total: 7500 },
  { name: "Dec", total: 8400 },
];

export function Overview() {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data}>
        <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis direction="ltr" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
        <Bar dataKey="total" fill="currentColor" radius={[4, 4, 0, 0]} className="fill-primary" />
      </BarChart>
    </ResponsiveContainer>
  );
}