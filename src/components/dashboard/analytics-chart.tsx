import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { getTrafficData, type Timeframe, type Visit } from "@/lib/site-analytics";

export function AnalyticsChart({ visits, timeframe }: { visits: Visit[]; timeframe: Timeframe }) {
  const data = getTrafficData(visits, timeframe);
  const config = {
    visits: { label: "Visits", color: "var(--chart-1)" },
    uniqueVisitors: { label: "Unique visitors", color: "var(--chart-2)" },
  };

  return (
    <ChartContainer config={config} className="h-[300px] w-full">
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="trafficVisitsGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-visits)" stopOpacity={0.3} />
            <stop offset="100%" stopColor="var(--color-visits)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="trafficUniqueGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-uniqueVisitors)" stopOpacity={0.2} />
            <stop offset="100%" stopColor="var(--color-uniqueVisitors)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="label" axisLine={false} tickLine={false} tickMargin={8} fontSize={12} />
        <YAxis allowDecimals={false} axisLine={false} tickLine={false} tickMargin={8} fontSize={12} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Area type="monotone" dataKey="visits" stroke="var(--color-visits)" strokeWidth={2} fill="url(#trafficVisitsGradient)" />
        <Area type="monotone" dataKey="uniqueVisitors" stroke="var(--color-uniqueVisitors)" strokeWidth={2} fill="url(#trafficUniqueGradient)" />
      </AreaChart>
    </ChartContainer>
  );
}