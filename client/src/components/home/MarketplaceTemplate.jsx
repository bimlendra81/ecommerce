import { useRef } from 'react'
import { Link } from 'react-router-dom'
import ProductCard from '../ProductCard'
import HeroSlider from './HeroSlider'
import ProductRail from './ProductRail'
import CategoryCarousel from './CategoryCarousel'
import TrustBand from './TrustBand'
import NewsletterStrip from './NewsletterStrip'

function SectionHeader({ title, subtitle, link }) {
  return (
    <div className="flex items-end justify-between mb-6">
      <div>
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">{title}</h2>
        {subtitle && <p className="text-gray-500 mt-1">{subtitle}</p>}
      </div>
      {link && (
        <Link to={link.to} className="text-primary font-medium hover:underline shrink-0">
          {link.label}
        </Link>
      )}
    </div>
  )
}

export default function MarketplaceTemplate({
  slides,
  popularProducts,
  categories,
  featuredCategories,
  recommended,
  features,
}) {
  const recRef = useRef(null)

  function cardStep(el) {
    const card = el?.firstElementChild
    return (card?.offsetWidth || 240) + 24
  }

  function scrollRec(direction) {
    const el = recRef.current
    if (el) el.scrollBy({ left: direction * cardStep(el), behavior: 'smooth' })
  }

  return (
    <div>
      {categories.length > 0 && (
        <section className="w-full px-4 md:px-8 lg:px-10 pt-4">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
            <Link
              to="/search"
              className="shrink-0 px-4 py-1.5 rounded-full bg-primary text-white text-sm font-medium hover:bg-primary-dark transition-colors"
            >
              All
            </Link>
            {categories.map((c) => (
              <Link
                key={c.slug}
                to={`/search?category=${c.slug}`}
                className="shrink-0 px-4 py-1.5 rounded-full bg-white border border-gray-200 text-gray-700 text-sm font-medium hover:border-primary hover:text-primary transition-colors"
              >
                {c.name} · {c.product_count}
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="w-full">
        <HeroSlider slides={slides} />
      </section>

      {featuredCategories.length > 0 && (
        <section className="w-full px-4 md:px-8 lg:px-10 pt-12">
          <SectionHeader
            title="Featured Categories"
            subtitle="Hand-picked collections"
            link={{ to: '/search', label: 'View all →' }}
          />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {featuredCategories.map((c) => (
              <Link
                key={c.slug}
                to={`/search?category=${c.slug}`}
                className="group relative rounded-2xl overflow-hidden shadow-lg h-44 md:h-52"
              >
                <img
                  src={c.image}
                  alt={c.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
                <div className="absolute bottom-0 p-4 text-white">
                  <p className="font-bold text-lg leading-snug">{c.name}</p>
                  <p className="text-xs text-white/75 mt-0.5">
                    {c.product_count} item{c.product_count === 1 ? '' : 's'}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {popularProducts.length > 0 && (
        <section className="w-full px-4 md:px-8 lg:px-10 pt-12">
          <SectionHeader
            title="Popular Products"
            subtitle="Best sellers our customers love"
            link={{ to: '/search', label: 'View all →' }}
          />
          <ProductRail products={popularProducts} />
        </section>
      )}

      {categories.length > 0 && (
        <section className="w-full px-4 md:px-8 lg:px-10 pt-14">
          <SectionHeader
            title="Shop by Category"
            subtitle="Explore our collections"
            link={{ to: '/search', label: 'All categories →' }}
          />
          <CategoryCarousel
            items={categories.map((c) => ({ ...c, meta: `${c.product_count} item${c.product_count === 1 ? '' : 's'}` }))}
            itemWidth="w-60 md:w-72"
            cardClass="h-64"
          />
        </section>
      )}

      {/* {promoCategories.length > 0 && (
        <section className="w-full px-4 md:px-8 lg:px-10 pt-14">
          <div className="grid md:grid-cols-2 gap-4">
            {promoCategories.map((c, i) => (
              <Link
                key={c.slug}
                to={`/search?category=${c.slug}`}
                className="group relative rounded-2xl overflow-hidden shadow-lg h-52 md:h-60"
              >
                <img
                  src={c.image || placeholder(c.name)}
                  alt={c.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div
                  className={`absolute inset-0 ${
                    i === 0 ? 'bg-gradient-to-r from-primary/90 to-accent/70' : 'bg-gradient-to-r from-gray-900/90 to-gray-700/70'
                  }`}
                />
                <div className="relative h-full flex items-center justify-between px-8 text-white">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-white/80 font-semibold">
                      {i === 0 ? 'Limited time' : 'New arrivals'}
                    </p>
                    <p className="text-2xl md:text-3xl font-extrabold mt-1">{c.name} picks</p>
                    <p className="text-white/80 mt-1 text-sm">
                      {c.product_count} item{c.product_count === 1 ? '' : 's'} to explore
                    </p>
                  </div>
                  <span
                    className={`bg-white ${i === 0 ? 'text-primary' : 'text-gray-900'} font-semibold px-5 py-2.5 rounded-full text-sm shrink-0 hover:bg-gray-100 transition-colors`}
                  >
                    Shop now
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )} */}

      {recommended.length > 0 && (
        <section className="w-full px-4 md:px-8 lg:px-10 pt-14">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Recommended for you</h2>
              <p className="text-gray-500 mt-1">Based on your cart and past purchases</p>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/search" className="text-primary font-medium hover:underline mr-2 hidden sm:inline">
                See all →
              </Link>
              <button
                onClick={() => scrollRec(-1)}
                className="w-9 h-9 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100"
                aria-label="Scroll recommended left"
              >
                ‹
              </button>
              <button
                onClick={() => scrollRec(1)}
                className="w-9 h-9 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100"
                aria-label="Scroll recommended right"
              >
                ›
              </button>
            </div>
          </div>

          <div ref={recRef} className="flex gap-5 overflow-x-auto pb-4 scrollbar-none edge-fade">
            {recommended.map((product) => (
              <div key={product.id} className="min-w-[240px] max-w-[240px] shrink-0">
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </section>
      )}

      {features.length > 0 && (
        <section className="w-full px-4 md:px-8 lg:px-10 pt-16">
          <TrustBand features={features} variant="cards" />
        </section>
      )}

      <section className="w-full px-4 md:px-8 lg:px-10 pt-2">
        <NewsletterStrip variant="gradient" />
      </section>
    </div>
  )
}
