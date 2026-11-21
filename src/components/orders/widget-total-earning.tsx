// Third-party Imports
import { EllipsisVerticalIcon, ChevronUpIcon, ChevronDownIcon } from 'lucide-react'

// Component Imports
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'

const listItems = ['Share', 'Update', 'Refresh']

type Props = {
  title: string
  earning: number
  trend: 'up' | 'down'
  percentage: number
  comparisonText: string
  productData: {
    image: string
    name: string
    price: string
    sales: number
  }[]
  className?: string
}

const TotalEarningCard = ({ productData, title, earning, trend, percentage, comparisonText, className }: Props) => {
  return (
    <Card className={`flex h-full flex-col border border-border ${className ?? ''}`}>
      <CardContent className='flex flex-col gap-4 px-5 pb-3 pt-5'>
        <span className='flex items-center justify-between'>
          <div className='text-lg font-semibold'>{title}</div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='ghost' size='icon' className='text-muted-foreground size-6 rounded-full'>
                <EllipsisVerticalIcon />
                <span className='sr-only'>Menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuGroup>
                {listItems.map((item, index) => (
                  <DropdownMenuItem key={index}>{item}</DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </span>
        <div className='flex flex-col gap-1'>
          <div className='flex items-center gap-2'>
            <span className='text-2xl font-semibold'>R{earning.toLocaleString('en-ZA')}</span>
            <span className='flex items-center gap-1'>
              {trend === 'up' ? <ChevronUpIcon className='size-4' /> : <ChevronDownIcon className='size-4' />}
              <span className='text-sm'>{percentage}%</span>
            </span>
          </div>
          <span className='text-muted-foreground text-sm'>{comparisonText}</span>
        </div>
      </CardContent>
      <CardContent className='flex flex-1 flex-col gap-3 px-5 pb-5 pt-3'>
        <div className='flex flex-col gap-3'>
          {productData.slice(0, 3).map((product) => (
            <div key={product.name} className='flex items-center gap-3'>
              <img
                src={product.image}
                alt={product.name}
                className='size-10 shrink-0 rounded-md bg-muted object-cover'
              />
              <div className='min-w-0 flex-1'>
                <p className='truncate text-sm font-medium'>{product.name}</p>
                <p className='text-xs text-muted-foreground'>{product.sales} sales</p>
              </div>
              <span className='shrink-0 text-sm font-medium'>{product.price}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default TotalEarningCard
