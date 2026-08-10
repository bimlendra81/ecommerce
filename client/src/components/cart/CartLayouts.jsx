import { Link } from 'react-router-dom'
import MediaSlider from '../MediaSlider'

const CART_ICON = (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="21" r="1" />
    <circle cx="20" cy="21" r="1" />
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
  </svg>
)

const BACK_ICON = (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
)

const TRASH_ICON = (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14Z" />
  </svg>
)

function Thumb({ item, className }) {
  return (
    <MediaSlider
      media={item.media}
      fallback={item.image}
      aspectClass="aspect-square"
      containerClass={className}
    />
  )
}

function QtyControl({ c, item, variant }) {
  const btn =
    variant === 'marketplace'
      ? 'px-3 py-2 hover:bg-gray-100'
      : 'px-3 py-2 hover:bg-gray-100'
  const box =
    variant === 'marketplace'
      ? 'flex items-center border rounded-lg'
      : variant === 'minimal'
        ? 'flex items-center border border-gray-900'
        : 'flex items-center border-2 border-gray-900'
  const val = variant === 'editorial' ? 'px-3 font-black' : 'px-3 font-medium'
  return (
    <div className={box}>
      <button
        onClick={() => c.updateQty(item.product_id, item.quantity - 1)}
        disabled={item.quantity <= 1}
        className={`${btn} disabled:opacity-40`}
        aria-label="Decrease quantity"
      >
        −
      </button>
      <span className={val}>{item.quantity}</span>
      <button
        onClick={() => c.updateQty(item.product_id, item.quantity + 1)}
        disabled={item.quantity >= item.stock}
        className={`${btn} disabled:opacity-40`}
        aria-label="Increase quantity"
      >
        +
      </button>
    </div>
  )
}

function CartItemRow({ c, item, variant }) {
  const nameCls =
    variant === 'marketplace'
      ? 'font-semibold hover:text-primary'
      : variant === 'minimal'
        ? 'font-semibold hover:text-gray-900'
        : 'font-bold hover:text-accent'
  const thumbCls =
    variant === 'marketplace'
      ? 'w-20 h-20 rounded-xl overflow-hidden shrink-0 border border-gray-100'
      : 'w-24 h-24 shrink-0 border overflow-hidden'
  const wrapCls =
    variant === 'marketplace'
      ? 'bg-white border border-gray-100 rounded-2xl shadow-sm p-5 flex flex-wrap items-center gap-4'
      : 'py-8 flex flex-wrap items-center gap-6'
  const lineCls =
    variant === 'marketplace'
      ? 'font-bold w-24 text-right text-lg'
      : variant === 'minimal'
        ? 'font-bold w-24 text-right'
        : 'font-black w-24 text-right'

  return (
    <div className={wrapCls}>
      <div className={thumbCls}>
        <Thumb item={item} className={thumbCls} />
      </div>
      <div className="flex-1 min-w-40">
        <Link to={`/product/${item.slug ?? ''}`} className={nameCls}>
          {item.name}
        </Link>
        <p className="text-gray-500 text-sm mt-0.5">
          <span className={item.sale_price != null && item.sale_price !== '' ? 'font-semibold text-red-600' : ''}>
            ${Number(item.price).toFixed(2)}
          </span>
          {item.sale_price != null && item.sale_price !== '' && (
            <span className="line-through text-gray-400 ml-1">${Number(item.original_price ?? item.price).toFixed(2)}</span>          )}
          {' each'}{item.brand ? ` · ${item.brand}` : ''}
        </p>
        <div className="mt-2 text-xs text-green-600 font-medium">✔ In stock</div>
      </div>
      <QtyControl c={c} item={item} variant={variant} />
      <span className={lineCls}>${(Number(item.price) * item.quantity).toFixed(2)}</span>
      <button
        onClick={() => c.removeItem(item.product_id)}
        className="text-gray-400 hover:text-red-600 transition-colors"
        aria-label="Remove"
      >
        {TRASH_ICON}
      </button>
    </div>
  )
}

