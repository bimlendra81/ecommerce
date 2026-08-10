import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import MediaSlider from '../MediaSlider'
import WishlistButton from '../WishlistButton'
import { priceNow, saleActive, discountPercent } from '../../utils/price'
import { field, useFormErrors } from '../../utils/validation'
import FieldError from '../FieldError'
import {
  submitReview,
  updateReview,
  selectReviewLoading,
  selectReviewError,
} from '../../features/reviewSlice'

function StarRating({ value, size = 'text-sm' }) {
  const rounded = Math.round(Number(value) || 0)
  return (
    <span className={`text-amber-500 ${size}`} aria-label={`${value} out of 5 stars`}>
      {'★'.repeat(rounded)}
      <span className="text-gray-300">{'★'.repeat(5 - rounded)}</span>
    </span>
  )
}

const REVIEW_FORM_STYLES = {
  marketplace: {
    wrap: 'bg-white border rounded-lg p-4',
    input: 'mt-3 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary',
    submit: 'bg-primary text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-primary-dark disabled:opacity-50',
  },
  minimal: {
    wrap: 'bg-white mt-4',
    input: 'mt-3 w-full bg-transparent border-b border-gray-300 py-2 text-sm focus:outline-none focus:border-gray-900',
    submit: 'bg-gray-900 text-white px-6 py-2.5 text-sm font-medium hover:bg-gray-800 disabled:opacity-50',
  },
  editorial: {
    wrap: 'mt-4 border-2 border-gray-900 p-5 bg-white',
    input: 'mt-3 w-full border border-gray-900 px-3 py-2 text-sm font-medium focus:outline-none focus:bg-gray-50',
    submit: 'bg-black text-white px-6 py-2.5 text-sm font-bold hover:bg-gray-800 disabled:opacity-50',
  },
}

function ReviewForm({ slug, existing, onSubmit, onDelete, variant }) {
  const styles = REVIEW_FORM_STYLES[variant] || REVIEW_FORM_STYLES.marketplace
  const [rating, setRating] = useState(existing?.rating || 5)
  const [title, setTitle] = useState(existing?.title || '')
  const [comment, setComment] = useState(existing?.comment || '')
  const [message, setMessage] = useState('')
  const dispatch = useDispatch()
  const isLoading = useSelector(selectReviewLoading)
  const error = useSelector(selectReviewError)
  const { fieldErrors, validate, clear } = useFormErrors()

  async function handleSubmit(e) {
    e.preventDefault()
    setMessage('')
    const rules = {
      rating: [field.required('Rating'), field.min(1, 'Rating'), field.max(5, 'Rating')],
      title: [field.maxLen(200, 'Title')],
      comment: [
        field.required('Review'),
        field.minLen(10, 'Review'),
        field.maxLen(5000, 'Review'),
      ],
    }
    if (!validate(rules, { rating, title, comment })) return
    await dispatch(
      existing
        ? updateReview({ slug, rating, title, comment })
        : submitReview({ slug, rating, title, comment })
    ).unwrap()
    setMessage('Review saved!')
    onSubmit()
  }

  return (
    <form noValidate onSubmit={handleSubmit} className={styles.wrap}>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Your rating:</span>
        <div className="flex gap-0.5 text-2xl">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => {
                setRating(star)
                clear('rating')
              }}
              className={star <= rating ? 'text-amber-500' : 'text-gray-300'}
              aria-label={`${star} star${star > 1 ? 's' : ''}`}
            >
              ★
            </button>
          ))}
        </div>
      </div>
      <FieldError name="rating" errors={fieldErrors} />
      <input
        value={title}
        onChange={(e) => {
          setTitle(e.target.value)
          clear('title')
        }}
        placeholder="Review title (optional)"
        maxLength={200}
        className={styles.input}
      />
      <FieldError name="title" errors={fieldErrors} />
      <textarea
        value={comment}
        onChange={(e) => {
          setComment(e.target.value)
          clear('comment')
        }}
        placeholder="Share your experience with this product..."
        rows={4}
        maxLength={5000}
        className={styles.input}
      />
      <FieldError name="comment" errors={fieldErrors} />
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      {message && <p className="mt-2 text-sm text-green-600">{message}</p>}
      <div className="mt-3 flex items-center gap-3">
        <button
          type="submit"
          disabled={isLoading}
          className={styles.submit}
        >
          {isLoading ? 'Saving...' : existing ? 'Update review' : 'Submit review'}
        </button>
        {existing && (
          <button
            type="button"
            onClick={onDelete}
            disabled={isLoading}
            className="text-sm text-red-600 hover:underline disabled:opacity-50"
          >
            Delete review
          </button>
        )}
      </div>
    </form>
  )
}

