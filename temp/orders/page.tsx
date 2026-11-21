import { TruckIcon, TriangleAlertIcon, CalendarX2Icon } from 'lucide-react'

import { Card } from '@/components/ui/card'

import ProductInsightsCard from '@/views/dashboards/widgets/widget-product-insights'
import SalesMetricsCard from '@/views/dashboards/charts/chart-sales-metrics'
import StatisticsCard from '@/views/dashboards/statistics/statistics-card-01'
import TotalEarningCard from '@/views/dashboards/widgets/widget-total-earning'
import TransactionDatatable, { type Item } from '@/views/datatables/datatable-transaction'

// Statistics card data
const StatisticsCardData = [
  {
    icon: <TruckIcon className='size-4' />,
    value: '42',
    title: 'Shipped Orders',
    changePercentage: '+18.2%'
  },
  {
    icon: <TriangleAlertIcon className='size-4' />,
    value: '8',
    title: 'Damaged Returns',
    changePercentage: '-8.7%'
  },
  {
    icon: <CalendarX2Icon className='size-4' />,
    value: '27',
    title: 'Missed Delivery Slots',
    changePercentage: '+4.3%'
  }
]

// Earning data for Total Earning card
const earningData = [
  {
    img: '/images/widgets/zipcar.webp',
    platform: 'Zipcar',
    technologies: 'Vuejs & HTML',
    earnings: '-$23,569.26',
    progressPercentage: 75
  },
  {
    img: '/images/widgets/bitbank.webp',
    platform: 'Bitbank',
    technologies: 'Figma & React',
    earnings: '-$12,650.31',
    progressPercentage: 25
  }
]

