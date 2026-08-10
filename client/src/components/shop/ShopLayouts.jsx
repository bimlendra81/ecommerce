import { Fragment, useState } from 'react'
import { Link } from 'react-router-dom'
import ProductCard from '../ProductCard'

/* ============================================================
   Shared filter building blocks (styled per layout below)
   ============================================================ */

export function SearchInput({ value, onChange, onSubmit, className, containerClass }) {
  return (
    <form noValidate onSubmit={onSubmit} className={containerClass || 'flex gap-2'}>
      <div className="relative flex-1">
        <input
          type="text"
          placeholder="Search..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={className || 'border rounded px-3 py-2 w-full text-sm pr-8'}
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 text-lg leading-none"
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
      </div>
    </form>
  )
}

export function PriceRangeFilter({ draftMin, draftMax, globalMin, globalMax, onMin, onMax }) {
  if (draftMin === null || draftMax === null) {
    return <p className="text-sm text-gray-400">Loading price range...</p>
  }
  const span = Math.max(globalMax - globalMin, 1)
  const minPct = ((draftMin - globalMin) / span) * 100
  const maxPct = ((globalMax - draftMax) / span) * 100
  const thumb =
    '[&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none ' +
    '[&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full ' +
    '[&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white ' +
    '[&::-webkit-slider-thumb]:shadow'
  return (
    <>
      <div className="flex items-center justify-between text-sm mb-2">
        <span className="text-gray-400">${globalMin}</span>
        <span className="text-gray-400">${globalMax}</span>
      </div>
      <div className="relative h-6">
        <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-1.5 rounded bg-gray-200" />
        <div
          className="absolute top-1/2 -translate-y-1/2 h-1.5 rounded bg-primary"
          style={{ left: `${minPct}%`, right: `${maxPct}%` }}
        />
        <input
          type="range"
          min={globalMin}
          max={globalMax}
          step={1}
          value={draftMin}
          onChange={(e) => onMin(Math.min(Number(e.target.value), draftMax - 1))}
          className={`absolute inset-0 w-full appearance-none bg-transparent pointer-events-none ${thumb}`}
        />
        <input
          type="range"
          min={globalMin}
          max={globalMax}
          step={1}
          value={draftMax}
          onChange={(e) => onMax(Math.max(Number(e.target.value), draftMin + 1))}
          className={`absolute inset-0 w-full appearance-none bg-transparent pointer-events-none ${thumb}`}
        />
      </div>
      <div className="flex items-center gap-2 mt-3">
        <div className="flex items-center border rounded px-1 py-0.5 text-sm flex-1 justify-between">
          <button
            type="button"
            onClick={() => onMin(Math.max(globalMin, draftMin - 1))}
            className="px-2 text-gray-500 hover:text-primary"
          >
            −
          </button>
          <span className="text-gray-700 font-medium">${draftMin}</span>
          <button
            type="button"
            onClick={() => onMin(Math.min(draftMax - 1, draftMin + 1))}
            className="px-2 text-gray-500 hover:text-primary"
          >
            +
          </button>
        </div>
        <span className="text-gray-400">–</span>
        <div className="flex items-center border rounded px-1 py-0.5 text-sm flex-1 justify-between">
          <button
            type="button"
            onClick={() => onMax(Math.max(draftMin + 1, draftMax - 1))}
            className="px-2 text-gray-500 hover:text-primary"
          >
            −
          </button>
          <span className="text-gray-700 font-medium">${draftMax}</span>
          <button
            type="button"
            onClick={() => onMax(Math.min(globalMax, draftMax + 1))}
            className="px-2 text-gray-500 hover:text-primary"
          >
            +
          </button>
        </div>
      </div>
    </>
  )
}