function ReviewsBlock({ p, variant }) {
  const product = p.product
  const distribution = p.distribution
  const barColor = variant === 'marketplace' ? 'bg-amber-500' : 'bg-gray-900'
  return (
    <section className="w-full px-4 md:px-8 lg:px-10 mt-12" id="reviews">
      {variant === 'marketplace' ? (
        <h2 className="text-xl font-bold mb-4">Customer reviews</h2>
      ) : (
        <p className="uppercase tracking-[0.25em] text-xs text-gray-400 font-bold mb-6">
          03 — Customer reviews
        </p>
      )}

      <div
        className={
          variant === 'marketplace'
            ? 'bg-white border border-gray-100 rounded-2xl shadow-sm p-6 mb-6'
            : variant === 'editorial'
              ? 'grid md:grid-cols-2 gap-12'
              : 'flex flex-col md:flex-row md:items-center gap-10 border-b border-gray-200 pb-10'
        }
      >
        <div className="text-center md:text-left">
          <p className={`${variant === 'editorial' ? 'text-7xl font-black tracking-tight leading-none' : variant === 'minimal' ? 'text-6xl font-bold tracking-tight' : 'text-5xl font-bold'}`}>
            {Number(product.rating_avg || 0).toFixed(1)}
          </p>
          <StarRating value={product.rating_avg} size="text-lg" />
          <p className="text-xs text-gray-500 mt-1">{product.rating_count || 0} ratings</p>
          {variant === 'editorial' && (
            <div className="mt-8">
              <ReviewCta p={p} variant={variant} />
            </div>
          )}
        </div>
        <div className="flex-1 space-y-1.5">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = distribution.counts[star]
            const pct = distribution.total > 0 ? (count / distribution.total) * 100 : 0
            return (
              <div key={star} className="flex items-center gap-2 text-sm">
                <span className="w-8 text-gray-500">{star} ★</span>
                <div className={`flex-1 ${variant === 'minimal' ? 'h-1' : 'h-2.5'} bg-gray-200 rounded-full overflow-hidden`}>
                  <div className={`h-full ${barColor} rounded-full`} style={{ width: `${pct}%` }} />
                </div>
                <span className="w-8 text-right text-gray-500">{count}</span>
              </div>
            )
          })}
        </div>
      </div>

      {variant !== 'editorial' && (
        <div className={variant === 'marketplace' ? 'mt-6 border-t pt-4' : 'mt-8'}>
          <ReviewCta p={p} variant={variant} />
        </div>
      )}

      {product.reviews?.length > 0 ? (
        <ul
          className={
            variant === 'minimal'
              ? 'mt-8 space-y-10'
              : variant === 'editorial'
                ? 'mt-14 space-y-0'
                : 'space-y-4'
          }
        >
          {product.reviews.map((r) => (
            <ReviewItem key={r.id} review={r} variant={variant} />
          ))}
        </ul>
      ) : (
        <p className="text-gray-500 text-sm mt-6">No reviews yet.</p>
      )}
    </section>
  )
}

