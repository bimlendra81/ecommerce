import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { resolveAssetUrl } from '../../utils/media'

export default function RailSlider({ items }) {
  const [index, setIndex] = useState(0)
  const n = items.length

  useEffect(() => {
    if (n <= 1) return
    const timer = setInterval(() => setIndex((i) => (i + 1) % n), 4000)
    return () => clearInterval(timer)
  }, [n])

  if (!n) return null

  return (
    <div className="relative flex-1 rounded-2xl overflow-hidden shadow-lg">
      {items.map((it, i) => (
        <Link
          key={it.slug || i}
          to={`/search?category=${it.slug}`}
          className={`group absolute inset-0 transition-opacity duration-700 ${
            i === index ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <img
            src={resolveAssetUrl(it.image)}
            alt=""
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
          <div className="absolute bottom-0 p-4 text-white">
            <p className="text-xs uppercase tracking-wider text-accent font-semibold">Featured</p>
            <p className="font-bold text-lg leading-snug">{it.name}</p>
            {it.meta && <p className="text-xs text-white/75 mt-0.5">{it.meta}</p>}
          </div>
        </Link>
      ))}
      {n > 1 && (
        <div className="absolute top-3 right-3 flex gap-1.5">
          {items.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${
                i === index ? 'bg-accent' : 'bg-white/50 hover:bg-white/80'
              }`}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
