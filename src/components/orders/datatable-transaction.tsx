import type { ReactNode } from 'react'
import { useMemo, useState } from 'react'

import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Pagination, PaginationContent, PaginationItem } from '@/components/ui/pagination'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export type Item = {
  id: string
  avatar: string
  avatarFallback: string
  name: string
  email: string
  amount: number
  status: 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  paidBy: 'mastercard' | 'visa'
  date: string
}

const pageSize = 5

const TransactionDatatable = ({
  data,
  renderActions,
}: {
  data: Item[]
  renderActions?: (row: Item) => ReactNode
}) => {
  const [pageIndex, setPageIndex] = useState(0)
  const pageCount = Math.max(1, Math.ceil(data.length / pageSize))
  const rows = useMemo(() => data.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize), [data, pageIndex])
  const firstShown = data.length === 0 ? 0 : pageIndex * pageSize + 1
  const lastShown = Math.min((pageIndex + 1) * pageSize, data.length)

  return (
    <div className='w-full'>
      <div className='border-b'>
        <Table className={`${renderActions ? 'min-w-[860px]' : 'min-w-[720px]'} table-fixed`}>
          <colgroup>
            <col className={renderActions ? 'w-[44%]' : 'w-[60%]'} />
            <col className='w-[14%]' />
            <col className='w-[12%]' />
            <col className='w-[14%]' />
            {renderActions && <col className='w-[16%]' />}
          </colgroup>
          <TableHeader>
            <TableRow>
              <TableHead className='text-muted-foreground h-14 first:pl-10'>Customer</TableHead>
              <TableHead className='text-muted-foreground h-14 pr-3 text-right'>Amount</TableHead>
              <TableHead className='text-muted-foreground h-14 pr-3 text-right'>Status</TableHead>
              <TableHead className='text-muted-foreground h-14 pr-10 text-right'>Date</TableHead>
              {renderActions && <TableHead className='text-muted-foreground h-14 pr-6 text-right'>Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length ? (
              rows.map(row => (
                <TableRow key={row.id}>
                  <TableCell className='first:pl-10'>
                    <div className='flex min-w-0 items-center gap-2'>
                      <Avatar className='size-9 shrink-0'>
                        <AvatarImage src={row.avatar} alt={row.name} />
                        <AvatarFallback className='text-xs'>{row.avatarFallback}</AvatarFallback>
                      </Avatar>
                      <div className='flex min-w-0 flex-col text-sm'>
                        <span className='truncate text-card-foreground font-medium'>{row.name}</span>
                        <span className='truncate text-muted-foreground'>{row.email}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className='whitespace-nowrap pr-3 text-right tabular-nums'>{new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(row.amount)}</TableCell>
                  <TableCell className='whitespace-nowrap pr-3 text-right'>
                    <Badge className='bg-primary/10 text-primary h-auto rounded-sm px-1.5 capitalize'>{row.status}</Badge>
                  </TableCell>
                  <TableCell className='whitespace-nowrap pr-10 text-right tabular-nums'>{new Date(row.date).toLocaleDateString('en-ZA', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                  })}</TableCell>
                  {renderActions && <TableCell className='pr-6 text-right'>{renderActions(row)}</TableCell>}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={renderActions ? 5 : 4} className='h-24 text-center'>
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className='flex items-center justify-between gap-3 px-6 py-4 max-sm:flex-col md:max-lg:flex-col'>
        <p className='text-muted-foreground text-sm whitespace-nowrap' aria-live='polite'>
          Showing <span>{firstShown} to {lastShown}</span> of <span>{data.length} entries</span>
        </p>

        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <Button
                className='disabled:pointer-events-none disabled:opacity-50'
                variant='ghost'
                onClick={() => setPageIndex(current => Math.max(0, current - 1))}
                disabled={pageIndex === 0}
                aria-label='Go to previous page'
              >
                <ChevronLeftIcon aria-hidden='true' />
                Previous
              </Button>
            </PaginationItem>

            {Array.from({ length: pageCount }, (_, index) => index + 1).map(page => {
              const isActive = page === pageIndex + 1
              return (
                <PaginationItem key={page}>
                  <Button
                    size='icon'
                    className={`${!isActive && 'bg-primary/10 text-primary hover:bg-primary/20 focus-visible:ring-primary/20 dark:focus-visible:ring-primary/40'}`}
                    onClick={() => setPageIndex(page - 1)}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    {page}
                  </Button>
                </PaginationItem>
              )
            })}

            <PaginationItem>
              <Button
                className='disabled:pointer-events-none disabled:opacity-50'
                variant='ghost'
                onClick={() => setPageIndex(current => Math.min(pageCount - 1, current + 1))}
                disabled={pageIndex >= pageCount - 1}
                aria-label='Go to next page'
              >
                Next
                <ChevronRightIcon aria-hidden='true' />
              </Button>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  )
}

export default TransactionDatatable
