import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { selectSettings } from '../../features/settingsSlice'
import { resolveAssetUrl } from '../../utils/media'

export default function HeroSlider({ slides }) {
  const settings = useSelector(selectSettings)
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (slides.length < 2 || paused) return
    const timer = setInterval(() => setIndex((i) => (i + 1) % slides.length), 5000)
    return () => clearInterval(timer)
  }, [slides.length, paused])

  if (slides.length === 0) {
    return (
      <section className="relative w-full h-[420px] overflow-hidden bg-gradient-to-r from-primary to-accent">
        <div className="relative z-10 h-full max-w-7xl mx-auto px-4 md:px-8 flex flex-col justify-center text-white">
          <p className="uppercase tracking-[0.25em] text-white/80 text-xs font-bold mb-4">
            Welcome to {settings.site_title || 'the Shop'}
          </p>
          <h1 className="text-[42px] md:text-[52px] leading-[1.05] font-black max-w-2xl [text-shadow:0_2px_20px_rgba(0,0,0,0.4)]">
            {settings.site_tagline || 'Quality products at great prices.'}
          </h1>
          <Link
            to="/search"
            className="self-start mt-8 inline-flex items-center gap-2 bg-white text-primary px-8 py-3.5 rounded-full font-bold hover:bg-accent transition-colors"
          >
            Start shopping
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section
      className="relative w-full h-[420px] overflow-hidden bg-gray-900"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {slides.map((s, i) => {
        const active = i === index
        const image = resolveAssetUrl(s.image)
        const isVideo = image?.includes('.mp4') || image?.includes('.webm')
        return (
          <div
            key={s.id}
            className={`absolute inset-0 transition-opacity duration-700 ${active ? 'opacity-100 z-20' : 'opacity-0 z-10 pointer-events-none'}`}
          >
            {isVideo && active ? (
              <video src={image} className="absolute inset-0 w-full h-full object-cover" autoPlay muted loop playsInline />
            ) : (
              <img src={image} alt={s.title || ''} className="absolute inset-0 w-full h-full object-cover" />
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/20" />
            <div className="absolute inset-0 z-10 max-w-7xl mx-auto px-4 md:px-8 flex flex-col justify-center text-white">
              {s.subtitle ? (
                <p className="uppercase tracking-[0.25em] text-accent text-xs font-bold mb-4">{s.subtitle}</p>
              ) : (
                settings.site_tagline && (
                  <p className="uppercase tracking-[0.25em] text-accent text-xs font-bold mb-4">{settings.site_tagline}</p>
                )
              )}
              {s.title ? (
                <h1 className="text-[42px] md:text-[52px] leading-[1.05] font-black max-w-2xl [text-shadow:0_2px_20px_rgba(0,0,0,0.4)]">
                  {s.title}
                </h1>
              ) : (
                settings.site_title && (
                  <h1 className="text-[42px] md:text-[52px] leading-[1.05] font-black max-w-2xl [text-shadow:0_2px_20px_rgba(0,0,0,0.4)]">
                    {settings.site_title}
                  </h1>
                )
              )}
              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  to={s.link || '/search'}
                  className="inline-flex items-center gap-2 bg-white text-gray-900 px-8 py-3.5 rounded-full font-bold shadow-lg hover:bg-accent transition-colors"
                >
                  Shop now <span aria-hidden>→</span>
                </Link>
                <Link
                  to="/search"
                  className="inline-flex items-center gap-2 border border-white/50 text-white px-8 py-3.5 rounded-full font-semibold hover:bg-white/10 transition-colors"
                >
                  Explore
                </Link>
              </div>
            </div>
          </div>
        )
      })}

      {slides.length > 1 && (
        <>
          <button
            onClick={() => setIndex((index - 1 + slides.length) % slides.length)}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-30 bg-white/85 hover:bg-white text-gray-800 w-11 h-11 rounded-full flex items-center justify-center shadow-lg"
            aria-label="Previous slide"
          >
            ‹
          </button>
          <button
            onClick={() => setIndex((index + 1) % slides.length)}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-30 bg-white/85 hover:bg-white text-gray-800 w-11 h-11 rounded-full flex items-center justify-center shadow-lg"
            aria-label="Next slide"
          >
            ›
          </button>
          <div className="absolute bottom-5 inset-x-0 z-30 flex justify-center gap-2">
            {slides.map((s, i) => (
              <button
                key={s.id}
                onClick={() => setIndex(i)}
                className={`h-2 rounded-full transition-all ${i === index ? 'w-7 bg-white' : 'w-2 bg-white/50 hover:bg-white/80'}`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  )
}
