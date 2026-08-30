"use client";

import { Line, LineChart, XAxis, YAxis } from "recharts";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { cn } from "@/lib/utils";

type WeeklyPoint = {
  week: string;
  value: number;
};

interface StatsCard1Props {
  title?: string;
  value?: string;
  weeklyData?: WeeklyPoint[];
  className?: string;
  onSeeDetail?: () => void;
}

const defaultWeeklyData: WeeklyPoint[] = [
  { week: "Week 1", value: 8200 },
  { week: "Week 2", value: 9100 },
  { week: "Week 3", value: 9800 },
  { week: "Week 4", value: 10400 },
  { week: "Week 5", value: 11200 },
];

const StatsCard1 = ({
  title = "Total Revenue",
  value = "$45,231.89",
  weeklyData = defaultWeeklyData,
  className,
  onSeeDetail,
}: StatsCard1Props) => {
  const current = weeklyData[weeklyData.length - 1]?.value ?? 0;
  const previous = weeklyData[weeklyData.length - 2]?.value ?? 0;
  const isUp = current >= previous;
  const lineColor = isUp ? "var(--primary)" : "#ef4444";

  const chartConfig = {
    value: {
      label: title,
      color: lineColor,
    },
  } satisfies ChartConfig;

  return (
    <Card className={cn("group relative w-full max-w-xs", className)}>
      <Button
        variant="default"
        size="sm"
        className="absolute top-3 right-3 z-10 h-7 px-2 text-xs opacity-0 transition-opacity group-hover:opacity-100"
        onClick={onSeeDetail}
      >
        See detail
      </Button>

      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="text-3xl font-bold">{value}</div>

        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-16 w-full [&_.recharts-responsive-container]:!h-full"
        >
          <LineChart
            data={weeklyData}
            margin={{ top: 4, right: 4, left: 4, bottom: 0 }}
          >
            <XAxis dataKey="week" hide />
            <YAxis hide domain={["dataMin", "dataMax"]} />
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
            <Line
              type="monotone"
              dataKey="value"
              stroke={lineColor}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: lineColor, stroke: lineColor }}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

export { StatsCard1 };
export type { WeeklyPoint };
