export type Timeframe = "today" | "week" | "month" | "all";

export type Visit = {
  created_at: string | null;
  device: string | null;
  visitor_hash: string | null;
};

export type TrafficPoint = {
  label: string;
  visits: number;
  uniqueVisitors: number;
};

export const timeframeLabels: Record<Timeframe, string> = {
  today: "Today",
  week: "This week",
  month: "This month",
  all: "All time",
};

export function startOfDay(date: Date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

export function getStartDate(timeframe: Timeframe, now = new Date()) {
  if (timeframe === "today") return startOfDay(now);
  if (timeframe === "week") {
    const result = startOfDay(now);
    result.setDate(result.getDate() - 6);
    return result;
  }
  if (timeframe === "month") {
    const result = startOfDay(now);
    result.setDate(1);
    return result;
  }
  return null;
}

export function getBucket(date: Date, timeframe: Timeframe) {
  if (timeframe === "today") return `${String(date.getHours()).padStart(2, "0")}:00`;
  if (timeframe === "week") return date.toLocaleDateString("en-ZA", { weekday: "short" });
  if (timeframe === "month") return date.toLocaleDateString("en-ZA", { day: "2-digit", month: "short" });
  return date.toLocaleDateString("en-ZA", { month: "short", year: "2-digit" });
}

export function getTrafficData(visits: Visit[], timeframe: Timeframe): TrafficPoint[] {
  const buckets = new Map<string, { visits: number; hashes: Set<string> }>();

  visits.forEach((visit) => {
    if (!visit.created_at) return;
    const label = getBucket(new Date(visit.created_at), timeframe);
    const bucket = buckets.get(label) ?? { visits: 0, hashes: new Set<string>() };
    bucket.visits += 1;
    if (visit.visitor_hash) bucket.hashes.add(visit.visitor_hash);
    buckets.set(label, bucket);
  });

  return Array.from(buckets, ([label, bucket]) => ({
    label,
    visits: bucket.visits,
    uniqueVisitors: bucket.hashes.size,
  }));
}

export function countUniqueVisitors(visits: Visit[]) {
  return new Set(visits.map((visit) => visit.visitor_hash).filter(Boolean)).size;
}

export function getDeviceData(visits: Visit[]) {
  const counts = new Map<string, number>([["Mobile", 0], ["Desktop", 0]]);
  visits.forEach((visit) => {
    const device = visit.device?.toLowerCase();
    if (device?.includes("mobile")) counts.set("Mobile", (counts.get("Mobile") ?? 0) + 1);
    else if (device?.includes("desktop") || device?.includes("web")) {
      counts.set("Desktop", (counts.get("Desktop") ?? 0) + 1);
    }
  });
  return Array.from(counts, ([name, value], index) => ({
    name,
    value,
    fill: index === 0 ? "var(--primary)" : "var(--secondary)",
  }));
}