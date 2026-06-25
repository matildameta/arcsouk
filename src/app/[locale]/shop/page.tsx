import { getProducts } from '@/lib/store';
import { ShopGrid } from '@/components/shop/shop-grid';

export const dynamic = 'force-dynamic';

export default async function ShopPage() {
  const products = await getProducts();
  return <ShopGrid products={products} />;
}
