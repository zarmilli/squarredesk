import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/lib/supabase";

type Timeframe = "today" | "week" | "month" | "all";
type Visit = { created_at: string | null; device: string | null };
type TrafficPoint = { label: string; visits: number };

const timeframeLabels: Record<Timeframe, string> = {
  today: "Today",
  week: "This week",
  month: "This month",
  all: "All time",
};

const chartConfig = {
  visits: { label: "Visits", color: "var(--primary)" },
};

const deviceColors = ["var(--primary)", "var(--secondary)"];

function startOfDay(date: Date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function getStartDate(timeframe: Timeframe) {
  const now = new Date();
  if (timeframe === "today") return startOfDay(now);
  if (timeframe === "week") {
    const result = startOfDay(now);
    result.setDate(result.getDate() - 6);
    return result;
  }
  if (timeframe === "month") {
    const result = startOfDay(now);
    result.setDate(result.getDate() - 29);
    return result;
  }
  return null;
}

function getBucket(date: Date, timeframe: Timeframe) {
  if (timeframe === "today") return `${String(date.getHours()).padStart(2, "0")}:00`;
  if (timeframe === "week") return date.toLocaleDateString("en-ZA", { weekday: "short" });
  if (timeframe === "month") return String(date.getDate());
  return date.toLocaleDateString("en-ZA", { month: "short", year: "2-digit" });
}

function getTrafficData(visits: Visit[], timeframe: Timeframe): TrafficPoint[] {
  const counts = new Map<string, number>();
  visits.forEach((visit) => {
    if (!visit.created_at) return;
    const bucket = getBucket(new Date(visit.created_at), timeframe);
    counts.set(bucket, (counts.get(bucket) ?? 0) + 1);
  });
  return Array.from(counts, ([label, visits]) => ({ label, visits }));
}

function getDeviceData(visits: Visit[]) {
  const counts = new Map<string, number>([["Mobile", 0], ["Desktop", 0]]);
  visits.forEach((visit) => {
    const device = visit.device?.toLowerCase();
    if (device?.includes("mobile")) counts.set("Mobile", (counts.get("Mobile") ?? 0) + 1);
    else if (device?.includes("desktop") || device?.includes("web")) {
      counts.set("Desktop", (counts.get("Desktop") ?? 0) + 1);
    }
  });
  return Array.from(counts, ([name, value], index) => ({ name, value, fill: deviceColors[index] }));
}

export default function Stats() {
  const { id: siteId } = useParams<{ id: string }>();
  const [timeframe, setTimeframe] = useState<Timeframe>("today");
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function loadVisits() {
      if (!siteId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      const startDate = getStartDate(timeframe);
      let query = supabase
        .from("site_visits")
        .select("created_at, device")
        .eq("site_id", siteId)
        .order("created_at", { ascending: true });
      if (startDate) query = query.gte("created_at", startDate.toISOString());
      const { data, error } = await query;
      if (error) console.error(error);
      if (active) {
        setVisits((data as Visit[] | null) ?? []);
        setLoading(false);
      }
    }
    void loadVisits();
    return () => {
      active = false;
    };
  }, [siteId, timeframe]);

  const trafficData = getTrafficData(visits, timeframe);
  const deviceData = getDeviceData(visits);

  return (
    <div className="grid h-full grid-cols-1 gap-8 p-6 lg:grid-cols-3">
      <main className="lg:col-span-2">
        <Card>
          <CardHeader className="flex-row items-start justify-between gap-4">
            <div>
              <CardTitle>Site traffic</CardTitle>
              <CardDescription>{timeframeLabels[timeframe]} visits</CardDescription>
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">{timeframeLabels[timeframe]}</Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-40 p-1">
                {(Object.keys(timeframeLabels) as Timeframe[]).map((option) => (
                  <Button key={option} variant="ghost" className="w-full justify-start" onClick={() => setTimeframe(option)}>
                    {timeframeLabels[option]}
                  </Button>
                ))}
              </PopoverContent>
            </Popover>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[400px] w-full">
              <BarChart data={trafficData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} axisLine={false} tickLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="visits" fill="var(--color-visits)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
            {loading && <p className="text-center text-sm text-muted-foreground">Loading traffic...</p>}
          </CardContent>
        </Card>
      </main>

      <aside>
        <Card>
          <CardHeader>
            <CardTitle>Devices</CardTitle>
            <CardDescription>{timeframeLabels[timeframe]} visits</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{ mobile: { label: "Mobile", color: deviceColors[0] }, desktop: { label: "Desktop", color: deviceColors[1] } }}
              className="mx-auto h-[345px] w-full"
            >
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                <Pie data={deviceData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={65} outerRadius={105} paddingAngle={4}>
                  {deviceData.map((entry) => <Cell key={entry.name} fill={entry.fill} />)}
                </Pie>
              </PieChart>
            </ChartContainer>
            <div className="space-y-2 text-sm">
              {deviceData.map((device) => (
                <div key={device.name} className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: device.fill }} />
                    {device.name}
                  </span>
                  <span className="font-medium tabular-nums">{device.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}
