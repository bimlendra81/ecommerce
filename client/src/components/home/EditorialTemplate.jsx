import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import ProductRail from './ProductRail'
import CategoryCarousel from './CategoryCarousel'
import TrustBand from './TrustBand'
import NewsletterStrip from './NewsletterStrip'
import { resolveAssetUrl } from '../../utils/media'

const placeholder = (name) => `https://placehold.co/600x400?text=${encodeURIComponent(name)}`

function splitItalic(text) {
  const words = text.trim().split(/\s+/)
  if (words.length <= 1) return ['', text]
  return [words.slice(0, -1).join(' '), words[words.length - 1]]
}

function SectionHeader({ index, label, title, link }) {
  return (
    <div className="flex items-end justify-between mb-14">
      <div>
        <p className="text-sm font-bold tracking-[0.3em] text-accent uppercase mb-3">{index} / {label}</p>
        <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">{title}</h2>
      </div>
      {link && (
        <Link to={link.to} className="border-b border-primary pb-0.5 font-medium text-sm shrink-0 hover:text-accent hover:border-accent transition-colors">
          {link.label}
        </Link>
      )}
    </div>
  )
}

export default function EditorialTemplate({ slides, popularProducts, categories, trendingCategories, featuredCategories, features, settings }) {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (slides.length < 2 || paused) return
    const timer = setInterval(() => setIndex((i) => (i + 1) % slides.length), 5000)
    return () => clearInterval(timer)
  }, [slides.length, paused])

  const active = slides[index]
  const heroImage = active?.image || slides[0]?.image || (categories.find((c) => c.image) || {}).image
  const heroEyebrow = active?.subtitle || `The ${settings.site_title || 'Shop'} Edit`
  const [headlineTop, headlineLast] = splitItalic(
    active?.title || settings.site_title || 'Objects for a better everyday'
  )
  const heroSub = settings.site_tagline || 'Quality products at great prices.'
  const heroLink = active?.link || '/search'

  const marqueeItems = features.length
    ? features.map((f) => `${f.title} ${f.text}`)
    : ['Free shipping', 'Easy returns', 'Secure checkout', '24/7 support']
  const marqueeLine = `${marqueeItems.join(' · ')} · `

  const bannerImage = slides[1]?.image || (categories.find((c) => c.image) || {}).image || placeholder('collection')
  const quote = settings.site_tagline || 'Quality products at great prices.'

  return (
    <div className="pb-0">
      <section
        className="relative bg-black text-white overflow-hidden"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {slides.length > 0 ? (
          <div className="relative h-[440px] md:h-[520px]">
            {slides.map((s, i) => {
              const isActive = i === index
              return (
                <div
                  key={s.id}
                  className={`absolute inset-0 transition-opacity duration-700 ${
                    isActive ? 'opacity-100' : 'opacity-0 pointer-events-none'
                  }`}
                >
                  {s.image && (
                    <img src={resolveAssetUrl(s.image)} alt={s.title || ''} className="w-full h-full object-cover " />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-black" />
                </div>
              )
            })}
          </div>
        ) : (
          heroImage && <img src={resolveAssetUrl(heroImage)} alt="" className="absolute inset-0 w-full h-full object-cover " />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-black" />

        <div key={index} className="relative w-full px-4 md:px-8 py-10 md:py-10 ">
          <p className="uppercase tracking-[0.3em] text-xs text-accent font-semibold mb-6">{heroEyebrow}</p>
          <h1 className="text-4xl md:text-6xl font-extrabold leading-[1.05] tracking-tight max-w-4xl">
            {headlineTop}
            {headlineTop && <br />}
            {headlineLast && (
              <span className="italic text-accent">{headlineLast}</span>
            )}
          </h1>
          {heroSub && <p className="mt-6 max-w-xl text-base text-white/70">{heroSub}</p>}
          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              to={heroLink}
              className="bg-white text-black px-8 py-4 rounded-full font-bold hover:bg-accent hover:text-white transition-colors"
            >
              Explore
            </Link>
          </div>
        </div>

        <span className="absolute top-8 right-8 text-white/30 font-black text-3xl hidden md:block">
          {String(index + 1).padStart(2, '0')}
        </span>
        <span className="absolute bottom-6 right-8 text-white/40 text-sm tracking-widest hidden md:block">SCROLL ↓</span>

        {slides.length > 1 && (
          <>
            <button
              onClick={() => setIndex((index - 1 + slides.length) % slides.length)}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white/10 hover:bg-white/25 text-white w-11 h-11 rounded-full flex items-center justify-center text-xl border border-white/30"
              aria-label="Previous slide"
            >
              ‹
            </button>
            <button
              onClick={() => setIndex((index + 1) % slides.length)}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white/10 hover:bg-white/25 text-white w-11 h-11 rounded-full flex items-center justify-center text-xl border border-white/30"
              aria-label="Next slide"
            >
              ›
            </button>
            <div className="absolute bottom-6 left-8 z-20 flex gap-2">
              {slides.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => setIndex(i)}
                  className={`h-1.5 rounded-full transition-all ${i === index ? 'w-8 bg-accent' : 'w-1.5 bg-white/50 hover:bg-white/80'}`}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </section>

      <div className="bg-accent text-black overflow-hidden py-2.5">
        <div className="marquee-track whitespace-nowrap font-bold tracking-wide text-sm">
          {marqueeLine}
          {marqueeLine}
        </div>
      </div>

      {popularProducts.length > 0 && (
        <section className="w-full px-4 md:px-8 py-24">
          <SectionHeader
            index="01"
            label="Best sellers"
            title="The essentials"
            link={{ to: '/search', label: 'View all →' }}
          />
          <ProductRail products={popularProducts} />
        </section>
      )}

      {trendingCategories.length > 0 && (
        <section className="w-full px-4 md:px-8 py-16">
          <SectionHeader index="02" label="Trending" title="What everyone is buying" />
          <CategoryCarousel
            items={trendingCategories.map((c) => ({ ...c, meta: `${c.sold} sold` }))}
          />
        </section>
      )}

      {featuredCategories.length > 0 && (
        <section className="w-full px-4 md:px-8 py-16">
          <SectionHeader index="03" label="Featured" title="Editor's picks" />
          <CategoryCarousel
            items={featuredCategories.map((c) => ({ ...c, meta: `${c.product_count} item${c.product_count === 1 ? '' : 's'}` }))}
          />
        </section>
      )}

      <section className="relative h-[320px] md:h-[420px] overflow-hidden">
        <img src={resolveAssetUrl(bannerImage)} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
        <div className="relative h-full w-full px-4 md:px-8 flex items-center">
          <div className="max-w-2xl">
            <p className="text-sm font-bold tracking-[0.3em] text-accent uppercase mb-4">04 / Featured story</p>
            <h2 className="text-2xl md:text-4xl font-extrabold leading-tight text-white">"{quote}"</h2>
            <Link
              to="/search"
              className="inline-block mt-8 bg-white text-gray-900 px-8 py-3.5 rounded-full font-semibold hover:bg-accent hover:text-white transition-colors"
            >
              Explore the collection
            </Link>
          </div>
        </div>
      </section>

      {categories.length > 0 && (
        <section className="w-full px-4 md:px-8 py-24">
          <div className="mb-14">
            <p className="text-sm font-bold tracking-[0.3em] text-accent uppercase mb-3">05 / Categories</p>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">Browse by mood</h2>
          </div>
          <CategoryCarousel
            items={categories.map((c) => ({ ...c, meta: `${c.product_count} item${c.product_count === 1 ? '' : 's'}` }))}
            itemWidth="w-48 md:w-60"
            round
            cardClass="aspect-[3/4]"
          />
        </section>
      )}

      {features.length > 0 && (
        <section className="bg-black text-white">
          <div className="w-full px-4 md:px-8 py-20">
            <TrustBand features={features} variant="dark" />
          </div>
        </section>
      )}

      <NewsletterStrip variant="solid" eyebrow="06 / Newsletter" />
    </div>
  )
}
