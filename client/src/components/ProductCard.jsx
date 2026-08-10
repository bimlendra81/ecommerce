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
    <div className="group bg-white rounded-xl shadow overflow-hidden hover:shadow-lg transition-all border border-gray-100 hover:-translate-y-[1%] flex flex-col h-full">
      <div className="relative">
        <Link to={`/product/${product.slug}`} className="block">
          <MediaSlider
            media={product.media}
            fallback={product.image}
            containerClass="h-48"
            aspectClass="h-48"
            preferVideo
            objectFit="cover"
          />
        </Link>
        <WishlistButton
          productId={product.id}
          className="absolute top-2 right-2 h-8 w-8 bg-white/90 hover:bg-white text-gray-500 hover:text-red-600 shadow"
        />
        {saleActive(product) && discountPercent(product) > 0 && (
          <span className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow">
            -{discountPercent(product)}%
          </span>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1">
        <p className="text-xs uppercase text-gray-400 truncate">
          {product.brand ? (
            <span className="text-gray-500">{product.brand}</span>
          ) : (
            product.category || 'General'
          )}
        </p>
        <div className="relative group/name">
          <Link to={`/product/${product.slug}`}>
            <h3 className="font-semibold mt-1 line-clamp-2 min-h-[3rem] leading-6 group-hover:text-primary">
              {product.name}
            </h3>
          </Link>
          <span className="pointer-events-none absolute left-0 top-full z-20 mt-1 hidden w-max max-w-[240px] rounded-lg bg-gray-900 px-2.5 py-1.5 text-xs text-white shadow-lg group-hover/name:block">
            {product.name}
          </span>
        </div>
        <div className="mt-1 min-h-5 flex items-center gap-1.5">
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
        <div className="mt-1 flex items-center justify-between">
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-bold text-primary">${priceNow(product).toFixed(2)}</span>
            {saleActive(product) && (
              <span className="text-sm text-gray-400 line-through">${Number(product.price).toFixed(2)}</span>
            )}
          </div>
          <span className={`text-xs ${product.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {product.stock > 0 ? 'In stock' : 'Out of stock'}
          </span>
        </div>
        <button
          onClick={handleAdd}
          disabled={product.stock <= 0}
          className="mt-3 w-full bg-primary text-white py-2 rounded-lg text-sm font-medium hover:bg-primary-dark disabled:bg-gray-200 disabled:text-gray-400"
        >
          Add to Cart
        </button>
      </div>
    </div>
  )
}
