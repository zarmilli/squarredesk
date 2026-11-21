import { useEffect, useMemo, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Clock3Icon,
  CoinsIcon,
  PackageCheckIcon,
  ShoppingBagIcon,
  ShoppingCartIcon,
  TruckIcon,
  UsersRoundIcon
} from 'lucide-react'

import { Card } from '@/components/ui/card'
import SalesMetricsCard from '@/components/orders/chart-sales-metrics'
import StatisticsCard from '@/components/orders/statistics-card'
import TotalEarningCard from '@/components/orders/widget-total-earning'
import TransactionDatatable, { type Item } from '@/components/orders/datatable-transaction'
import { useAppData } from '@/context/AppDataContext'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

type ProductRow = {
  id: string
  name: string
  price: number | string
  cover_image: string | null
}

type CustomerRow = {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
}

type OrderRow = {
  id: string
  customer_id: string
  status: Item['status']
  total: number | string
  items: unknown
  payfast_payment_id: string | null
  created_at: string | null
}

type CartItemRow = { quantity: number | string }

type OrderData = {
  orders: OrderRow[]
  customers: CustomerRow[]
  products: ProductRow[]
  cartItems: CartItemRow[]
}

type ProductSummary = {
  image: string
  name: string
  price: string
  sales: number
}

type Metric = {
  icon: ReactNode
  title: string
  value: string
}

const fallbackImage = '/images/logo.png'