export function RatingFilter({ ratingFilter, onSelect }) {
  return (
    <>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onSelect(ratingFilter === String(n) ? '' : String(n))}
            title={`${n} star${n > 1 ? 's' : ''} & up`}
            aria-label={`${n} stars and up`}
            className={`text-2xl leading-none transition-colors ${
              ratingFilter !== '' && Number(ratingFilter) >= n
                ? 'text-amber-500'
                : 'text-gray-300 hover:text-amber-400'
            }`}
          >
            ★
          </button>
        ))}
      </div>
      <p className="text-xs text-gray-400 mt-1">
        {ratingFilter ? `Minimum ${ratingFilter}★` : 'Click stars to filter'}
      </p>
    </>
  )
}

export function CategoryFilter({ categories, category, onSelect }) {
  return (
    <>
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="radio" name="category" checked={category === ''} onChange={() => onSelect('')} />
        All
      </label>
      {categories.map((c) => (
        <label key={c.slug} className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="category"
            checked={category === c.slug}
            onChange={() => onSelect(c.slug)}
          />
          {c.name}
        </label>
      ))}
    </>
  )
}

export function BrandFilter({ brands, selectedBrands, onToggle }) {
  if (brands.length === 0) return <p className="text-gray-400 text-sm">No brands yet</p>
  return brands.map((b) => (
    <label key={b.slug} className="flex items-center gap-2 cursor-pointer">
      <input
        type="checkbox"
        checked={selectedBrands.includes(b.slug)}
        onChange={() => onToggle(b.slug)}
      />
      {b.name}
    </label>
  ))
}

const MOBILE_INPUT_CLASSES = {
  marketplace:
    'bg-white border border-gray-200 rounded-lg shadow-sm px-3 py-2 w-full text-sm pr-8 focus:outline-none focus:ring-2 focus:ring-primary',
  minimal:
    'bg-white border border-gray-200 rounded-lg shadow-sm px-3 py-2 w-full text-sm pr-8 focus:outline-none focus:ring-2 focus:ring-gray-900',
  editorial:
    'bg-white border border-gray-200 rounded-lg shadow-sm px-3 py-2 w-full text-sm pr-8 focus:outline-none focus:ring-2 focus:ring-gray-900',
}

const MOBILE_FILTER_BUTTON = {
  marketplace: 'border border-gray-200 rounded-lg bg-white shadow-sm text-gray-700',
  minimal: 'text-black',
  editorial: 'border border-gray-900 text-gray-900',
}

function DrawerSection({ label, children }) {
  return (
    <div className="mb-6">
      <p className="uppercase tracking-[0.25em] text-xs text-gray-500 font-semibold mb-3">{label}</p>
      {children}
    </div>
  )
}