function ReviewCta({ p, variant }) {
  const { isAuth, canReview, myReview, showReviewForm, setShowReviewForm, handleReviewSubmitted, handleReviewDeleted } = p
  if (!isAuth) {
    return (
      <p className="text-sm text-gray-600">
        <Link to="/login" className={variant === 'marketplace' ? 'text-primary underline' : 'border-b border-gray-300 pb-0.5 hover:text-gray-900'}>
          Login
        </Link>{' '}
        to write a review
      </p>
    )
  }
  if (canReview) {
    return showReviewForm ? (
      <ReviewForm
        slug={p.product.slug}
        existing={myReview}
        onSubmit={handleReviewSubmitted}
        onDelete={handleReviewDeleted}
        variant={variant}
      />
    ) : (
      <button
        onClick={() => setShowReviewForm(true)}
        className={
          variant === 'marketplace'
            ? 'bg-primary text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-primary-dark'
            : 'bg-gray-900 text-white px-6 py-2.5 text-sm font-medium hover:bg-gray-800'
        }
      >
        {myReview ? 'Edit your review' : 'Write a review'}
      </button>
    )
  }
  return (
    <p className="text-sm text-gray-600">
      Only verified buyers can review this product.{' '}
      <Link to="/orders" className={variant === 'marketplace' ? 'text-primary underline' : 'border-b border-gray-300 pb-0.5 hover:text-gray-900'}>
        Check your orders
      </Link>
      .
    </p>
  )
}

function ReviewItem({ review, variant }) {
  return (
    <li
      className={
        variant === 'marketplace'
          ? 'border rounded-lg p-5 bg-white'
          : variant === 'editorial'
            ? 'border-b border-gray-900 py-8 grid md:grid-cols-12 gap-4'
            : 'border-b border-gray-200 pb-10'
      }
    >
      <div className={variant === 'editorial' ? 'md:col-span-3' : 'flex items-center gap-3'}>
        {review.user_avatar ? (
          <img src={review.user_avatar} alt={review.user_name} className="w-9 h-9 rounded-full object-cover" />
        ) : (
          <span className="w-9 h-9 rounded-full bg-primary-soft text-primary flex items-center justify-center font-bold text-sm">
            {(review.user_name || '?').charAt(0).toUpperCase()}
          </span>
        )}
        <div>
          <p className={`${variant === 'editorial' ? 'font-black' : 'font-medium text-sm'}`}>{review.user_name}</p>
          <p className="text-xs text-gray-500">{new Date(review.created_at).toLocaleDateString()}</p>
        </div>
      </div>
      <div className={variant === 'editorial' ? 'md:col-span-9' : 'mt-2 flex items-center gap-2'}>
        <StarRating value={review.rating} />
        {review.title && <span className={`${variant === 'editorial' ? 'font-bold' : 'font-semibold text-sm'}`}>{review.title}</span>}
      </div>
      {review.comment && <p className={`${variant === 'editorial' ? 'md:col-span-9 md:col-start-4 mt-2' : 'mt-2'} text-sm text-gray-700 leading-relaxed`}>{review.comment}</p>}
    </li>
  )
}

