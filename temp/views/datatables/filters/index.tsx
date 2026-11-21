// Component Imports
import { Card } from '@/components/ui/card'
import DataTableFilters, { type Item } from '@/views/datatables/filters/filters-datatable'

const productData: Item[] = [
  {
    id: '1',
    product: 'Black Chair',
    productImage: 'https://cdn.shadcnstudio.com/ss-assets/products/product-1.png',
    fallback: 'BC',
    price: 159,
    availability: 'In Stock',
    rating: 3.9
  },
  {
    id: '2',
    product: 'Nike Jordan',
    productImage: 'https://cdn.shadcnstudio.com/ss-assets/products/product-2.png',
    fallback: 'NJ',
    price: 599,
    availability: 'Limited',
    rating: 4.4
  },
  {
    id: '3',
    product: 'OnePlus 7 Pro',
    productImage: 'https://cdn.shadcnstudio.com/ss-assets/products/product-3.png',
    fallback: 'O7P',
    price: 1299,
    availability: 'Out of Stock',
    rating: 3.5
  },
  {
    id: '4',
    product: 'Nintendo Switch',
    productImage: 'https://cdn.shadcnstudio.com/ss-assets/products/product-4.png',
    fallback: 'NS',
    price: 499,
    availability: 'In Stock',
    rating: 4.9
  },
  {
    id: '5',
    product: 'Apple magic mouse',
    productImage: 'https://cdn.shadcnstudio.com/ss-assets/products/product-5.png',
    fallback: 'AMM',
    price: 970,
    availability: 'Limited',
    rating: 4.1
  },
  {
    id: '6',
    product: 'Apple watch',
    productImage: 'https://cdn.shadcnstudio.com/ss-assets/products/product-6.png',
    fallback: 'AW',
    price: 1500,
    availability: 'Limited',
    rating: 3.1
  },
  {
    id: '7',
    product: 'Casio G-Shock',
    productImage: 'https://cdn.shadcnstudio.com/ss-assets/products/product-8.png',
    fallback: 'CGS',
    price: 194,
    availability: 'Out of Stock',
    rating: 1.5
  },
  {
    id: '8',
    product: 'RayBan Sunglasses',
    productImage: 'https://cdn.shadcnstudio.com/ss-assets/products/product-10.png',
    fallback: 'RBS',
    price: 199,
    availability: 'Out of Stock',
    rating: 2.4
  }
]

const DataTableWithFilters = () => {
  return (
    <Card className='py-0'>
      <DataTableFilters data={productData} />
    </Card>
  )
}

export default DataTableWithFilters
