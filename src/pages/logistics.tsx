import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Eye, MoreHorizontal } from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import TransactionDatatable, { type Item } from '@/components/orders/datatable-transaction'
import { useToast } from '@/hooks/use-toast'
import { useUserSites } from '@/hooks/useUserSites'
import { supabase } from '@/lib/supabase'

type CustomerRow = {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
}

type ProductRow = {
  id: string
  name: string
  cover_image: string | null
}

type LogisticsOrder = {
  id: string
  customer_id: string
  status: Item['status']
  total: number | string
  items: unknown
  payfast_payment_id: string | null
  shipping_address: string | null
  cell_number: string | null
  created_at: string | null
}

type LogisticsData = {
  orders: LogisticsOrder[]
  customers: CustomerRow[]
  products: ProductRow[]
}

type LogisticsStatus = 'processing' | 'shipped' | 'delivered'

const fallbackImage = '/images/logo.png'
const statusOptions: LogisticsStatus[] = ['processing', 'shipped', 'delivered']

async function fetchLogisticsData(siteId: string): Promise<LogisticsData> {
  const [ordersResult, customersResult, productsResult] = await Promise.all([
    supabase
      .from('orders')
      .select('id, customer_id, status, total, items, payfast_payment_id, shipping_address, cell_number, created_at')
      .eq('site_id', siteId)
      .order('created_at', { ascending: false }),
    supabase
      .from('customers')
      .select('id, email, first_name, last_name')
      .eq('site_id', siteId),
    supabase
      .from('products')
      .select('id, name, cover_image')
      .eq('site_id', siteId),
  ])

  if (ordersResult.error) throw ordersResult.error
  if (customersResult.error) throw customersResult.error
  if (productsResult.error) throw productsResult.error

  return {
    orders: (ordersResult.data ?? []) as LogisticsOrder[],
    customers: (customersResult.data ?? []) as CustomerRow[],
    products: (productsResult.data ?? []) as ProductRow[],
  }
}

function parseOrderItems(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
  }
  if (typeof value === 'string') {
    try {
      return parseOrderItems(JSON.parse(value))
    } catch {
      return []
    }
  }
  return []
}

function OrderStatusPopover({
  status,
  disabled,
  onSelect,
}: {
  status: Item['status']
  disabled: boolean
  onSelect: (status: LogisticsStatus) => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type='button'
          variant='ghost'
          size='icon'
          className='size-8'
          aria-label='Update order status'
          disabled={disabled}
        >
          <MoreHorizontal className='size-4' />
        </Button>
      </PopoverTrigger>
      <PopoverContent align='end' className='w-40 p-1'>
        {statusOptions.map(option => (
          <Button
            key={option}
            type='button'
            variant='ghost'
            className='w-full justify-start'
            aria-pressed={status === option}
            disabled={disabled}
            onClick={() => {
              setOpen(false)
              onSelect(option)
            }}
          >
            {option}
          </Button>
        ))}
      </PopoverContent>
    </Popover>
  )
}