function FbtBlock({ p, variant }) {
  const { product, fbt, selectedFbt, toggleFbt, combinedTotal, handleAddAllToCart, inStock } = p
  if (fbt.length === 0) return null
  const thumb = (media, fallback, cls) => (
    <MediaSlider media={media} fallback={fallback} aspectClass="aspect-square" containerClass={cls} />
  )
  return (
    <section
      className={
        variant === 'marketplace'
          ? 'w-full px-4 md:px-8 lg:px-10 mt-12'
          : variant === 'editorial'
            ? 'w-full px-4 md:px-8 py-12 border-t-2 border-black bg-gray-50'
            : 'w-full px-6 md:px-10 mt-16 border-t border-gray-200 pt-10'
      }
      id="frequently-bought-together"
    >
      <h2
        className={
          variant === 'marketplace'
            ? 'text-xl font-bold mb-6'
            : variant === 'minimal'
              ? 'uppercase tracking-[0.25em] text-xs text-gray-400 font-bold mb-6'
              : 'uppercase tracking-[0.3em] text-xs text-gray-400 font-bold mb-8'
        }
      >
        {variant === 'marketplace' ? 'Frequently bought together' : variant === 'minimal' ? '02 — Complete the set' : '02 — Complete the set'}
      </h2>

      <div
        className={
          variant === 'marketplace'
            ? 'bg-white border border-gray-100 rounded-2xl shadow-sm p-6'
            : ''
        }
      >
        <div className="flex flex-wrap items-start gap-x-6 gap-y-6">
          <div className="flex flex-col items-center w-28">
            <div className={`w-28 h-28 shrink-0 ${variant === 'marketplace' ? 'rounded-xl overflow-hidden border border-gray-100' : variant === 'editorial' ? 'overflow-hidden border-2 border-black' : 'overflow-hidden'}`}>
              {thumb(product.media, product.image, 'h-28 w-28')}
            </div>
            <Link to={`/product/${product.slug}`} className="mt-2 text-xs text-gray-700 hover:text-primary line-clamp-2 w-28 text-center leading-snug">
              {product.name}
            </Link>
            <span className="mt-1 text-sm font-bold text-gray-900">${Number(product.price).toFixed(2)}</span>
          </div>

          {fbt.map((f) => (
            <div key={f.id} className="flex items-start gap-x-6">
              <span className="text-gray-400 text-3xl font-light leading-10">+</span>
              <div className="flex flex-col items-center w-28">
                <div className={`w-28 h-28 shrink-0 relative ${variant === 'marketplace' ? 'rounded-xl overflow-hidden border border-gray-100' : variant === 'editorial' ? 'overflow-hidden border border-gray-300' : 'overflow-hidden'}`}>
                  <input
                    type="checkbox"
                    checked={selectedFbt.includes(f.id)}
                    onChange={() => toggleFbt(f.id)}
                    className={`absolute top-1 left-1 z-10 h-4 w-4 ${variant === 'editorial' ? 'accent-black' : 'accent-primary'}`}
                    aria-label={`Include ${f.name}`}
                  />
                  <Link to={`/product/${f.slug}`} className="block h-full w-full">
                    {thumb(f.media, f.image, 'h-28 w-28')}
                  </Link>
                </div>
                <Link to={`/product/${f.slug}`} className="mt-2 text-xs text-gray-700 hover:text-primary line-clamp-2 w-28 text-center leading-snug">
                  {f.name}
                </Link>
                <span className="mt-1 text-sm font-bold text-gray-900">${priceNow(f).toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>

        <div className={`mt-6 flex flex-wrap items-center gap-4 ${variant === 'marketplace' ? 'border-t border-gray-100 pt-5' : variant === 'editorial' ? 'border-t-2 border-black pt-6 mt-10' : ''}`}>
          <p className="text-sm text-gray-700">
            Total price:{' '}
            <span className={`${variant === 'editorial' ? 'text-2xl font-black' : 'text-lg font-bold'} text-gray-900`}>
              ${combinedTotal.toFixed(2)}
            </span>
          </p>
          <button
            onClick={handleAddAllToCart}
            disabled={!inStock}
            className={
              variant === 'marketplace'
                ? 'bg-primary text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-primary-dark disabled:bg-gray-200 disabled:text-gray-400'
                : 'bg-gray-900 text-white px-5 py-2 text-sm font-medium hover:bg-gray-800 disabled:bg-gray-200 disabled:text-gray-400'
            }
          >
            Add all {selectedFbt.length + 1} to cart
          </button>
        </div>
      </div>
    </section>
  )
}

function PurchasePanel({ p, variant }) {
  const { product, quantity, setQuantity, inStock, handleAddToCart, handleBuyNow } = p
  const trust = variant === 'marketplace'
    ? 'bg-white border border-gray-100 rounded-2xl p-5 shadow-sm'
    : variant === 'minimal'
      ? 'mt-8'
      : 'mt-10'
  const qtyBtn = variant === 'marketplace' ? 'px-3 py-2 hover:bg-gray-100' : 'px-4 py-3 hover:bg-gray-50'
  const addBtn = variant === 'marketplace'
    ? 'flex-1 bg-amber-400 text-gray-900 px-6 py-3 rounded-full font-semibold hover:bg-amber-300'
    : variant === 'minimal'
      ? 'flex-1 bg-gray-900 text-white px-6 py-3 font-medium hover:bg-gray-800'
      : 'flex-1 bg-black text-white px-6 py-3 font-bold hover:bg-gray-800'
  const buyBtn = variant === 'marketplace'
    ? 'mt-3 w-full bg-primary text-white px-6 py-3 rounded-full font-semibold hover:bg-primary-dark'
    : variant === 'minimal'
      ? 'mt-3 w-full border border-gray-900 px-6 py-3 font-medium hover:bg-gray-900 hover:text-white'
      : 'mt-3 w-full border-2 border-gray-900 px-6 py-3 font-bold hover:bg-black hover:text-white'

  return (
      <div className={trust}>
        <p className={`${variant === 'editorial' ? 'text-4xl md:text-5xl font-black tracking-tight' : 'text-3xl font-bold text-primary'}`}>
          ${priceNow(product).toFixed(2)}
        </p>
        {saleActive(product) && (
          <p className="mt-1 flex items-center gap-2">
            <span className="text-gray-400 line-through text-lg">${Number(product.price).toFixed(2)}</span>
            <span className="bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              -{discountPercent(product)}%
            </span>
          </p>
        )}
        <p className="text-xs text-gray-500 mt-1">Prices include all taxes</p>

      {inStock && (
        <div className={`flex items-center gap-3 ${variant === 'minimal' || variant === 'editorial' ? 'mt-4' : 'mt-4'}`}>
          <div className={`flex items-center ${variant === 'marketplace' ? 'border rounded' : variant === 'minimal' ? 'border border-gray-900' : 'border-2 border-gray-900'}`}>
            <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} className={qtyBtn}>−</button>
            <span className={`px-4 font-medium ${variant === 'editorial' ? 'font-black' : ''}`}>{quantity}</span>
            <button onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))} className={qtyBtn}>+</button>
          </div>
          <button onClick={handleAddToCart} className={addBtn}>Add to Cart</button>
        </div>
      )}

      {inStock && <button onClick={handleBuyNow} className={buyBtn}>Buy Now</button>}

      <div className={`mt-4 border-t pt-3 flex items-center justify-between ${variant === 'editorial' ? 'border-gray-900' : 'border-gray-200'}`}>
        <WishlistButton productId={product.id} label className={variant === 'marketplace' ? 'text-gray-700 hover:text-red-600' : 'text-gray-500 hover:text-red-600'} />
      </div>
    </div>
  )
}

