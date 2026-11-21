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
    <Card className={className}>
      <CardHeader className='flex items-center gap-2'>
        <div className='bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-sm'>
          {icon}
        </div>
        <span className='text-2xl'>{value}</span>
      </CardHeader>
      <CardContent className='flex flex-col gap-2'>
        <span className='text-base font-semibold'>{title}</span>
        <p className='space-x-2'>
          <span>{changePercentage}</span>
          <span className='text-muted-foreground'>than last week</span>
        </p>
      </CardContent>
    </Card>
  )
}

export default StatisticsCard
