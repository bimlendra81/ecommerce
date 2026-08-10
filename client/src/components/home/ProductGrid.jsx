import ProductCard from '../ProductCard'

export default function ProductGrid({ products, columns }) {
  if (!products || products.length === 0) return null
  return (
    <div
      className={
        columns || 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-4 md:gap-6'
      }
    >
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  )
}
