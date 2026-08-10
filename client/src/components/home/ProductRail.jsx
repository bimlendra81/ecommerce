import { useRef } from 'react'
import ProductCard from '../ProductCard'

export default function ProductRail({ products, itemWidth = 'min-w-[240px] max-w-[240px]' }) {
  const ref = useRef(null)

  function scroll(direction) {
    const el = ref.current
    if (!el) return
    const card = el.firstElementChild
    const step = (card?.offsetWidth || 240) + 20
    el.scrollBy({ left: direction * step, behavior: 'smooth' })
  }

  if (!products || products.length === 0) return null

  return (
    <div className="relative">
      <div ref={ref} className="flex gap-5 overflow-x-auto pb-4 scrollbar-none edge-fade">
        {products.map((p) => (
          <div key={p.id} className={`shrink-0 ${itemWidth}`}>
            <ProductCard product={p} />
          </div>
        ))}
      </div>
      {products.length > 1 && (
        <>
          <button
            onClick={() => scroll(-1)}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white/90 hover:bg-white shadow text-gray-700 flex items-center justify-center"
            aria-label="Scroll left"
          >
            ‹
          </button>
          <button
            onClick={() => scroll(1)}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white/90 hover:bg-white shadow text-gray-700 flex items-center justify-center"
            aria-label="Scroll right"
          >
            ›
          </button>
        </>
      )}
    </div>
  )
}
