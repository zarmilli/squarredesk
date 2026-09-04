import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Activity, CreditCard, DollarSign, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/lib/supabase";
import { Analytics } from "@/components/dashboard/analytics";
import { RecentSales } from "@/components/dashboard/recent-sales";
import {
  getStartDate,
  getTrafficData,
  timeframeLabels,
  type Timeframe,
  type Visit,
} from "@/lib/site-analytics";

const chartConfig = { visits: { label: "Visits", color: "var(--primary)" } };

export default function Stats() {
  const { id: siteId } = useParams<{ id: string }>();
  const [timeframe, setTimeframe] = useState<Timeframe>("today");
  const [visits, setVisits] = useState<Visit[]>([]);
  const [monthlyVisits, setMonthlyVisits] = useState<Visit[]>([]);
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
        .select("created_at, device, visitor_hash")
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

  useEffect(() => {
    let active = true;
    async function loadMonthlyVisits() {
      if (!siteId) return;
      const { data, error } = await supabase
        .from("site_visits")
        .select("created_at, device, visitor_hash")
        .eq("site_id", siteId)
        .gte("created_at", getStartDate("month")?.toISOString() ?? "")
        .order("created_at", { ascending: true });
      if (error) console.error(error);
      if (active) setMonthlyVisits((data as Visit[] | null) ?? []);
    }
    void loadMonthlyVisits();
    return () => {
      active = false;
    };
  }, [siteId]);

  const trafficData = getTrafficData(visits, timeframe);
  const monthlyTraffic = monthlyVisits.length;

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="mb-2 flex items-center justify-between space-y-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Site traffic</h1>
          <p className="text-sm text-muted-foreground">
            Monitor visitors and engagement for this site.
          </p>
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              {timeframeLabels[timeframe]}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-40 p-1">
            {(Object.keys(timeframeLabels) as Timeframe[]).map((option) => (
              <Button
                key={option}
                variant="ghost"
                className="w-full justify-start"
                onClick={() => setTimeframe(option)}
              >
                {timeframeLabels[option]}
              </Button>
            ))}
          </PopoverContent>
        </Popover>
      </div>

      <Tabs orientation="vertical" defaultValue="overview" className="space-y-4">
        <div className="w-full overflow-x-auto pb-2">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="reports" disabled>
              Reports
            </TabsTrigger>
            <TabsTrigger value="notifications" disabled>
              Notifications
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-10 pt-4">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="pb-4">
                <div className="text-2xl font-bold">R45,231.89</div>
                <p className="text-xs text-muted-foreground">Demo statistic</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-10 pt-4">
                <CardTitle className="text-sm font-medium">Total Traffic</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="pb-4">
                <div className="text-2xl font-bold">{monthlyTraffic.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Current month visits</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-10 pt-4">
                <CardTitle className="text-sm font-medium">Sales</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="pb-4">
                <div className="text-2xl font-bold">+12,234</div>
                <p className="text-xs text-muted-foreground">Demo statistic</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-10 pt-4">
                <CardTitle className="text-sm font-medium">Active Sales</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="pb-4">
                <div className="text-2xl font-bold">+573</div>
                <p className="text-xs text-muted-foreground">Demo statistic</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-7">
            <Card className="col-span-1 lg:col-span-4">
              <CardHeader>
                <CardTitle>Site traffic</CardTitle>
                <CardDescription>{timeframeLabels[timeframe]} visits</CardDescription>
              </CardHeader>
              <CardContent className="ps-2">
                <ChartContainer config={chartConfig} className="h-[300px] w-full">
                  <BarChart data={trafficData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} axisLine={false} tickLine={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="visits" fill="var(--color-visits)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartContainer>
                {loading && (
                  <p className="text-center text-sm text-muted-foreground">Loading traffic...</p>
                )}
              </CardContent>
            </Card>
            <Card className="col-span-1 lg:col-span-3">
              <CardHeader>
                <CardTitle>Recent Sales</CardTitle>
                <CardDescription>You made 265 sales this month.</CardDescription>
              </CardHeader>
              <CardContent>
                <RecentSales />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Analytics visits={visits} timeframe={timeframe} onTimeframeChange={setTimeframe} />
        </TabsContent>
      </Tabs>
    </div>
  );
}