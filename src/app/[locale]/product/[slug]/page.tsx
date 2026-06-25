import { notFound } from 'next/navigation';
import { getProductBySlug } from '@/lib/store';
import { getUsdcDecimals } from '@/lib/usdc-server';
import { ProductDetail } from '@/components/shop/product-detail';

export const dynamic = 'force-dynamic';

export default async function ProductPage({ params: { slug } }: { params: { slug: string; locale: string } }) {
  const [product, usdcDecimals] = await Promise.all([getProductBySlug(slug), getUsdcDecimals()]);
  if (!product) notFound();
  return <ProductDetail product={product} usdcDecimals={usdcDecimals} />;
}