function MobileFilterBar({ f, variant }) {
  const [open, setOpen] = useState(false)
  const priceActive =
    f.draftMin !== undefined &&
    f.globalMin !== undefined &&
    (f.draftMin !== f.globalMin || f.draftMax !== f.globalMax)
  const count =
    (f.category ? 1 : 0) +
    f.selectedBrands.length +
    (f.ratingFilter ? 1 : 0) +
    (priceActive ? 1 : 0)
  const inputClass = MOBILE_INPUT_CLASSES[variant] || MOBILE_INPUT_CLASSES.marketplace
  const buttonClass = MOBILE_FILTER_BUTTON[variant] || MOBILE_FILTER_BUTTON.marketplace

  return (
    <>
      <div className="flex items-center gap-2 md:hidden mb-6">
        <div className="flex-1">
          <SearchInput
            value={f.search}
            onChange={f.onSearchChange}
            onSubmit={f.onSearchSubmit}
            className={inputClass}
            containerClass="flex-1"
          />
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={`shrink-0 flex items-center gap-1.5 px-3 py-2 text-sm font-medium ${buttonClass}`}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="4" y1="6" x2="20" y2="6" />
            <line x1="4" y1="12" x2="20" y2="12" />
            <line x1="4" y1="18" x2="20" y2="18" />
            <circle cx="9" cy="6" r="2" />
            <circle cx="15" cy="12" r="2" />
            <circle cx="7" cy="18" r="2" />
          </svg>
          <span className="max-[400px]:hidden">Filters</span>
          {count > 0 && (
            <span className="bg-primary text-white text-[11px] font-bold rounded-full h-5 min-w-5 px-1 flex items-center justify-center">
              {count}
            </span>
          )}
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-2xl bg-white p-5 pb-8 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold">Filters</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-2xl leading-none text-gray-400 hover:text-gray-900"
                aria-label="Close filters"
              >
                ✕
              </button>
            </div>

            {f.hasFilters && (
              <button
                type="button"
                onClick={() => {
                  f.clearAll()
                  setOpen(false)
                }}
                className="text-sm text-gray-500 underline underline-offset-4 mb-4"
              >
                Clear all filters
              </button>
            )}

            <DrawerSection label="Price Range">
              <PriceRangeFilter
                draftMin={f.draftMin}
                draftMax={f.draftMax}
                globalMin={f.globalMin}
                globalMax={f.globalMax}
                onMin={f.setDraftMin}
                onMax={f.setDraftMax}
              />
            </DrawerSection>

            <DrawerSection label="Rating">
              <RatingFilter ratingFilter={f.ratingFilter} onSelect={f.setRatingFilter} />
            </DrawerSection>

            <DrawerSection label="Categories">
              <div className="space-y-2 text-sm">
                <CategoryFilter categories={f.categories} category={f.category} onSelect={f.setCategoryFilter} />
              </div>
            </DrawerSection>

            <DrawerSection label="Brands">
              <div className="space-y-2 text-sm">
                <BrandFilter brands={f.brands} selectedBrands={f.selectedBrands} onToggle={f.toggleBrand} />
              </div>
            </DrawerSection>

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="w-full bg-gray-900 text-white rounded-xl py-3 text-sm font-semibold mt-2"
            >
              Show {f.total} result{f.total === 1 ? '' : 's'}
            </button>
          </div>
        </div>
      )}
    </>
  )
}

function pageList(page, pages) {
  const set = new Set([1, pages])
  for (let i = Math.max(2, page - 2); i <= Math.min(pages - 1, page + 2); i++) set.add(i)
  return [...set].sort((a, b) => a - b)
}

export function ShopPagination({ page, pages, onPage, pill }) {
  if (pages <= 1) return null
  const navBtn = pill
    ? 'px-3 py-2 rounded-full border border-gray-200 text-sm font-medium hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-white'
    : 'px-3 py-2 rounded-full border border-gray-900 text-sm font-medium text-gray-900 hover:bg-gray-900 hover:text-white disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-gray-900'
  const numBtn = pill
    ? 'h-10 w-10 rounded-full border text-sm font-medium flex items-center justify-center transition-colors disabled:opacity-40'
    : 'h-10 w-10 rounded-full border border-gray-300 text-sm font-medium flex items-center justify-center transition-colors disabled:opacity-30'
  const items = pageList(page, pages)
  return (
    <div className="flex justify-center items-center gap-1.5 mt-12 flex-wrap">
      <button
        type="button"
        onClick={() => onPage(1)}
        disabled={page <= 1}
        className={navBtn}
        aria-label="First page"
      >
        «
      </button>
      <button
        type="button"
        onClick={() => onPage(Math.max(page - 1, 1))}
        disabled={page <= 1}
        className={navBtn}
        aria-label="Previous page"
      >
        ‹
      </button>
      {items.map((p, i) => {
        const prev = items[i - 1]
        return (
          <Fragment key={p}>
            {prev && p - prev > 1 && <span className="px-1 text-gray-400">…</span>}
            <button
              type="button"
              onClick={() => onPage(p)}
              disabled={p === page}
              className={`${numBtn} ${
                p === page
                  ? 'bg-primary text-white border-primary hover:bg-primary'
                  : 'text-gray-700 hover:bg-gray-900 hover:text-white hover:border-gray-900'
              }`}
            >
              {p}
            </button>
          </Fragment>
        )
      })}
      <button
        type="button"
        onClick={() => onPage(Math.min(page + 1, pages))}
        disabled={page >= pages}
        className={navBtn}
        aria-label="Next page"
      >
        ›
      </button>
      <button
        type="button"
        onClick={() => onPage(pages)}
        disabled={page >= pages}
        className={navBtn}
        aria-label="Last page"
      >
        »
      </button>
    </div>
  )
}