function TrustRow({ p }) {
  const { product, settings } = p
  return (
    <div className="mt-4 text-sm text-gray-500 space-y-1">
      <p>✔ {product.stock} units available</p>
      <p>🚚 Free shipping on orders over ${settings.free_shipping_threshold}</p>
      <p>↩️ {p.returnDays}-day easy returns</p>
    </div>
  )
}

function ProductGallery({ product, wrapper }) {
  return (
    <div className={`lg:sticky lg:top-24 self-start ${wrapper || ''}`}>
      <MediaSlider
        media={product.media}
        fallback={product.image}
        showThumbs
        videoControls
        aspectClass="aspect-square"
        zoom
      />
    </div>
  )
}

/* ============================================================
   Layout: Marketplace
   ============================================================ */

export function MarketplaceProductLayout({ p }) {
  const { product } = p
  return (
    <section className="w-full pb-20">
      <nav className="w-full px-4 md:px-8 lg:px-10 pt-6 text-sm text-gray-500">
        <Link to="/" className="hover:text-primary">Home</Link>
        <span className="mx-2">›</span>
        <Link to="/search" className="hover:text-primary">Search</Link>
        {product.category_slug && (
          <>
            <span className="mx-2">›</span>
            <Link to={`/search?category=${product.category_slug}`} className="hover:text-primary">{product.category}</Link>
          </>
        )}
        <span className="mx-2">›</span>
        <span className="text-gray-700">{product.name}</span>
      </nav>

      <section className="w-full px-4 md:px-8 lg:px-10 pt-6">
        <div className="grid lg:grid-cols-2 gap-10">
          <ProductGallery product={product} wrapper="bg-white border border-gray-100 rounded-2xl shadow-sm" />

          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">
              {product.brand ? `${product.brand} · ` : ''}{product.category || 'General'}
            </p>
            <h1 className="text-2xl md:text-3xl font-bold mt-1">{product.name}</h1>

            {product.rating_count > 0 && (
              <a href="#reviews" className="mt-2 flex items-center gap-2 group">
                <StarRating value={product.rating_avg} size="text-lg" />
                <span className="text-sm text-primary group-hover:underline">
                  {product.rating_count} rating{product.rating_count === 1 ? '' : 's'}
                </span>
              </a>
            )}

            <div className="mt-4 border-y border-gray-200 py-4 flex items-center gap-3">
              <span className="text-3xl font-bold text-primary">${priceNow(product).toFixed(2)}</span>
              {saleActive(product) && (
                <span className="text-gray-400 line-through text-lg">${Number(product.price).toFixed(2)}</span>
              )}
              {p.inStock ? (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">In stock</span>
              ) : (
                <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full font-medium">Out of stock</span>
              )}
            </div>

            <div className="mt-4 bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
              <div
                className="rich-text text-sm text-gray-700 leading-relaxed"
                dangerouslySetInnerHTML={{
                  __html: product.description && product.description.includes('<')
                    ? product.description
                    : (product.description || '').replace(/\n/g, '<br>'),
                }}
              />
            </div>

            <TrustRow p={p} />

            <div className="mt-6">
              <PurchasePanel p={p} variant="marketplace" />
            </div>

            {p.message && <p className="mt-4 text-green-600">{p.message}</p>}
            {p.error && <p className="mt-4 text-red-600">{p.error}</p>}
            {!p.isAuth && (
              <p className="mt-4 text-sm text-gray-500">
                <Link to="/login" className="text-primary underline">Login</Link> to add items to your cart or wishlist
              </p>
            )}
          </div>
        </div>
      </section>

      <FbtBlock p={p} variant="marketplace" />
      <ReviewsBlock p={p} variant="marketplace" />
    </section>
  )
}