function FreeShippingBar({ c, variant }) {
  const pct = Math.min(100, (c.total / c.freeThreshold) * 100)
  const unlocked = c.total >= c.freeThreshold
  const track =
    variant === 'marketplace'
      ? 'mt-2 h-1.5 bg-white rounded-full overflow-hidden'
      : variant === 'minimal'
        ? 'mt-2 h-1 bg-gray-200'
        : 'mt-1.5 h-1.5 bg-white'
  const fill =
    variant === 'marketplace'
      ? 'h-full bg-primary rounded-full'
      : variant === 'minimal'
        ? 'h-full bg-gray-900'
        : 'h-full bg-black'
  return (
    <div
      className={
        variant === 'marketplace'
          ? 'bg-primary-soft rounded-xl px-3 py-2.5'
          : variant === 'minimal'
            ? 'mb-5'
            : 'bg-gray-50 border border-gray-900 p-2.5 mb-4'
      }
    >
      <p className={variant === 'marketplace' ? 'text-xs font-medium text-primary' : variant === 'minimal' ? 'text-xs font-medium' : 'text-[11px] font-bold'}>
        {unlocked
          ? '🎉 FREE shipping unlocked!'
          : `🚚 Add $${(c.freeThreshold - c.total).toFixed(2)} more for FREE shipping`}
      </p>
      <div className={track}>
        <div className={fill} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function OrderSummary({ c, variant }) {
  const eyebrow =
    variant === 'marketplace'
      ? null
      : variant === 'minimal'
        ? 'uppercase tracking-[0.25em] text-[10px] text-gray-400 font-bold mb-4'
        : 'uppercase tracking-[0.3em] text-[10px] text-gray-400 font-bold mb-3'
  const wrap =
    variant === 'marketplace'
      ? 'bg-white border border-gray-100 rounded-2xl shadow-xl p-5 lg:sticky lg:top-24 space-y-4'
      : variant === 'minimal'
        ? 'bg-white border border-gray-200 p-5 lg:sticky lg:top-24 shadow-sm'
        : 'lg:sticky lg:top-24 bg-white p-4 shadow-[0_8px_40px_-4px_rgba(0,0,0,0.25)] ring-1 ring-black/5'
  const rowsWrap =
    variant === 'marketplace'
      ? 'space-y-2 text-sm border-b border-gray-100 pb-3'
      : variant === 'minimal'
        ? 'space-y-2 text-sm border-t border-gray-200 pt-4'
        : 'space-y-1.5 text-[13px] border-b border-gray-900 pb-3'
  const rowVal = variant === 'editorial' ? 'font-bold' : 'font-medium'
  const totalWrap =
    variant === 'marketplace'
      ? 'flex justify-between items-center text-base font-bold'
      : variant === 'minimal'
        ? 'flex justify-between items-center text-lg font-bold tracking-tight border-t border-gray-200 pt-4 mt-4'
        : 'flex justify-between items-center text-lg font-black tracking-tight pt-3 mt-1'
  const checkoutBtn =
    variant === 'marketplace'
      ? 'block w-full text-center bg-primary text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-primary-dark'
      : variant === 'minimal'
        ? 'block mt-5 w-full text-center bg-gray-900 text-white px-6 py-2.5 font-medium hover:bg-gray-800'
        : 'block mt-4 w-full text-center bg-black text-white px-6 py-2 text-sm font-bold hover:bg-gray-800'
  const trustLine =
    variant === 'marketplace'
      ? null
      : variant === 'minimal'
        ? 'mt-3 text-[11px] text-gray-400 text-center'
        : 'mt-2.5 text-[10px] text-gray-400 text-center font-medium'

  return (
    <aside className="lg:col-span-1">
      <div className={wrap}>
        {variant === 'marketplace' ? (
          <h2 className="text-base font-bold">Order Summary</h2>
        ) : (
          <p className={eyebrow}>{variant === 'minimal' ? '02 — Summary' : '02 — Summary'}</p>
        )}

        <FreeShippingBar c={c} variant={variant} />

        <div className={rowsWrap}>
          <div className="flex justify-between">
            <span className="text-gray-500">Subtotal</span>
            <span className={rowVal}>${c.total.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Shipping</span>
            <span className={`${rowVal} ${c.shippingFree ? 'text-green-600' : ''}`}>
              {c.shippingFree ? 'Free' : `$${c.shippingFee.toFixed(2)}`}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Tax (est.)</span>
            <span className={rowVal}>${c.taxEstimate.toFixed(2)}</span>
          </div>
        </div>

        <div className={totalWrap}>
          <span>Total</span>
          <span>${c.grandTotal.toFixed(2)}</span>
        </div>

        <Link to="/checkout" className={checkoutBtn}>
          Proceed to Checkout
        </Link>
        {variant !== 'marketplace' && (
          <p className={trustLine}>🔒 Secure · ↩️ Returns · 🎧 Support</p>
        )}
        {variant === 'marketplace' && (
          <>
            <Link to="/search" className="block text-center text-sm text-primary hover:underline">
              Continue shopping
            </Link>
            <div className="border-t border-gray-100 pt-3 grid grid-cols-3 gap-2 text-center">
              <div className="text-[11px] text-gray-500">
                <p className="text-lg mb-0.5">🔒</p>Secure
              </div>
              <div className="text-[11px] text-gray-500">
                <p className="text-lg mb-0.5">↩️</p>Returns
              </div>
              <div className="text-[11px] text-gray-500">
                <p className="text-lg mb-0.5">🎧</p>Support
              </div>
            </div>
          </>
        )}
      </div>
    </aside>
  )
}

function RecCard({ product, variant, onAdd }) {
  const body =
    variant === 'marketplace'
      ? 'group bg-white rounded-xl shadow overflow-hidden hover:shadow-lg transition-all border border-gray-100 hover:-translate-y-1 flex flex-col h-full'
      : variant === 'minimal'
        ? 'group flex items-center gap-3 border border-gray-200 p-3 pr-2 hover:border-gray-900 transition-colors'
        : 'group relative flex items-stretch border border-gray-900 bg-white hover:bg-gray-900 hover:text-white transition-colors'
  const imgWrap =
    variant === 'marketplace'
      ? 'h-28 w-full object-cover group-hover:scale-105 transition-transform duration-500'
      : variant === 'minimal'
        ? 'h-20 w-20 shrink-0 bg-gray-50 overflow-hidden'
        : 'h-20 w-20 shrink-0 object-cover'
  const nameCls =
    variant === 'marketplace'
      ? 'text-sm font-semibold mt-0.5 line-clamp-2 leading-5 group-hover:text-primary'
      : variant === 'minimal'
        ? 'text-sm font-semibold truncate group-hover:text-primary'
        : 'text-sm font-bold truncate'
  const brandCls =
    variant === 'marketplace'
      ? 'text-[10px] uppercase text-gray-400 truncate'
      : variant === 'minimal'
        ? 'text-[10px] uppercase text-gray-400'
        : 'text-[10px] uppercase tracking-wide text-gray-400 font-bold group-hover:text-white/60'
  const priceCls =
    variant === 'marketplace'
      ? 'text-sm font-bold text-primary'
      : variant === 'minimal'
        ? 'mt-1 text-sm font-bold'
        : 'mt-1 text-sm font-black'
  const addBtn =
    variant === 'marketplace'
      ? 'h-7 w-7 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary-dark'
      : variant === 'minimal'
        ? 'h-7 w-7 rounded-full bg-gray-900 text-white flex items-center justify-center hover:bg-primary transition-colors'
        : 'absolute top-1/2 -translate-y-1/2 right-2 h-7 w-7 bg-black text-white border border-black flex items-center justify-center hover:bg-white hover:text-black transition-colors'

  const image = product.media?.length ? (
    <MediaSlider media={product.media} fallback={product.image} aspectClass="aspect-square" containerClass={imgWrap} />
  ) : (
    <img src={product.image} alt={product.name} className={imgWrap} />
  )

  return (
    <div className={body}>
      {variant === 'marketplace' && (
        <Link to={`/product/${product.slug}`} className="block overflow-hidden">
          {image}
        </Link>
      )}
      {variant !== 'marketplace' && image}
      <div
        className={
          variant === 'marketplace'
            ? 'p-3 flex flex-col flex-1'
            : variant === 'minimal'
              ? 'min-w-0 flex-1'
              : 'py-2 pl-3 pr-2 min-w-0 flex-1'
        }
      >
        <p className={brandCls}>{product.brand || 'General'}</p>
        <Link to={`/product/${product.slug}`}>
          <h3 className={nameCls}>{product.name}</h3>
        </Link>
        <div className={variant === 'marketplace' ? 'mt-auto pt-2 flex items-center justify-between' : variant === 'minimal' ? '' : ''}>
          <span className={priceCls}>${Number(product.price).toFixed(2)}</span>
          {variant === 'minimal' && (
            <button onClick={() => onAdd(product)} className={`${addBtn} ml-2`} aria-label="Add to cart">
              {CART_ICON}
            </button>
          )}
        </div>
      </div>
      {variant !== 'minimal' && (
        <button onClick={() => onAdd(product)} className={`${addBtn} ${variant === 'editorial' ? '' : 'relative'}`} aria-label="Add to cart">
          {CART_ICON}
        </button>
      )}
    </div>
  )
}

function Recommendations({ c, variant }) {
  const recs = (c.recommended || []).slice(0, 4)
  if (recs.length === 0) return null
  const header =
    variant === 'marketplace' ? (
      <div className="flex items-end justify-between gap-4 mb-6">
        <h2 className="text-xl font-bold">You may also like</h2>
        <Link to="/search" className="text-sm text-primary hover:underline">
          View all
        </Link>
      </div>
    ) : (
      <div className={variant === 'minimal' ? 'mb-6' : 'flex items-end justify-between gap-4 mb-8'}>
        <p className="uppercase tracking-[0.25em] text-xs text-gray-400 font-bold">
          {variant === 'minimal' ? '03 — You may also like' : '03 — Complete your edit'}
        </p>
        {variant === 'editorial' && (
          <Link to="/search" className="text-sm text-gray-600 border-b border-gray-900 pb-0.5 hover:text-black font-semibold">
            View all
          </Link>
        )}
      </div>
    )
  const grid = variant === 'marketplace' ? 'grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6' : 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4'
  const section =
    variant === 'marketplace'
      ? 'w-full px-4 md:px-8 lg:px-10 pt-14'
      : variant === 'minimal'
        ? 'w-full px-6 md:px-10 mt-16 border-t border-gray-200 pt-12'
        : 'w-full px-4 md:px-8 py-14 bg-gray-50 border-t border-black/10'
  return (
    <section className={section}>
      {header}
      <div className={grid}>
        {recs.map((product) => (
          <RecCard key={product.id} product={product} variant={variant} onAdd={c.handleAddToCart} />
        ))}
      </div>
    </section>
  )
}

/* ============================================================
   Layout: Marketplace
   ============================================================ */

export function MarketplaceCartLayout({ c }) {
  return (
    <section className="w-full pb-20">
      <section className="w-full px-4 md:px-8 lg:px-10 pt-6">
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm px-6 py-8">
          <p className="text-sm text-gray-500">
            <Link to="/" className="hover:text-primary">Home</Link>
            <span className="mx-2">/</span>
            Cart
          </p>
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mt-1">Your Cart</h1>
            <p className="text-gray-500 text-sm">{c.count} items</p>
          </div>
        </div>
      </section>

      <section className="w-full px-4 md:px-8 lg:px-10 pt-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {c.items.map((item) => (
              <CartItemRow key={item.product_id} c={c} item={item} variant="marketplace" />
            ))}
            <div className="text-center">
              <Link to="/search" className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
                {BACK_ICON}
                Continue shopping
              </Link>
            </div>
          </div>
          <OrderSummary c={c} variant="marketplace" />
        </div>
      </section>

      <Recommendations c={c} variant="marketplace" />
    </section>
  )
}

