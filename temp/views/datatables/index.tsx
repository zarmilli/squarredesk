// Component Imports
import DataTableBasic from '@/views/datatables/basic'
import DataTableWithFilters from '@/views/datatables/filters'
import DataTablePinnableColumn from '@/views/datatables/pinnable-columns'

const DataTable = () => {
  return (
    <div className='flex flex-col gap-8'>
      <div className='space-y-4'>
        <h2 className='text-xl font-semibold'>Basic Data Table</h2>
        <DataTableBasic />
      </div>
      <div className='space-y-4'>
        <h2 className='text-xl font-semibold'>Pinnable Columns</h2>
        <DataTablePinnableColumn />
      </div>
      <div className='space-y-4'>
        <h2 className='text-xl font-semibold'>Datatable with Filters</h2>
        <DataTableWithFilters />
      </div>
    </div>
  )
}

export default DataTable
