import { useRef } from 'react'
import { Link } from 'react-router-dom'
import ProductCard from '../ProductCard'
import HeroSlider from './HeroSlider'
import ProductRail from './ProductRail'
import CategoryCarousel from './CategoryCarousel'
import TrustBand from './TrustBand'
import NewsletterStrip from './NewsletterStrip'
import { resolveAssetUrl } from '../../utils/media'

function SectionHeader({ eyebrow, title, subtitle, link }) {
  return (
    <div className="flex items-end justify-between mb-8">
      <div>
        {eyebrow && (
          <p className="uppercase tracking-[0.3em] text-xs text-accent font-bold mb-2">{eyebrow}</p>
        )}
        <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight">{title}</h2>
        {subtitle && <p className="text-gray-500 mt-2">{subtitle}</p>}
      </div>
      {link && (
        <Link
          to={link.to}
          className="text-primary font-semibold text-sm border-b border-primary pb-0.5 hover:text-accent hover:border-accent transition-colors shrink-0"
        >
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
        <section className="w-full px-4 md:px-8 lg:px-10 pt-5">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
            <Link
              to="/search"
              className="shrink-0 px-5 py-2 rounded-full bg-primary text-white text-sm font-semibold hover:bg-primary-dark transition-colors"
            >
              All
            </Link>
            {categories.map((c) => (
              <Link
                key={c.slug}
                to={`/search?category=${c.slug}`}
                className="shrink-0 px-5 py-2 rounded-full bg-white border border-primary-light text-gray-700 text-sm font-medium hover:border-primary hover:text-primary transition-colors"
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
        <section className="w-full px-4 md:px-8 lg:px-10 pt-16">
          <SectionHeader
            eyebrow="Collections"
            title="Featured Categories"
            subtitle="Hand-picked collections"
            link={{ to: '/search', label: 'View all' }}
          />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {featuredCategories.map((c) => (
              <Link
                key={c.slug}
                to={`/search?category=${c.slug}`}
                className="group relative rounded-2xl overflow-hidden border border-primary-light h-48 md:h-60"
              >
                <img
                  src={resolveAssetUrl(c.image)}
                  alt={c.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-0 p-4 text-white">
                  <p className="font-bold text-lg leading-snug tracking-tight">{c.name}</p>
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
        <section className="w-full px-4 md:px-8 lg:px-10 pt-16">
          <SectionHeader
            eyebrow="Best sellers"
            title="Popular Products"
            subtitle="Best sellers our customers love"
            link={{ to: '/search', label: 'View all' }}
          />
          <ProductRail products={popularProducts} />
        </section>
      )}

      {categories.length > 0 && (
        <section className="w-full px-4 md:px-8 lg:px-10 pt-20">
          <SectionHeader
            eyebrow="Explore"
            title="Shop by Category"
            subtitle="Explore our collections"
            link={{ to: '/search', label: 'All categories' }}
          />
          <CategoryCarousel
            items={categories.map((c) => ({ ...c, meta: `${c.product_count} item${c.product_count === 1 ? '' : 's'}` }))}
            itemWidth="w-60 md:w-72"
            cardClass="h-64"
          />
        </section>
      )}

      {recommended.length > 0 && (
        <section className="w-full px-4 md:px-8 lg:px-10 pt-20">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="uppercase tracking-[0.3em] text-xs text-accent font-bold mb-2">For you</p>
              <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight">Recommended for you</h2>
              <p className="text-gray-500 mt-2">Based on your cart and past purchases</p>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/search" className="text-primary font-semibold text-sm border-b border-primary pb-0.5 hover:text-accent hover:border-accent mr-2 hidden sm:inline">
                See all
              </Link>
              <button
                onClick={() => scrollRec(-1)}
                className="w-10 h-10 rounded-full border border-primary-light bg-white flex items-center justify-center text-gray-600 hover:bg-primary hover:text-white transition-colors"
                aria-label="Scroll recommended left"
              >
                ‹
              </button>
              <button
                onClick={() => scrollRec(1)}
                className="w-10 h-10 rounded-full border border-primary-light bg-white flex items-center justify-center text-gray-600 hover:bg-primary hover:text-white transition-colors"
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
        <section className="w-full px-4 md:px-8 lg:px-10 pt-20">
          <TrustBand features={features} variant="cards" />
        </section>
      )}

      <section className="w-full px-4 md:px-8 lg:px-10 pt-2">
        <NewsletterStrip variant="gradient" />
      </section>
    </div>
  )
}