/* ============================================================
   Layout: Minimal Premium
   ============================================================ */

export function MinimalProductLayout({ p }) {
  const { product } = p
  return (
    <section className="w-full pb-16">
      <section className="w-full px-6 md:px-10 pt-10">
        <p className="uppercase tracking-[0.25em] text-xs text-gray-400 mb-3">
          <Link to="/" className="hover:text-gray-700">Home</Link>
          <span className="mx-2">/</span>
          <Link to="/search" className="hover:text-gray-700">Search</Link>
          {product.category && (
            <>
              <span className="mx-2">/</span>
              {product.category_slug ? (
                <Link to={`/search?category=${product.category_slug}`} className="hover:text-gray-700">{product.category}</Link>
              ) : (
                <span>{product.category}</span>
              )}
            </>
          )}
        </p>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">{product.name}</h1>
      </section>

      <section className="w-full px-6 md:px-10 pt-8">
        <div className="grid lg:grid-cols-2 gap-14">
          <ProductGallery product={product} wrapper="bg-gray-50" />

          <div>
            <p className="uppercase tracking-[0.25em] text-xs text-gray-400 mb-3">
              {product.brand ? `${product.brand} · ` : ''}{product.category || 'General'}
            </p>

            <div className="flex items-center gap-3">
              {product.rating_count > 0 && (
                <>
                  <StarRating value={product.rating_avg} size="text-lg" />
                  <a href="#reviews" className="text-sm text-gray-500 border-b border-gray-300 pb-0.5 hover:border-gray-900 hover:text-gray-900">
                    {product.rating_count} rating{product.rating_count === 1 ? '' : 's'}
                  </a>
                </>
              )}
            </div>

            <div className="mt-6 flex items-end justify-between border-y border-gray-200 py-5">
              <div>
                <p className="text-3xl font-bold tracking-tight">${Number(product.price).toFixed(2)}</p>
                <p className="text-xs text-gray-400 mt-1">Prices include all taxes</p>
              </div>
              <span className={`text-xs uppercase tracking-wide px-3 py-1.5 ${p.inStock ? 'bg-gray-100' : 'bg-red-100 text-red-600'}`}>
                {p.inStock ? 'In stock' : 'Out of stock'}
              </span>
            </div>

            <p className="mt-6 text-sm text-gray-700 leading-relaxed">
              {(product.description || '').replace(/<[^>]+>/g, ' ')}
            </p>

            <TrustRow p={p} />

            <div className="mt-8">
              <PurchasePanel p={p} variant="minimal" />
            </div>

            {p.message && <p className="mt-4 text-green-600">{p.message}</p>}
            {p.error && <p className="mt-4 text-red-600">{p.error}</p>}
          </div>
        </div>
      </section>

      <FbtBlock p={p} variant="minimal" />
      <ReviewsBlock p={p} variant="minimal" />
    </section>
  )
}