/* ============================================================
   Layout: Minimal Premium
   ============================================================ */

export function MinimalCartLayout({ c }) {
  return (
    <section className="w-full pb-16">
      <section className="w-full px-6 md:px-10 pt-14 pb-10">
        <p className="uppercase tracking-[0.25em] text-xs text-gray-400 mb-3">01 — Shopping bag</p>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Your Cart</h1>
        <p className="text-gray-500 mt-3 max-w-xl">
          {c.count} items selected · Free shipping over ${c.freeThreshold}
        </p>
      </section>

      <section className="w-full px-6 md:px-10">
        <div className="grid lg:grid-cols-3 gap-14">
          <div className="lg:col-span-2">
            <div className="border-t border-gray-200 divide-y divide-gray-200">
              {c.items.map((item) => (
                <CartItemRow key={item.product_id} c={c} item={item} variant="minimal" />
              ))}
            </div>
            <div className="mt-10">
              <Link to="/search" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900">
                {BACK_ICON}
                Continue shopping
              </Link>
            </div>
          </div>
          <OrderSummary c={c} variant="minimal" />
        </div>
      </section>

      <Recommendations c={c} variant="minimal" />
    </section>
  )
}

/* ============================================================
   Layout: Bold Editorial
   ============================================================ */

export function EditorialCartLayout({ c }) {
  return (
    <section className="w-full pb-0">
      <section className="w-full px-4 md:px-8 py-6 border-b border-black/10">
        <p className="uppercase tracking-[0.3em] text-[10px] text-gray-400 font-bold">
          <Link to="/" className="hover:text-gray-700">Home</Link>
          <span className="mx-2">/</span>
          Cart
        </p>
        <h1 className="text-2xl md:text-3xl font-black tracking-tight leading-none mt-2">
          Your <span className="italic text-accent">Cart</span>
        </h1>
        <p className="mt-2 text-xs text-gray-500">
          {c.count} items · Free shipping over ${c.freeThreshold}
        </p>
      </section>

      <section className="w-full px-4 md:px-8 py-10">
        <div className="grid lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2">
            <div className="divide-y divide-gray-900">
              {c.items.map((item) => (
                <CartItemRow key={item.product_id} c={c} item={item} variant="editorial" />
              ))}
            </div>
            <div className="mt-10">
              <Link to="/search" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-black font-semibold">
                {BACK_ICON}
                Continue shopping
              </Link>
            </div>
          </div>
          <OrderSummary c={c} variant="editorial" />
        </div>
      </section>

      <Recommendations c={c} variant="editorial" />
    </section>
  )
}
