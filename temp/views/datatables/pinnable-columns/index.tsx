// Component Imports
import { Card } from '@/components/ui/card'
import DataTablePinnableColumns, { type Product } from '@/views/datatables/pinnable-columns/pinnable-columns-datatable'

const productData: Product[] = [
  {
    productId: 1,
    productName: 'Apple iPhone 14',
    category: 'Smartphones',
    stockQuantity: 4550,
    price: 1500,
    supplier: 'Dixon Electronics',
    discontinued: 'no'
  },
  {
    productId: 2,
    productName: 'Metal frame table',
    category: 'Furniture',
    stockQuantity: 150,
    price: 540,
    supplier: 'Milton Furniture',
    discontinued: 'no'
  },
  {
    productId: 3,
    productName: 'Xiaomi A series',
    category: 'electronics',
    stockQuantity: 1500,
    price: 2200,
    supplier: 'Xiaomi Electronics',
    discontinued: 'yes'
  },
  {
    productId: 4,
    productName: 'RC Monster Truck',
    category: 'Toys',
    stockQuantity: 10500,
    price: 250,
    supplier: 'Lego Toys',
    discontinued: 'no'
  },
  {
    productId: 5,
    productName: 'Glass Water Bottle',
    category: 'Kitchenware',
    stockQuantity: 5503,
    price: 69,
    supplier: 'Kitchen Essentials',
    discontinued: 'no'
  },
  {
    productId: 6,
    productName: 'BenQ Monitor 24',
    category: 'Electronics',
    stockQuantity: 600,
    price: 1000,
    supplier: 'BenQ Electronics',
    discontinued: 'yes'
  }
]

const DataTablePinnableColumn = () => {
  return (
    <Card className='py-0'>
      <DataTablePinnableColumns data={productData} />
    </Card>
  )
}

export default DataTablePinnableColumn
