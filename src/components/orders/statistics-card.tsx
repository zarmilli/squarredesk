// Type Imports
import type { ReactNode } from 'react'

// Component Imports
import { Card, CardContent, CardHeader } from '@/components/ui/card'

// Statistics card data type
type StatisticsCardProps = {
  icon: ReactNode
  value: string
  title: string
  changePercentage: string
  className?: string
}

const StatisticsCard = ({ icon, value, title, changePercentage, className }: StatisticsCardProps) => {
  return (
    <Card className={`border border-border ${className ?? ''}`}>
      <CardHeader className='flex-row items-center justify-start gap-3 space-y-0 px-4 py-3 pb-8'>
        <div className='bg-muted text-muted-foreground flex size-10 shrink-0 items-center justify-center rounded-md'>
          {icon}
        </div>
        <span className='text-2xl font-semibold leading-none'>{value}</span>
      </CardHeader>
      <CardContent className='flex flex-col gap-1 px-4 pb-3 pt-0'>
        <span className='text-sm font-semibold'>{title}</span>
        <p className='space-x-2 text-xs'>
          <span>{changePercentage}</span>
          <span className='text-muted-foreground'>than last week</span>
        </p>
      </CardContent>
    </Card>
  )
}

export default StatisticsCard
