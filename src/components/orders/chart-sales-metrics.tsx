'use client'

// Third-party Imports
import { Label, Pie, PieChart } from 'recharts'
// Component Imports
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'

type Metric = {
  icon: React.ReactNode
  title: string
  value: string
}

type RevenuePoint = {
  month: string
  sales: number
  fill: string
}

type Props = {
  className?: string
  metrics: Metric[]
  revenueData: RevenuePoint[]
  revenueChange: number
  totalProfit: number
}

const SalesMetricsCard = ({ className, metrics, revenueData, revenueChange, totalProfit }: Props) => {
  const revenueChartConfig = {
    sales: { label: 'Sales' },
    ...Object.fromEntries(
      revenueData.map((point, index) => [point.month, {
        label: point.month,
        color: index === 0 ? 'var(--primary)' : `color-mix(in oklab, var(--primary) ${60 - index * 20}%, transparent)`
      }])
    )
  } satisfies ChartConfig

  return (
    <Card className={`flex h-full flex-col border border-border ${className ?? ''}`}>
      <CardContent className='flex-1 px-5 pb-3 pt-5'>
        <div className='grid gap-6 lg:grid-cols-5'>
          <div className='flex flex-col gap-4 lg:col-span-3'>
            <span className='text-lg font-semibold'>Sales metrics</span>
            <div className='grid gap-4 sm:grid-cols-2'>
              {metrics.map((metric) => (
                <Card key={metric.title} className='border-stone-200 shadow-none dark:border-stone-700'>
                  <CardContent className='flex items-center gap-3 px-4 py-3'>
                    <div className='bg-muted text-muted-foreground flex size-10 shrink-0 items-center justify-center rounded-md'>
                      {metric.icon}
                    </div>
                    <div className='flex flex-col gap-0.5'>
                      <span className='text-muted-foreground text-sm font-medium'>{metric.title}</span>
                      <span className='text-lg font-medium'>{metric.value}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
          <Card className='flex h-full flex-col border-stone-200 shadow-none dark:border-stone-700 lg:col-span-2'>
            <CardHeader className='gap-1 px-4 pb-2 pt-4'>
              <CardTitle className='text-lg font-semibold'>Revenue Change</CardTitle>
            </CardHeader>

            <CardContent className='flex flex-1 flex-col px-4 pb-4 pt-0'>
              <ChartContainer config={revenueChartConfig} className='h-[190px] w-full shrink-0 aspect-auto'>
                <PieChart margin={{ top: 0, bottom: 0, left: 0, right: 0 }}>
                  <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                  <Pie
                    data={revenueData}
                    dataKey='sales'
                    nameKey='month'
                    startAngle={300}
                    endAngle={660}
                    innerRadius={58}
                    outerRadius={75}
                    paddingAngle={2}
                  >
                    <Label
                      content={({ viewBox }) => {
                        if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                          return (
                            <text x={viewBox.cx} y={viewBox.cy} textAnchor='middle' dominantBaseline='middle'>
                              <tspan
                                x={viewBox.cx}
                                y={(viewBox.cy || 0) - 12}
                                className='fill-card-foreground text-lg font-medium'
                              >
                                R{totalProfit.toLocaleString('en-ZA', { maximumFractionDigits: 2 })}
                              </tspan>
                              <tspan
                                x={viewBox.cx}
                                y={(viewBox.cy || 0) + 19}
                                className='fill-muted-foreground text-sm'
                              >
                                Total Profit
                              </tspan>
                            </text>
                          )
                        }
                      }}
                    />
                  </Pie>
                </PieChart>
              </ChartContainer>
              <p className='mt-auto pt-3 text-center text-sm text-muted-foreground'>
                <span className='font-semibold text-foreground'>{revenueChange >= 0 ? '+' : ''}{revenueChange.toFixed(1)}%</span> versus the previous two months
              </p>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  )
}

export default SalesMetricsCard
