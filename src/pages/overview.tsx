import { useEffect, useRef, useState, type ComponentProps } from "react";
import { useNavigate } from "react-router-dom";

import { CreditCard } from "@/components/shared-assets/credit-card/credit-card";
import { StatsCard1 } from "@/components/stats-card1";
import { ChartGroup1 } from "@/components/chart-group1";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const pricingCardClass =
  "bg-white dark:bg-[#161616] border-1 border-stone-800 dark:border-stone-800";

const transactions = [
  { date: "28 Aug 2026", description: "Client payment", amount: 2500, type: "income" as const },
  { date: "26 Aug 2026", description: "Hosting fee", amount: -149, type: "expense" as const },
  { date: "24 Aug 2026", description: "Template sale", amount: 890, type: "income" as const },
  { date: "22 Aug 2026", description: "Subscription renewal", amount: -199, type: "expense" as const },
  { date: "19 Aug 2026", description: "Consulting deposit", amount: 3200, type: "income" as const },
  { date: "17 Aug 2026", description: "Domain renewal", amount: -89, type: "expense" as const },
];

function formatAmount(amount: number) {
  const prefix = amount >= 0 ? "+" : "-";
  return `${prefix}R${Math.abs(amount).toLocaleString("en-ZA", { minimumFractionDigits: 2 })}`;
}

function FullWidthCreditCard(props: ComponentProps<typeof CreditCard>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState<number>();

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const updateWidth = () => setWidth(node.offsetWidth);
    updateWidth();

    const observer = new ResizeObserver(updateWidth);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="w-full">
      {width ? <CreditCard {...props} width={width} className="w-full" /> : null}
    </div>
  );
}

export default function Payments() {
  const navigate = useNavigate();

  return (
    <div className="grid h-full grid-cols-1 gap-8 p-6 lg:grid-cols-3">
      {/* Main — 2 columns */}
      <div className="flex flex-col gap-8 lg:col-span-2">
        <section>
          <h2 className="mb-4 text-left text-lg font-semibold">Activity</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatsCard1
              title="Balance"
              value="R12,450.00"
              weeklyData={[
                { week: "Week 1", value: 10200 },
                { week: "Week 2", value: 10800 },
                { week: "Week 3", value: 11100 },
                { week: "Week 4", value: 11900 },
                { week: "Week 5", value: 12450 },
              ]}
              className={cn("max-w-none", pricingCardClass)}
            />
            <StatsCard1
              title="Revenue"
              value="R38,920.00"
              weeklyData={[
                { week: "Week 1", value: 28400 },
                { week: "Week 2", value: 31200 },
                { week: "Week 3", value: 33100 },
                { week: "Week 4", value: 35600 },
                { week: "Week 5", value: 38920 },
              ]}
              className={cn("max-w-none", pricingCardClass)}
            />
            <StatsCard1
              title="Expenses"
              value="R6,470.00"
              weeklyData={[
                { week: "Week 1", value: 7100 },
                { week: "Week 2", value: 6800 },
                { week: "Week 3", value: 6950 },
                { week: "Week 4", value: 6720 },
                { week: "Week 5", value: 6470 },
              ]}
              className={cn("max-w-none", pricingCardClass)}
            />
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-left text-lg font-semibold">Analytics</h2>
          <ChartGroup1
            className="py-0 [&_.container]:max-w-none [&_.container]:px-0"
            cardClassName={pricingCardClass}
          />
        </section>
      </div>

      {/* Sidebar — 1 column */}
      <aside className="flex flex-col gap-6 lg:col-span-1">
        <section>
          <h2 className="mb-4 text-left text-lg font-semibold">My Cards</h2>
          <div className="flex w-full flex-col gap-4">
            <FullWidthCreditCard
              company="Squarredesk Account"
              cardNumber="4532 8891 0044 2210"
              cardHolder="Thubelihle Zulu"
              cardExpiration="06/28"
              type="gray-light"
            />
            <div className="relative overflow-hidden rounded-2xl">
              <FullWidthCreditCard
                company="Capitec Business Account"
                cardNumber="5289 4412 0099 8831"
                cardHolder="Thubelihle Zulu"
                cardExpiration="09/29"
                type="transparent-gradient"
              />

              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/55 px-5 text-center backdrop-blur-[2px]">
                <p className="max-w-xs text-lg font-semibold text-white">
                  Open a Capitec business account
                </p>
                <Button
                  type="button"
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={() => navigate("/accountOpen")}
                >
                  Open account
                </Button>
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <Button variant="outline" className="w-full">
              Send
            </Button>
            <Button variant="outline" className="w-full">
              Request
            </Button>
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-left text-lg font-semibold">Latest Activity</h2>
          <div className="space-y-4">
            {transactions.map((tx) => (
              <div
                key={`${tx.date}-${tx.description}`}
                className="flex items-center justify-between gap-4"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{tx.description}</p>
                  <p className="text-xs text-muted-foreground">{tx.date}</p>
                </div>
                <span
                  className={cn(
                    "shrink-0 text-sm font-semibold tabular-nums",
                    tx.type === "income" ? "text-stone-200" : "text-red-500"
                  )}
                >
                  {formatAmount(tx.amount)}
                </span>
              </div>
            ))}
          </div>
        </section>
      </aside>
    </div>
  );
}
