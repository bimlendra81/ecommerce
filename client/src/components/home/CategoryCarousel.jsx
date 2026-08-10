import { useRef } from 'react'
import CategoryTile from './CategoryTile'

export default function CategoryCarousel({ items, cardClass, itemWidth = 'w-56', round = true }) {
  const ref = useRef(null)

  function scroll(direction) {
    const el = ref.current
    if (!el) return
    const card = el.firstElementChild
    const step = (card?.offsetWidth || 224) + 16
    el.scrollBy({ left: direction * step, behavior: 'smooth' })
  }

  if (!items || items.length === 0) return null

  return (
    <div className="relative">
      <div ref={ref} className="flex gap-4 overflow-x-auto pb-2 scrollbar-none edge-fade">
        {items.map((c) => (
          <div key={c.slug} className={`shrink-0 ${itemWidth}`}>
            <CategoryTile
              c={c}
              round={round}
              meta={c.meta}
              className={cardClass || 'h-64'}
            />
          </div>
        ))}
      </div>
      {items.length > 1 && (
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