export default function Logistics() {
  const [searchParams] = useSearchParams()
  const selectedSiteId = searchParams.get('site')
  const [selectedOrder, setSelectedOrder] = useState<LogisticsOrder | null>(null)
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null)
  const {
    user,
    organisation,
    isLoading: isAppDataLoading,
    error: appDataError,
    sitesQuery,
  } = useUserSites()
  const { toast } = useToast()
  const sites = sitesQuery.data ?? []
  const selectedSite = selectedSiteId
    ? sites.find(site => site.id === selectedSiteId)
    : sites[0]
  const siteSelectionError = useMemo(
    () =>
      sitesQuery.isSuccess && selectedSiteId && !selectedSite
        ? new Error('The selected site could not be found.')
        : null,
    [selectedSite, selectedSiteId, sitesQuery.isSuccess]
  )

  const ordersQuery = useQuery({
    queryKey: ['logistics-orders', user?.id, organisation?.id, selectedSite?.id],
    enabled: !!user?.id && !!selectedSite && !isAppDataLoading,
    queryFn: () => {
      if (!selectedSite) throw new Error('The selected site could not be found.')
      return fetchLogisticsData(selectedSite.id)
    },
    staleTime: 60 * 1000,
  })

  useEffect(() => {
    const error =
      appDataError ??
      sitesQuery.error ??
      siteSelectionError ??
      ordersQuery.error
    if (!error) return
    toast({
      title: 'Unable to load logistics',
      description: error instanceof Error ? error.message : 'Please try again.',
      variant: 'destructive',
    })
  }, [appDataError, ordersQuery.error, siteSelectionError, sitesQuery.error, toast])

  const data = ordersQuery.data ?? { orders: [], customers: [], products: [] }
  const customerById = new Map(data.customers.map(customer => [customer.id, customer]))
  const productById = new Map(data.products.map(product => [product.id, product]))
  const orderById = new Map(data.orders.map(order => [order.id, order]))

  const transactions = useMemo<Item[]>(() => {
    return data.orders.slice(0, 25).map(order => {
      const customer = customerById.get(order.customer_id)
      const name =
        [customer?.first_name, customer?.last_name].filter(Boolean).join(' ') ||
        customer?.email ||
        'Customer'
      return {
        id: order.id,
        avatar: fallbackImage,
        avatarFallback: name.slice(0, 2).toUpperCase(),
        name,
        amount: Number(order.total) || 0,
        status: order.status,
        email: customer?.email ?? '—',
        paidBy: order.payfast_payment_id ? 'mastercard' : 'visa',
        date: order.created_at ?? new Date().toISOString(),
      }
    })
  }, [customerById, data.orders])

  async function updateOrderStatus(orderId: string, status: LogisticsStatus) {
    if (!selectedSite || updatingOrderId) return
    setUpdatingOrderId(orderId)

    try {
      const { data: updatedOrder, error } = await supabase
        .from('orders')
        .update({ status })
        .eq('site_id', selectedSite.id)
        .eq('id', orderId)
        .select('id')
        .maybeSingle()

      if (error) {
        toast({
          title: 'Unable to update order',
          description: error.message,
          variant: 'destructive',
        })
        return
      }
      if (!updatedOrder) {
        toast({
          title: 'Unable to update order',
          description: 'The order was not found or could not be updated.',
          variant: 'destructive',
        })
        return
      }

      const result = await ordersQuery.refetch()
      if (result.error) {
        toast({
          title: 'Order updated, but refresh failed',
          description: result.error.message,
          variant: 'destructive',
        })
        return
      }
      toast({ title: 'Order status updated' })
    } catch (error) {
      toast({
        title: 'Unable to update order',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      })
    } finally {
      setUpdatingOrderId(null)
    }
  }

  const selectedCustomer = selectedOrder
    ? customerById.get(selectedOrder.customer_id)
    : undefined
  const selectedOrderItems = selectedOrder ? parseOrderItems(selectedOrder.items) : []

  return (
    <div className='min-h-0 w-full flex-1 overflow-y-auto overscroll-contain p-4 custom-scrollbar lg:p-6'>
      <div className='mb-4'>
        <h1 className='text-2xl font-bold tracking-tight'>Logistics</h1>
        <p className='text-sm text-muted-foreground'>
          Manage orders and delivery status.
        </p>
      </div>

      <Card className='w-full min-w-0 overflow-hidden border border-border py-0'>
        <div className='min-w-0 overflow-x-auto'>
          <TransactionDatatable
            data={transactions}
            renderActions={row => {
              const order = orderById.get(row.id)
              if (!order) return null
              return (
                <div className='flex items-center justify-end gap-1'>
                  <Button
                    type='button'
                    variant='ghost'
                    size='icon'
                    className='size-8'
                    aria-label={`View order for ${row.name}`}
                    onClick={() => setSelectedOrder(order)}
                  >
                    <Eye className='size-4' />
                  </Button>
                  <OrderStatusPopover
                    status={row.status}
                    disabled={updatingOrderId !== null}
                    onSelect={status => void updateOrderStatus(order.id, status)}
                  />
                </div>
              )
            }}
          />
        </div>
      </Card>

      <Sheet
        open={selectedOrder !== null}
        onOpenChange={open => {
          if (!open) setSelectedOrder(null)
        }}
      >
        <SheetContent className='flex w-full flex-col gap-6 overflow-y-auto sm:max-w-5xl'>
          <SheetHeader className='pr-10 text-left'>
            <SheetTitle>Order details</SheetTitle>
            <SheetDescription>
              {selectedOrder ? `Order #${selectedOrder.id}` : 'View order details'}
            </SheetDescription>
          </SheetHeader>

          {selectedOrder && (
            <div className='grid gap-6 lg:grid-cols-2'>
              <Card className='border border-border p-5'>
                <h3 className='text-base font-semibold'>Ordered products</h3>
                <div className='mt-4 space-y-4'>
                  {selectedOrderItems.length > 0 ? (
                    selectedOrderItems.map((item, index) => {
                      const productId = typeof item.product_id === 'string' ? item.product_id : ''
                      const product = productId ? productById.get(productId) : undefined
                      const name =
                        (typeof item.product_name === 'string' && item.product_name) ||
                        product?.name ||
                        'Product'
                      const quantity = Number(item.quantity) || 0
                      return (
                        <div
                          key={`${productId || name}-${index}`}
                          className='flex items-center gap-3'
                        >
                          <Avatar className='size-10 shrink-0 rounded-md'>
                            <AvatarImage
                              src={product?.cover_image ?? fallbackImage}
                              alt={name}
                              className='object-cover'
                            />
                            <AvatarFallback className='rounded-md text-xs'>
                              {name.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className='min-w-0 flex-1 truncate text-sm font-medium'>
                            {name}
                          </span>
                          <span className='shrink-0 text-sm text-muted-foreground'>
                            Qty {quantity}
                          </span>
                        </div>
                      )
                    })
                  ) : (
                    <p className='text-sm text-muted-foreground'>No products found for this order.</p>
                  )}
                </div>
              </Card>

              <Card className='border border-border p-5'>
                <h3 className='text-base font-semibold'>Customer details</h3>
                <dl className='mt-4 space-y-4 text-sm'>
                  <div>
                    <dt className='text-muted-foreground'>Name</dt>
                    <dd className='font-medium'>
                      {[selectedCustomer?.first_name, selectedCustomer?.last_name]
                        .filter(Boolean)
                        .join(' ') || 'Customer'}
                    </dd>
                  </div>
                  <div>
                    <dt className='text-muted-foreground'>Email</dt>
                    <dd className='break-all font-medium'>{selectedCustomer?.email ?? '—'}</dd>
                  </div>
                  <div>
                    <dt className='text-muted-foreground'>Phone</dt>
                    <dd className='font-medium'>{selectedOrder.cell_number || '—'}</dd>
                  </div>
                  <div>
                    <dt className='text-muted-foreground'>Delivery address</dt>
                    <dd className='whitespace-pre-line font-medium'>
                      {selectedOrder.shipping_address || 'No delivery address provided.'}
                    </dd>
                  </div>
                </dl>
              </Card>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