/* ============================================================
   Layout: Bold Editorial
   ============================================================ */

export function EditorialProductLayout({ p }) {
  const { product } = p
  return (
    <section className="w-full pb-0">
      <section className="w-full px-4 md:px-8 py-8 border-b border-gray-900">
        <p className="uppercase tracking-[0.3em] text-xs text-gray-400 font-bold">
          <Link to="/" className="hover:text-gray-900">Home</Link>
          <span className="mx-2">/</span>
          <Link to="/search" className="hover:text-gray-900">Search</Link>
          {product.category && (
            <>
              <span className="mx-2">/</span>
              {product.category_slug ? (
                <Link to={`/search?category=${product.category_slug}`} className="hover:text-gray-900">{product.category}</Link>
              ) : (
                <span>{product.category}</span>
              )}
            </>
          )}
        </p>
        <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-none mt-4">
          {product.name}
        </h1>
      </section>

      <section className="w-full px-4 md:px-8 py-10">
        <div className="grid lg:grid-cols-2 gap-12">
          <ProductGallery product={product} />

          <div>
            <p className="uppercase tracking-[0.3em] text-xs text-gray-400 font-bold">
              {product.brand ? `${product.brand} · ` : ''}{product.category || 'General'}
            </p>

            <div className="mt-4 flex items-center gap-4">
              {product.rating_count > 0 && (
                <>
                  <StarRating value={product.rating_avg} size="text-lg" />
                  <a href="#reviews" className="text-sm text-gray-600 border-b border-gray-900 pb-0.5 hover:text-black">
                    {product.rating_count} rating{product.rating_count === 1 ? '' : 's'}
                  </a>
                </>
              )}
            </div>

            <div className="mt-8 border-y border-gray-900 py-6 flex items-center justify-between">
              <p className="text-4xl md:text-5xl font-black tracking-tight">${Number(product.price).toFixed(2)}</p>
              <span className={`text-xs uppercase tracking-[0.2em] font-bold px-3 py-1.5 ${p.inStock ? 'bg-black text-white' : 'bg-red-600 text-white'}`}>
                {p.inStock ? 'In stock' : 'Out of stock'}
              </span>
            </div>

            <p className="mt-8 text-base text-gray-700 leading-relaxed max-w-lg">
              {(product.description || '').replace(/<[^>]+>/g, ' ')}
            </p>

            <TrustRow p={p} />

            <div className="mt-10">
              <PurchasePanel p={p} variant="editorial" />
            </div>

            {p.message && <p className="mt-4 text-green-600">{p.message}</p>}
            {p.error && <p className="mt-4 text-red-600">{p.error}</p>}
          </div>
        </div>
      </section>

      <FbtBlock p={p} variant="editorial" />
      <ReviewsBlock p={p} variant="editorial" />
    </section>
  )
}