function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow overflow-hidden border border-gray-100 flex flex-col h-full animate-pulse">
      <div className="h-48 bg-gray-200" />
      <div className="p-4 flex flex-col flex-1 gap-2">
        <div className="h-3 w-16 bg-gray-200 rounded" />
        <div className="h-4 w-3/4 bg-gray-200 rounded" />
        <div className="h-4 w-1/2 bg-gray-200 rounded" />
        <div className="mt-1 h-3 w-12 bg-gray-200 rounded" />
        <div className="mt-1 flex items-center justify-between">
          <div className="h-5 w-14 bg-gray-200 rounded" />
          <div className="h-3 w-16 bg-gray-200 rounded" />
        </div>
        <div className="mt-3 h-9 w-full bg-gray-200 rounded-lg" />
      </div>
    </div>
  )
}

function ProductArea({ f, columns }) {
  const { products, isLoading, total } = f
  return (
    <div id="product-list" className="flex-1 min-w-0 scroll-mt-24">
      {isLoading ? (
        <div className={columns}>
          {Array.from({ length: 8 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : products.length === 0 ? (
        <p className="text-center text-gray-500 py-16">No products found</p>
      ) : (
        <>
          <div className={columns}>
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          <ShopPagination page={f.page} pages={f.pages} onPage={f.setPage} />
        </>
      )}
      {!isLoading && (
        <p className="text-center text-xs text-gray-400 mt-6">
          {total} product{total === 1 ? '' : 's'} found
        </p>
      )}
    </div>
  )
}

/* ============================================================
   Layout: Marketplace
   ============================================================ */

export function MarketplaceShopLayout({ f }) {
  const sortOptions = [
    ['newest', 'Newest'],
    ['popular', 'Most popular'],
    ['price-asc', 'Price: low to high'],
    ['price-desc', 'Price: high to low'],
  ]
  return (
    <div className="pb-16">
      <section className="w-full px-4 md:px-8 lg:px-10 pt-6">
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm px-6 py-8">
          <p className="text-sm text-gray-500">
            <Link to="/" className="hover:text-primary">Home</Link>
            <span className="mx-2">/</span>
            <Link to="/search" className="hover:text-primary">Search</Link>
          </p>
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mt-1">Search</h1>
            <p className="text-gray-500 text-sm">{f.total} product{f.total === 1 ? '' : 's'}</p>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none mt-5">
          <button
            type="button"
            onClick={() => f.setCategoryFilter('')}
            className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              f.category === ''
                ? 'bg-primary text-white'
                : 'bg-white border border-gray-200 text-gray-700 hover:border-primary hover:text-primary'
            }`}
          >
            Search all
          </button>
          {f.categories.map((c) => (
            <button
              key={c.slug}
              type="button"
              onClick={() => f.setCategoryFilter(c.slug)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                f.category === c.slug
                  ? 'bg-primary text-white'
                  : 'bg-white border border-gray-200 text-gray-700 hover:border-primary hover:text-primary'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </section>

      <section className="w-full px-4 md:px-8 lg:px-10 pt-8">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="md:hidden">
            <MobileFilterBar f={f} variant="marketplace" />
          </div>

          <aside className="hidden md:block md:w-64 shrink-0 space-y-5">
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <h3 className="font-semibold mb-3">Search</h3>
              <SearchInput value={f.search} onChange={f.onSearchChange} onSubmit={f.onSearchSubmit} />
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <h3 className="font-semibold mb-3">Price Range</h3>
              <PriceRangeFilter
                draftMin={f.draftMin}
                draftMax={f.draftMax}
                globalMin={f.globalMin}
                globalMax={f.globalMax}
                onMin={f.setDraftMin}
                onMax={f.setDraftMax}
              />
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <h3 className="font-semibold mb-3">Rating</h3>
              <RatingFilter ratingFilter={f.ratingFilter} onSelect={f.setRatingFilter} />
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <h3 className="font-semibold mb-3">Categories</h3>
              <div className="space-y-2 text-sm">
                <CategoryFilter categories={f.categories} category={f.category} onSelect={f.setCategoryFilter} />
              </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <h3 className="font-semibold mb-3">Brands</h3>
              <div className="space-y-2 text-sm">
                <BrandFilter brands={f.brands} selectedBrands={f.selectedBrands} onToggle={f.toggleBrand} />
              </div>
            </div>

            {f.hasFilters && (
              <button
                type="button"
                onClick={f.clearAll}
                className="w-full border border-gray-300 text-gray-600 py-2 rounded-xl text-sm hover:bg-gray-100"
              >
                Clear all filters
              </button>
            )}
          </aside>

          <div className="flex-1 min-w-0">
            <div className="bg-white border border-gray-100 rounded-2xl px-5 py-4 flex items-center justify-between gap-4 shadow-sm mb-6">
              <p className="text-sm text-gray-500">
                Showing {f.products.length} of {f.total}
              </p>
              <select
                value={f.sort}
                onChange={(e) => f.setSort(e.target.value)}
                className="border rounded-lg px-3 py-2 text-sm bg-white"
              >
                {sortOptions.map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </div>

            <ProductArea f={f} columns="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6" />
          </div>
        </div>
      </section>
    </div>
  )
}

/* ============================================================
   Layout: Minimal Premium
   ============================================================ */

function MinimalSection({ label, children }) {
  return (
    <div>
      <p className="uppercase tracking-[0.25em] text-xs text-black mb-4">{label}</p>
      {children}
    </div>
  )
}

export function MinimalShopLayout({ f }) {
  return (
    <div className="pb-16">
      <section className="w-full px-6 md:px-10 pt-14 pb-10">
        <p className="text-black mt-3 max-w-xl">
          {f.total} product{f.total === 1 ? '' : 's'}.
        </p>
      </section>

      <section className="w-full px-6 md:px-10">
        <div className="flex flex-col lg:flex-row gap-14">
          <div className="lg:hidden">
            <MobileFilterBar f={f} variant="minimal" />
          </div>

          <aside className="hidden lg:block lg:w-60 shrink-0 space-y-10">
            <MinimalSection label="Search">
              <SearchInput
                value={f.search}
                onChange={f.onSearchChange}
                onSubmit={f.onSearchSubmit}
                className="w-full bg-transparent border-b border-gray-200 py-2 text-sm placeholder-gray-400 focus:outline-none focus:border-gray-900 pr-8"
                containerClass="relative"
              />
            </MinimalSection>

            <MinimalSection label="Price">
              <PriceRangeFilter
                draftMin={f.draftMin}
                draftMax={f.draftMax}
                globalMin={f.globalMin}
                globalMax={f.globalMax}
                onMin={f.setDraftMin}
                onMax={f.setDraftMax}
              />
            </MinimalSection>

            <MinimalSection label="Rating">
              <RatingFilter ratingFilter={f.ratingFilter} onSelect={f.setRatingFilter} />
            </MinimalSection>

            <MinimalSection label="Categories">
              <div className="space-y-1 text-sm">
                <CategoryFilter categories={f.categories} category={f.category} onSelect={f.setCategoryFilter} />
              </div>
            </MinimalSection>

            <MinimalSection label="Brands">
              <div className="space-y-1 text-sm">
                <BrandFilter brands={f.brands} selectedBrands={f.selectedBrands} onToggle={f.toggleBrand} />
              </div>
            </MinimalSection>

            {f.hasFilters && (
              <button
                type="button"
                onClick={f.clearAll}
                className="text-sm text-black hover:text-gray-900 border-b border-gray-200 pb-0.5"
              >
                Clear all filters
              </button>
            )}
          </aside>

          <div className="flex-1 min-w-0">
            <div className="flex items-end justify-between gap-4 border-b border-gray-200 pb-4 mb-10">
              <p className="text-sm text-black">
                {f.total} item{f.total === 1 ? '' : 's'}
              </p>
              <select
                value={f.sort}
                onChange={(e) => f.setSort(e.target.value)}
                className="bg-transparent border-0 border-b border-gray-200 pb-1 text-sm text-black focus:outline-none focus:border-gray-900"
              >
                <option value="newest">Newest</option>
                <option value="popular">Most popular</option>
                <option value="price-asc">Price: low to high</option>
                <option value="price-desc">Price: high to low</option>
              </select>
            </div>

            <ProductArea f={f} columns="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-12" />
          </div>
        </div>
      </section>
    </div>
  )
}

/* ============================================================
   Layout: Bold Editorial
   ============================================================ */

function EditorialSection({ label, children }) {
  return (
    <div>
      <p className="uppercase tracking-[0.3em] text-xs text-gray-400 font-bold mb-5">{label}</p>
      {children}
    </div>
  )
}

export function EditorialShopLayout({ f }) {
  return (
    <div className="pb-16">
      <section className="w-full px-4 md:px-8 py-14">
        <div className="flex flex-col lg:flex-row gap-14">
          <div className="lg:hidden">
            <MobileFilterBar f={f} variant="editorial" />
          </div>

          <aside className="hidden lg:block lg:w-60 shrink-0 space-y-12">
            <EditorialSection label="Search">
              <SearchInput
                value={f.search}
                onChange={f.onSearchChange}
                onSubmit={f.onSearchSubmit}
                className="w-full bg-transparent border-b border-gray-900 py-2 text-sm placeholder-gray-400 focus:outline-none focus:border-black pr-8"
                containerClass="relative"
              />
            </EditorialSection>

            <EditorialSection label="Price">
              <PriceRangeFilter
                draftMin={f.draftMin}
                draftMax={f.draftMax}
                globalMin={f.globalMin}
                globalMax={f.globalMax}
                onMin={f.setDraftMin}
                onMax={f.setDraftMax}
              />
            </EditorialSection>

            <EditorialSection label="Rating">
              <RatingFilter ratingFilter={f.ratingFilter} onSelect={f.setRatingFilter} />
            </EditorialSection>

            <EditorialSection label="Categories">
              <div className="space-y-1 text-sm">
                <CategoryFilter categories={f.categories} category={f.category} onSelect={f.setCategoryFilter} />
              </div>
            </EditorialSection>

            <EditorialSection label="Brands">
              <div className="space-y-1 text-sm">
                <BrandFilter brands={f.brands} selectedBrands={f.selectedBrands} onToggle={f.toggleBrand} />
              </div>
            </EditorialSection>

            {f.hasFilters && (
              <button
                type="button"
                onClick={f.clearAll}
                className="text-sm text-gray-600 hover:text-black border-b border-gray-900 pb-0.5"
              >
                Clear all filters
              </button>
            )}
          </aside>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-4 border-b border-gray-900 pb-4 mb-10">
              <p className="text-sm text-gray-600">{f.total} pieces</p>
              <select
                value={f.sort}
                onChange={(e) => f.setSort(e.target.value)}
                className="bg-transparent border-0 border-b border-gray-900 pb-1 text-sm font-semibold focus:outline-none focus:border-black"
              >
                <option value="newest">Newest</option>
                <option value="popular">Most popular</option>
                <option value="price-asc">Price: low to high</option>
                <option value="price-desc">Price: high to low</option>
              </select>
            </div>

            <ProductArea f={f} columns="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-5 gap-y-12" />
          </div>
        </div>
      </section>
    </div>
  )
}