function asNumber(value: unknown) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function formatCurrency(value: number) {
  return `R${value.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function parseOrderItems(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) return value.filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
  if (typeof value === 'string') {
    try {
      return parseOrderItems(JSON.parse(value))
    } catch {
      return []
    }
  }
  return []
}

function getLatestThreeMonths() {
  const current = new Date()
  return [2, 1, 0].map((offset) => {
    const date = new Date(current.getFullYear(), current.getMonth() - offset, 1)
    return {
      key: `${date.getFullYear()}-${date.getMonth()}`,
      label: date.toLocaleDateString('en-ZA', { month: 'short' })
    }
  })
}

async function fetchOrderData(userId: string, selectedSiteId: string | null): Promise<OrderData> {
  let siteQuery = supabase.from('user_sites').select('id').eq('user_id', userId)
  siteQuery = selectedSiteId
    ? siteQuery.eq('id', selectedSiteId)
    : siteQuery.order('created_at', { ascending: false }).limit(1)

  const { data: site, error: siteError } = await siteQuery.maybeSingle()
  if (siteError) throw siteError
  if (!site) return { orders: [], customers: [], products: [], cartItems: [] }

  const [ordersResult, customersResult, productsResult, cartResult] = await Promise.all([
    supabase
      .from('orders')
      .select('id, customer_id, status, total, items, payfast_payment_id, created_at')
      .eq('site_id', site.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('customers')
      .select('id, email, first_name, last_name')
      .eq('site_id', site.id),
    supabase
      .from('products')
      .select('id, name, price, cover_image')
      .eq('site_id', site.id),
    supabase
      .from('cart_items')
      .select('quantity')
      .eq('site_id', site.id)
  ])

  if (ordersResult.error) throw ordersResult.error
  if (customersResult.error) throw customersResult.error
  if (productsResult.error) throw productsResult.error
  if (cartResult.error) throw cartResult.error

  return {
    orders: (ordersResult.data ?? []) as OrderRow[],
    customers: (customersResult.data ?? []) as CustomerRow[],
    products: (productsResult.data ?? []) as ProductRow[],
    cartItems: (cartResult.data ?? []) as CartItemRow[]
  }
}

export default function OrdersDashboard() {
  const [searchParams] = useSearchParams()
  const selectedSiteId = searchParams.get('site')
  const { user, isLoading: isAppDataLoading } = useAppData()
  const { toast } = useToast()

  const ordersQuery = useQuery({
    queryKey: ['orders-dashboard', user?.id, selectedSiteId],
    enabled: !!user?.id && !isAppDataLoading,
    queryFn: () => fetchOrderData(user!.id, selectedSiteId),
    staleTime: 60 * 1000
  })

  useEffect(() => {
    if (!ordersQuery.error) return
    toast({
      title: 'Unable to load orders',
      description: ordersQuery.error instanceof Error ? ordersQuery.error.message : 'Please try again.',
      variant: 'destructive'
    })
  }, [ordersQuery.error, toast])

  const data = ordersQuery.data ?? { orders: [], customers: [], products: [], cartItems: [] }
  const orders = data.orders
  const totalSales = orders.reduce((sum, order) => sum + asNumber(order.total), 0)
  const netProfit = totalSales * 0.95
  const totalCustomers = new Set(data.customers.map((customer) => customer.id)).size
  const cartItems = data.cartItems.reduce((sum, item) => sum + asNumber(item.quantity), 0)
  const productById = new Map(data.products.map((product) => [product.id, product]))

  const topProducts = useMemo<ProductSummary[]>(() => {
    const totals = new Map<string, { name: string; quantity: number; total: number; productId?: string }>()

    orders.forEach((order) => {
      parseOrderItems(order.items).forEach((item) => {
        const productId = typeof item.product_id === 'string' ? item.product_id : undefined
        const product = productId ? productById.get(productId) : undefined
        const name = String(item.product_name ?? product?.name ?? 'Unknown product')
        const key = productId ?? name
        const quantity = asNumber(item.quantity)
        const itemPrice = asNumber(item.price) || asNumber(product?.price)
        const current = totals.get(key) ?? { name, quantity: 0, total: 0, productId }
        current.quantity += quantity
        current.total += itemPrice * quantity
        totals.set(key, current)
      })
    })

    return Array.from(totals.values())
      .sort((a, b) => b.quantity - a.quantity || b.total - a.total)
      .slice(0, 3)
      .map((product) => {
        const dbProduct = product.productId ? productById.get(product.productId) : undefined
        return {
          image: dbProduct?.cover_image || fallbackImage,
          name: product.name,
          price: formatCurrency(product.total),
          sales: product.quantity
        }
      })
  }, [orders, productById])

  const transactions = useMemo<Item[]>(() => {
    const customerById = new Map(data.customers.map((customer) => [customer.id, customer]))
    return orders.slice(0, 25).map((order) => {
      const customer = customerById.get(order.customer_id)
      const name = [customer?.first_name, customer?.last_name].filter(Boolean).join(' ') || customer?.email || 'Customer'
      const paidBy: Item['paidBy'] = order.payfast_payment_id ? 'mastercard' : 'visa'
      return {
        id: order.id,
        avatar: fallbackImage,
        avatarFallback: name.slice(0, 2).toUpperCase(),
        name,
        amount: asNumber(order.total),
        status: order.status,
        email: customer?.email ?? '—',
        paidBy,
        date: order.created_at ?? new Date().toISOString()
      }
    })
  }, [data.customers, orders])

  const revenueMonths = getLatestThreeMonths()
  const revenueData = revenueMonths.map((month) => ({
    month: month.label.toLowerCase(),
    sales: orders
      .filter((order) => {
        if (!order.created_at) return false
        const date = new Date(order.created_at)
        return `${date.getFullYear()}-${date.getMonth()}` === month.key
      })
      .reduce((sum, order) => sum + asNumber(order.total), 0),
    fill: `var(--color-${month.label.toLowerCase()})`
  }))
  const previousAverage = (revenueData[0].sales + revenueData[1].sales) / 2
  const revenueChange = previousAverage === 0 ? (revenueData[2].sales > 0 ? 100 : 0) : ((revenueData[2].sales - previousAverage) / previousAverage) * 100

  const metrics: Metric[] = [
    { icon: <CoinsIcon className='size-5' />, title: 'Total sales', value: formatCurrency(totalSales) },
    { icon: <UsersRoundIcon className='size-5' />, title: 'Total customers', value: totalCustomers.toLocaleString('en-ZA') },
    { icon: <CoinsIcon className='size-5' />, title: 'Net profit', value: formatCurrency(netProfit) },
    { icon: <ShoppingBagIcon className='size-5' />, title: 'Total orders', value: orders.length.toLocaleString('en-ZA') },
    { icon: <ShoppingCartIcon className='size-5' />, title: 'Cart items', value: cartItems.toLocaleString('en-ZA') },
    { icon: <Clock3Icon className='size-5' />, title: 'Processing orders', value: orders.filter((order) => order.status === 'processing').length.toLocaleString('en-ZA') }
  ]

  const statistics = [
    { icon: <ShoppingBagIcon className='size-5' />, value: orders.length, title: 'Total Orders' },
    { icon: <TruckIcon className='size-5' />, value: orders.filter((order) => order.status === 'shipped').length, title: 'Shipped Orders' },
    { icon: <PackageCheckIcon className='size-5' />, value: orders.filter((order) => order.status === 'delivered').length, title: 'Delivered Orders' }
  ]

  return (
    <div className='grid min-h-0 w-full flex-1 grid-cols-1 gap-6 overflow-y-auto p-4 custom-scrollbar sm:grid-cols-2 lg:grid-cols-3 lg:p-6'>
      <div className='col-span-full grid gap-6 sm:grid-cols-3'>
        {statistics.map((card) => (
          <StatisticsCard key={card.title} icon={card.icon} title={card.title} value={String(card.value)} changePercentage='Current total' />
        ))}
      </div>

      <div className='col-span-full grid gap-6 lg:grid-cols-3'>
        <TotalEarningCard
          title='Top Products'
          earning={totalSales}
          trend={revenueChange >= 0 ? 'up' : 'down'}
          percentage={revenueChange}
          comparisonText='Generated in total'
          productData={topProducts}
          className='sm:min-w-0'
        />
        <SalesMetricsCard className='h-full lg:col-span-2' metrics={metrics} revenueData={revenueData} revenueChange={revenueChange} totalProfit={netProfit} />
      </div>

      <Card className='col-span-full w-full border border-border py-0'>
        <TransactionDatatable data={transactions} />
      </Card>
    </div>
  )
}
