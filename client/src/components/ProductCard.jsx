import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { addToCart, openCartToast } from '../features/cartSlice'
import { selectIsAuthenticated } from '../features/authSlice'
import { priceNow, saleActive, discountPercent } from '../utils/price'
import MediaSlider from './MediaSlider'
import WishlistButton from './WishlistButton'

export default function ProductCard({ product }) {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const isAuth = useSelector(selectIsAuthenticated)

  async function handleAdd(e) {
    e.preventDefault()
    e.stopPropagation()
    if (!isAuth) {
      navigate('/login')
      return
    }
    try {
      await dispatch(addToCart({ product_id: product.id, quantity: 1 })).unwrap()
      dispatch(
        openCartToast({
          name: product.name,
          price: product.price,
          image: product.image,
          quantity: 1,
        })
      )
    } catch {
      // silent — auth interceptor handles session issues
    }
  }

  return (
    <div className="group bg-white rounded-2xl overflow-hidden hover:shadow-[0_16px_40px_-12px_rgba(22,22,22,0.18)] transition-all border border-primary-light hover:-translate-y-1 flex flex-col h-full">
      <div className="relative">
        <Link to={`/product/${product.slug}`} className="block overflow-hidden">
          <MediaSlider
            media={product.media}
            fallback={product.image}
            containerClass="aspect-[4/5]"
            aspectClass="aspect-[4/5]"
            preferVideo
            objectFit="cover"
          />
        </Link>
        <WishlistButton
          productId={product.id}
          className="absolute top-3 right-3 h-8 w-8 bg-white/95 hover:bg-white text-gray-600 hover:text-red-600 shadow-sm rounded-full"
        />
        {saleActive(product) && discountPercent(product) > 0 && (
          <span className="absolute top-3 left-3 bg-accent text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm">
            -{discountPercent(product)}%
          </span>
        )}
      </div>

      <div className="p-4 md:p-5 flex flex-col flex-1">
        <p className="text-[11px] uppercase tracking-[0.15em] text-gray-400 truncate">
          {product.brand || product.category || 'General'}
        </p>
        <div className="relative group/name">
          <Link to={`/product/${product.slug}`}>
            <h3 className="font-semibold mt-1.5 line-clamp-2 min-h-[3rem] leading-6 text-gray-900 group-hover:text-primary transition-colors">
              {product.name}
            </h3>
          </Link>
          <span className="pointer-events-none absolute left-0 top-full z-20 mt-1 hidden w-max max-w-[240px] rounded-lg bg-gray-900 px-2.5 py-1.5 text-xs text-white shadow-lg group-hover/name:block">
            {product.name}
          </span>
        </div>
        <div className="mt-1.5 min-h-5 flex items-center gap-1.5">
          {product.rating_count > 0 && (
            <>
              <span className="text-sm text-amber-500" aria-label={`${product.rating_avg} out of 5 stars`}>
                {'★'.repeat(Math.round(Number(product.rating_avg) || 0))}
                <span className="text-gray-300">
                  {'★'.repeat(5 - Math.round(Number(product.rating_avg) || 0))}
                </span>
              </span>
              <span className="text-xs text-gray-500">({product.rating_count})</span>
            </>
          )}
        </div>
        <div className="mt-1.5 flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-primary">${priceNow(product).toFixed(2)}</span>
            {saleActive(product) && (
              <span className="text-sm text-gray-400 line-through">${Number(product.price).toFixed(2)}</span>
            )}
          </div>
          <span className={`text-xs ${product.stock > 0 ? 'text-green-700' : 'text-red-600'}`}>
            {product.stock > 0 ? 'In stock' : 'Out of stock'}
          </span>
        </div>
        <button
          onClick={handleAdd}
          disabled={product.stock <= 0}
          className="mt-3 w-full bg-primary text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-primary-dark disabled:bg-gray-200 disabled:text-gray-400 transition-colors"
        >
          Add to Cart
        </button>
      </div>
    </div>
  )
}
