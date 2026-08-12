import { Link } from 'react-router-dom'
import { resolveAssetUrl } from '../../utils/media'

const placeholder = (name) => `https://placehold.co/600x400?text=${encodeURIComponent(name)}`

export default function CategoryTile({ c, className, large, round, meta }) {
  const img = resolveAssetUrl(c.image) || placeholder(c.name)
  const metaText = meta || `${c.product_count} item${c.product_count === 1 ? '' : 's'}`
  return (
    <Link
      to={`/search?category=${c.slug}`}
      className={`group relative overflow-hidden border border-primary-light ${round ? 'rounded-2xl' : 'rounded-2xl'} ${className || ''}`}
    >
      <img
        src={img}
        alt={c.name}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
      <div className={`absolute bottom-0 text-white ${large ? 'p-5' : 'p-3'}`}>
        <p className={large ? 'font-bold text-xl tracking-tight' : 'font-semibold tracking-tight'}>{c.name}</p>
        <p className={large ? 'text-sm text-gray-200' : 'text-xs text-gray-200'}>{metaText}</p>
      </div>
    </Link>
  )
}
