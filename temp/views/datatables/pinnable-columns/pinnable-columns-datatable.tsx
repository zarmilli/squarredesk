'use client'

import type { CSSProperties } from 'react'
import { useState } from 'react'

import type { Column, ColumnDef, SortingState } from '@tanstack/react-table'
import { flexRender, getCoreRowModel, getSortedRowModel, useReactTable } from '@tanstack/react-table'

import { ArrowLeftFromLineIcon, ArrowRightFromLineIcon, EllipsisIcon, PinOffIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export type Product = {
  productId: number
  productName: string
  category: string
  stockQuantity: number
  price: number
  supplier: string
  discontinued: 'no' | 'yes'
}

const getPinningStyles = (column: Column<Product>): CSSProperties => {
  const isPinned = column.getIsPinned()

  return {
    left: isPinned === 'left' ? `${column.getStart('left')}px` : undefined,
    right: isPinned === 'right' ? `${column.getAfter('right')}px` : undefined,
    position: isPinned ? 'sticky' : 'relative',
    zIndex: isPinned ? 1 : 0
  }
}

export const columns: ColumnDef<Product>[] = [
  {
    header: 'Product Name',
    accessorKey: 'productName',
    cell: ({ row }) => <div className='font-medium'>{row.getValue('productName')}</div>
  },
  {
    header: 'Category',
    accessorKey: 'category',
    cell: ({ row }) => <div>{row.getValue('category')}</div>
  },
  {
    header: 'Stock Quantity',
    accessorKey: 'stockQuantity',
    cell: ({ row }) => <div>{row.getValue('stockQuantity')}</div>
  },
  {
    header: 'Price',
    accessorKey: 'price',
    cell: ({ row }) => {
      const price = parseFloat(row.getValue('price'))

      const formatted = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(price)

      return <div>{formatted}</div>
    }
  },
  {
    header: 'Supplier',
    accessorKey: 'supplier',
    cell: ({ row }) => <div>{row.getValue('supplier')}</div>
  },
  {
    header: 'Discontinued',
    accessorKey: 'discontinued',
    cell: ({ row }) => <div className='capitalize'>{row.getValue('discontinued')}</div>
  }
]

const DataTablePinnableColumns = ({ data }: { data: Product[] }) => {
  const [sorting, setSorting] = useState<SortingState>([])

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting
    },
    enableSortingRemoval: false
  })

  return (
    <div className='w-full'>
      <div className='rounded-md'>
        <Table className='[&_td]:border-border [&_th]:border-border border-separate border-spacing-0 [&_tfoot_td]:border-t [&_th]:border-b [&_tr]:border-none [&_tr:not(:last-child)_td]:border-b'>
          <TableHeader>
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map(header => {
                  const { column } = header
                  const isPinned = column.getIsPinned()
                  const isLastLeftPinned = isPinned === 'left' && column.getIsLastColumn('left')
                  const isFirstRightPinned = isPinned === 'right' && column.getIsFirstColumn('right')

                  return (
                    <TableHead
                      key={header.id}
                      className='data-pinned:bg-muted/90 relative h-10 truncate data-pinned:backdrop-blur-xs [&:not([data-pinned]):has(+[data-pinned])_div.cursor-col-resize:last-child]:opacity-0 [&[data-last-col=left]_div.cursor-col-resize:last-child]:opacity-0 [&[data-pinned=right]:last-child_div.cursor-col-resize:last-child]:opacity-0'
                      colSpan={header.colSpan}
                      style={{ ...getPinningStyles(column) }}
                      data-pinned={isPinned || undefined}
                      data-last-col={isLastLeftPinned ? 'left' : isFirstRightPinned ? 'right' : undefined}
                    >
                      <div className='flex items-center justify-between gap-2'>
                        <span className='truncate'>
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                        </span>

                        {!header.isPlaceholder &&
                          header.column.getCanPin() &&
                          (header.column.getIsPinned() ? (
                            <Button
                              size='icon'
                              variant='ghost'
                              className='-mr-1 size-7'
                              onClick={() => header.column.pin(false)}
                              aria-label={`Unpin ${header.column.columnDef.header as string} column`}
                              title={`Unpin ${header.column.columnDef.header as string} column`}
                            >
                              <PinOffIcon className='opacity-60' aria-hidden='true' />
                            </Button>
                          ) : (
                            <DropdownMenu>
                              <DropdownMenuTrigger
                                render={
                                  <Button
                                    size='icon'
                                    variant='ghost'
                                    className='-mr-1 size-7'
                                    aria-label={`Pin options for ${header.column.columnDef.header as string} column`}
                                    title={`Pin options for ${header.column.columnDef.header as string} column`}
                                  >
                                    <EllipsisIcon className='opacity-60' aria-hidden='true' />
                                  </Button>
                                }
                              />
                              <DropdownMenuContent align='end' className='w-35'>
                                <DropdownMenuItem onClick={() => header.column.pin('left')}>
                                  <ArrowLeftFromLineIcon size={16} className='opacity-60' aria-hidden='true' />
                                  Stick to left
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => header.column.pin('right')}>
                                  <ArrowRightFromLineIcon size={16} className='opacity-60' aria-hidden='true' />
                                  Stick to right
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          ))}
                      </div>
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map(row => (
                <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                  {row.getVisibleCells().map(cell => {
                    const { column } = cell
                    const isPinned = column.getIsPinned()
                    const isLastLeftPinned = isPinned === 'left' && column.getIsLastColumn('left')
                    const isFirstRightPinned = isPinned === 'right' && column.getIsFirstColumn('right')

                    return (
                      <TableCell
                        key={cell.id}
                        className='data-pinned:bg-background/90 truncate data-pinned:backdrop-blur-xs'
                        style={{ ...getPinningStyles(column) }}
                        data-pinned={isPinned || undefined}
                        data-last-col={isLastLeftPinned ? 'left' : isFirstRightPinned ? 'right' : undefined}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    )
                  })}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className='h-24 text-center'>
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export default DataTablePinnableColumns
