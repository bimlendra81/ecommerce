import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import ProductRail from './ProductRail'
import CategoryCarousel from './CategoryCarousel'
import TrustBand from './TrustBand'
import NewsletterStrip from './NewsletterStrip'
import { resolveAssetUrl } from '../../utils/media'

const placeholder = (name) => `https://placehold.co/600x400?text=${encodeURIComponent(name)}`

function splitHeadline(text) {
  const words = text.trim().split(/\s+/)
  if (words.length <= 1) return ['', text]
  const mid = Math.ceil(words.length / 2)
  return [words.slice(0, mid).join(' '), words.slice(mid).join(' ')]
}

function SectionHeader({ index, label, title, link }) {
  return (
    <div className="flex items-end justify-between mb-10">
      <div>
        <p className="uppercase tracking-[0.25em] text-xs text-accent font-bold mb-2">
          {index} — {label}
        </p>
        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">{title}</h2>
      </div>
      {link && (
        <Link
          to={link.to}
          className="text-sm font-medium text-gray-500 hover:text-primary border-b border-primary-light pb-0.5 shrink-0"
        >
          {link.label}
        </Link>
      )}
    </div>
  )
}

export default function MinimalTemplate({
  slides,
  popularProducts,
  categories,
  trendingCategories,
  featuredCategories,
  features,
  settings,
}) {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (slides.length < 2 || paused) return
    const timer = setInterval(() => setIndex((i) => (i + 1) % slides.length), 5000)
    return () => clearInterval(timer)
  }, [slides.length, paused])

  const active = slides[index]
  const eyebrow = active?.subtitle
  const [headlineTop, headlineBottom] = splitHeadline(active?.title || settings.site_title || 'Beautiful things')
  const fallbackImage = (categories.find((c) => c.image) || {}).image || placeholder('hero')

  return (
    <div className="pb-0">
      <section
        className="relative w-full bg-gray-900 overflow-hidden"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {slides.length > 0 ? (
          <div className="relative h-[420px] md:h-[500px]">
            {slides.map((s, i) => {
              const isActive = i === index
              return (
                <div
                  key={s.id}
                  className={`absolute inset-0 transition-opacity duration-700 ${
                    isActive ? 'opacity-100' : 'opacity-0 pointer-events-none'
                  }`}
                >
                  <img src={resolveAssetUrl(s.image)} alt={s.title || ''} className="w-full h-full object-cover" />
                </div>
              )
            })}
          </div>
        ) : (
          <img src={resolveAssetUrl(fallbackImage)} alt="" className="absolute inset-0 w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/50" />

        <div key={index} className="relative w-full px-6 md:px-10 pt-8 md:pt-12 pb-8 md:pb-12 text-white">
          <div className="max-w-3xl fade-up">
            {eyebrow && (
              <p className="uppercase tracking-[0.3em] text-xs text-accent font-bold mb-3">{eyebrow}</p>
            )}
            <h1 className="text-2xl sm:text-3xl md:text-5xl font-extrabold tracking-tight leading-[1.1]">
              {headlineTop}
              {headlineTop && <br />}
              {headlineBottom && <span className="italic text-accent">{headlineBottom}</span>}
            </h1>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to={active?.link || '/search'}
                className="bg-accent text-white px-7 py-3 rounded-full text-sm font-bold hover:bg-white hover:text-gray-900 transition-colors"
              >
                Explore
              </Link>
            </div>
          </div>
        </div>

        {slides.length > 1 && (
          <>
            <button
              onClick={() => setIndex((index - 1 + slides.length) % slides.length)}
              className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2 z-20 bg-white/85 hover:bg-white text-gray-800 w-10 h-10 rounded-full flex items-center justify-center shadow"
              aria-label="Previous slide"
            >
              ‹
            </button>
            <button
              onClick={() => setIndex((index + 1) % slides.length)}
              className="absolute right-4 md:right-6 top-1/2 -translate-y-1/2 z-20 bg-white/85 hover:bg-white text-gray-800 w-10 h-10 rounded-full flex items-center justify-center shadow"
              aria-label="Next slide"
            >
              ›
            </button>
            <div className="absolute bottom-6 inset-x-0 z-20 flex justify-center gap-2">
              {slides.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => setIndex(i)}
                  className={`h-1.5 rounded-full transition-all ${i === index ? 'w-7 bg-accent' : 'w-1.5 bg-white/50 hover:bg-white/80'}`}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </section>

      {popularProducts.length > 0 && (
        <section className="w-full px-6 md:px-10 pt-6 pb-20">
          <SectionHeader
            index="01"
            label="Bestsellers"
            title="Loved by customers"
            link={{ to: '/search', label: 'View all →' }}
          />
          <ProductRail products={popularProducts} itemWidth="min-w-[200px] max-w-[200px]" />
        </section>
      )}

      {trendingCategories.length > 0 && (
        <section className="w-full py-14">
          <div className="px-6 md:px-10">
            <SectionHeader index="02" label="Trending" title="Most wanted right now" />
          </div>
          <CategoryCarousel
            items={trendingCategories.map((c) => ({ ...c, meta: `${c.sold} sold` }))}
          />
        </section>
      )}

      {featuredCategories.length > 0 && (
        <section className="w-full py-14">
          <div className="px-6 md:px-10">
            <SectionHeader index="03" label="Featured" title="Hand-picked collections" />
          </div>
          <CategoryCarousel
            items={featuredCategories.map((c) => ({ ...c, meta: `${c.product_count} item${c.product_count === 1 ? '' : 's'}` }))}
          />
        </section>
      )}

      {categories.length > 0 && (
        <section className="w-full px-6 md:px-10 py-8">
          <SectionHeader index="04" label="Collections" title="Shop by category" />
          <CategoryCarousel
            items={categories.map((c) => ({ ...c, meta: `${c.product_count} item${c.product_count === 1 ? '' : 's'}` }))}
            itemWidth="w-48 md:w-60"
            round
            cardClass="aspect-[4/5]"
          />
        </section>
      )}

      {features.length > 0 && (
        <section className="w-full px-6 md:px-10 py-10 border-t border-primary-light">
          <TrustBand features={features} variant="center" />
        </section>
      )}

      <NewsletterStrip variant="minimal" />
    </div>
  )
}
