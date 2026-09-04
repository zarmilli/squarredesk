import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getDeviceData, countUniqueVisitors, timeframeLabels, type Timeframe, type Visit } from "@/lib/site-analytics";
import { AnalyticsChart } from "./analytics-chart";

type AnalyticsProps = {
  visits: Visit[];
  timeframe: Timeframe;
  onTimeframeChange: (timeframe: Timeframe) => void;
};

export function Analytics({ visits, timeframe, onTimeframeChange }: AnalyticsProps) {
  const devices = getDeviceData(visits);
  const totalDeviceVisits = devices.reduce((sum, device) => sum + device.value, 0);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>Traffic Overview</CardTitle>
            <CardDescription>{timeframeLabels[timeframe]} clicks and unique visitors</CardDescription>
          </div>
          <select
            aria-label="Analytics timeframe"
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            value={timeframe}
            onChange={(event) => onTimeframeChange(event.target.value as Timeframe)}
          >
            {(Object.keys(timeframeLabels) as Timeframe[]).map((option) => (
              <option key={option} value={option}>{timeframeLabels[option]}</option>
            ))}
          </select>
        </CardHeader>
        <CardContent className="px-6"><AnalyticsChart visits={visits} timeframe={timeframe} /></CardContent>
      </Card>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Total Clicks" value={visits.length.toLocaleString()} detail={timeframeLabels[timeframe]} />
        <MetricCard title="Unique Visitors" value={countUniqueVisitors(visits).toLocaleString()} detail="Distinct visitor hashes" />
        <MetricCard title="Bounce Rate" value="42%" detail="Demo statistic" />
        <MetricCard title="Avg. Session" value="3m 24s" detail="Demo statistic" />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-7">
        <Card className="col-span-1 lg:col-span-4">
          <CardHeader>
            <CardTitle>Referrers</CardTitle>
            <CardDescription>Top sources driving traffic</CardDescription>
          </CardHeader>
          <CardContent>
            <SimpleBarList
              items={[
                { name: "Direct", value: 512 },
                { name: "Product Hunt", value: 238 },
                { name: "Twitter", value: 174 },
                { name: "Blog", value: 104 },
              ]}
              barClass="bg-primary"
              valueFormatter={(n) => `${n}`}
            />
          </CardContent>
        </Card>
        <Card className="col-span-1 lg:col-span-3">
          <CardHeader>
            <CardTitle>Devices</CardTitle>
            <CardDescription>How users access your site</CardDescription>
          </CardHeader>
          <CardContent>
            <SimpleBarList
              items={devices.map((device) => ({
                name: device.name,
                value: totalDeviceVisits > 0 ? Math.round((device.value / totalDeviceVisits) * 100) : 0,
              }))}
              barClass="bg-muted-foreground"
              valueFormatter={(n) => `${n}%`}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MetricCard({ title, value, detail }: { title: string; value: string; detail: string }) {
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">{title}</CardTitle></CardHeader>
      <CardContent><div className="text-2xl font-bold">{value}</div><p className="text-xs text-muted-foreground">{detail}</p></CardContent>
    </Card>
  );
}

function SimpleBarList({
  items,
  valueFormatter,
  barClass,
}: {
  items: { name: string; value: number }[];
  valueFormatter: (n: number) => string;
  barClass: string;
}) {
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <ul className="space-y-3">
      {items.map((i) => {
        const width = `${Math.round((i.value / max) * 100)}%`;
        return (
          <li key={i.name} className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="mb-1 truncate text-xs text-muted-foreground">{i.name}</div>
              <div className="h-2.5 w-full rounded-full bg-muted">
                <div className={`h-2.5 rounded-full ${barClass}`} style={{ width }} />
              </div>
            </div>
            <div className="ps-2 text-xs font-medium tabular-nums">{valueFormatter(i.value)}</div>
          </li>
        );
      })}
    </ul>
  );
}