// Transaction table data
const transactionData: Item[] = [
  {
    id: '1',
    avatar: '/images/avatars/avatar-1.webp',
    avatarFallback: 'JA',
    name: 'Jack Alfredo',
    amount: 316.0,
    status: 'paid',
    email: 'jack@shadcnstudio.com',
    paidBy: 'mastercard'
  },
  {
    id: '2',
    avatar: '/images/avatars/avatar-2.webp',
    avatarFallback: 'MG',
    name: 'Maria Gonzalez',
    amount: 253.4,
    status: 'pending',
    email: 'maria.g@shadcnstudio.com',
    paidBy: 'visa'
  },
  {
    id: '3',
    avatar: '/images/avatars/avatar-3.webp',
    avatarFallback: 'JD',
    name: 'John Doe',
    amount: 852.0,
    status: 'paid',
    email: 'john.doe@shadcnstudio.com',
    paidBy: 'mastercard'
  },
  {
    id: '4',
    avatar: '/images/avatars/avatar-4.webp',
    avatarFallback: 'EC',
    name: 'Emily Carter',
    amount: 889.0,
    status: 'pending',
    email: 'emily.carter@shadcnstudio.com',
    paidBy: 'visa'
  },
  {
    id: '5',
    avatar: '/images/avatars/avatar-5.webp',
    avatarFallback: 'DL',
    name: 'David Lee',
    amount: 723.16,
    status: 'paid',
    email: 'david.lee@shadcnstudio.com',
    paidBy: 'mastercard'
  },
  {
    id: '6',
    avatar: '/images/avatars/avatar-6.webp',
    avatarFallback: 'SP',
    name: 'Sophia Patel',
    amount: 612.0,
    status: 'failed',
    email: 'sophia.patel@shadcnstudio.com',
    paidBy: 'mastercard'
  },
  {
    id: '7',
    avatar: '/images/avatars/avatar-7.webp',
    avatarFallback: 'RW',
    name: 'Robert Wilson',
    amount: 445.25,
    status: 'paid',
    email: 'robert.wilson@shadcnstudio.com',
    paidBy: 'visa'
  },
  {
    id: '8',
    avatar: '/images/avatars/avatar-8.webp',
    avatarFallback: 'LM',
    name: 'Lisa Martinez',
    amount: 297.8,
    status: 'processing',
    email: 'lisa.martinez@shadcnstudio.com',
    paidBy: 'mastercard'
  },
  {
    id: '9',
    avatar: '/images/avatars/avatar-9.webp',
    avatarFallback: 'MT',
    name: 'Michael Thompson',
    amount: 756.9,
    status: 'paid',
    email: 'michael.thompson@shadcnstudio.com',
    paidBy: 'visa'
  },
  {
    id: '10',
    avatar: '/images/avatars/avatar-10.webp',
    avatarFallback: 'AJ',
    name: 'Amanda Johnson',
    amount: 189.5,
    status: 'pending',
    email: 'amanda.johnson@shadcnstudio.com',
    paidBy: 'mastercard'
  },
  {
    id: '11',
    avatar: '/images/avatars/avatar-11.webp',
    avatarFallback: 'KB',
    name: 'Kevin Brown',
    amount: 1024.75,
    status: 'paid',
    email: 'kevin.brown@shadcnstudio.com',
    paidBy: 'visa'
  },
  {
    id: '12',
    avatar: '/images/avatars/avatar-12.webp',
    avatarFallback: 'SD',
    name: 'Sarah Davis',
    amount: 367.2,
    status: 'failed',
    email: 'sarah.davis@shadcnstudio.com',
    paidBy: 'mastercard'
  },
  {
    id: '13',
    avatar: '/images/avatars/avatar-13.webp',
    avatarFallback: 'CG',
    name: 'Christopher Garcia',
    amount: 598.45,
    status: 'processing',
    email: 'christopher.garcia@shadcnstudio.com',
    paidBy: 'visa'
  },
  {
    id: '14',
    avatar: '/images/avatars/avatar-14.webp',
    avatarFallback: 'JR',
    name: 'Jennifer Rodriguez',
    amount: 821.3,
    status: 'paid',
    email: 'jennifer.rodriguez@shadcnstudio.com',
    paidBy: 'mastercard'
  },
  {
    id: '15',
    avatar: '/images/avatars/avatar-15.webp',
    avatarFallback: 'DM',
    name: 'Daniel Miller',
    amount: 156.75,
    status: 'pending',
    email: 'daniel.miller@shadcnstudio.com',
    paidBy: 'visa'
  },
  {
    id: '16',
    avatar: '/images/avatars/avatar-16.webp',
    avatarFallback: 'NW',
    name: 'Nicole White',
    amount: 934.1,
    status: 'paid',
    email: 'nicole.white@shadcnstudio.com',
    paidBy: 'mastercard'
  },
  {
    id: '17',
    avatar: '/images/avatars/avatar-17.webp',
    avatarFallback: 'AL',
    name: 'Anthony Lopez',
    amount: 412.85,
    status: 'failed',
    email: 'anthony.lopez@shadcnstudio.com',
    paidBy: 'visa'
  },
  {
    id: '18',
    avatar: '/images/avatars/avatar-18.webp',
    avatarFallback: 'MH',
    name: 'Michelle Harris',
    amount: 675.5,
    status: 'processing',
    email: 'michelle.harris@shadcnstudio.com',
    paidBy: 'mastercard'
  },
  {
    id: '19',
    avatar: '/images/avatars/avatar-19.webp',
    avatarFallback: 'JC',
    name: 'James Clark',
    amount: 289.95,
    status: 'paid',
    email: 'james.clark@shadcnstudio.com',
    paidBy: 'visa'
  },
  {
    id: '20',
    avatar: '/images/avatars/avatar-20.webp',
    avatarFallback: 'RL',
    name: 'Rachel Lewis',
    amount: 1156.25,
    status: 'pending',
    email: 'rachel.lewis@shadcnstudio.com',
    paidBy: 'mastercard'
  },
  {
    id: '21',
    avatar: '/images/avatars/avatar-1.webp',
    avatarFallback: 'TY',
    name: 'Thomas Young',
    amount: 543.6,
    status: 'paid',
    email: 'thomas.young@shadcnstudio.com',
    paidBy: 'visa'
  },
  {
    id: '22',
    avatar: '/images/avatars/avatar-2.webp',
    avatarFallback: 'SB',
    name: 'Stephanie Brown',
    amount: 789.3,
    status: 'processing',
    email: 'stephanie.brown@shadcnstudio.com',
    paidBy: 'mastercard'
  },
  {
    id: '23',
    avatar: '/images/avatars/avatar-3.webp',
    avatarFallback: 'BM',
    name: 'Brandon Moore',
    amount: 425.75,
    status: 'failed',
    email: 'brandon.moore@shadcnstudio.com',
    paidBy: 'visa'
  },
  {
    id: '24',
    avatar: '/images/avatars/avatar-4.webp',
    avatarFallback: 'KT',
    name: 'Kelly Taylor',
    amount: 1203.5,
    status: 'paid',
    email: 'kelly.taylor@shadcnstudio.com',
    paidBy: 'mastercard'
  },
  {
    id: '25',
    avatar: '/images/avatars/avatar-5.webp',
    avatarFallback: 'MA',
    name: 'Mark Anderson',
    amount: 356.2,
    status: 'pending',
    email: 'mark.anderson@shadcnstudio.com',
    paidBy: 'visa'
  }
]

const OrdersDashboard = () => {
  return (
    <div className='grid grid-cols-2 gap-6 lg:grid-cols-3'>
      {/* Statistics Cards */}
      <div className='col-span-full grid gap-6 sm:grid-cols-3 md:max-lg:grid-cols-1'>
        {StatisticsCardData.map((card, index) => (
          <StatisticsCard
            key={index}
            icon={card.icon}
            title={card.title}
            value={card.value}
            changePercentage={card.changePercentage}
          />
        ))}
      </div>

      <div className='grid gap-6 max-xl:col-span-full lg:max-xl:grid-cols-2'>
        {/* Product Insights Card */}
        <ProductInsightsCard className='justify-between gap-3 *:data-[slot=card-content]:space-y-5' />

        {/* Total Earning Card */}
        <TotalEarningCard
          title='Total Earning'
          earning={24650}
          trend='up'
          percentage={10}
          comparisonText='Compare to last year ($84,325)'
          earningData={earningData}
          className='justify-between gap-5 sm:min-w-0'
        />
      </div>

      <SalesMetricsCard className='col-span-full *:data-[slot=card-content]:space-y-6 xl:col-span-2' />

      <Card className='col-span-full w-full py-0'>
        <TransactionDatatable data={transactionData} />
      </Card>
    </div>
  )
}

export default OrdersDashboard
