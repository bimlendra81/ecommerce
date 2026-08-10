import { useState } from 'react'
import { resolveAssetUrl, resolveMediaItem } from '../utils/media'

function isVideoType(url) {
  return /\.(mp4|webm|ogg|mov)(\?|$)/i.test(url)
}

export default function MediaSlider({
  media = [],
  fallback,
  aspectClass = 'aspect-square',
  containerClass = '',
  showThumbs = false,
  videoControls = false,
  showBadge = false,
  preferVideo = false,
  objectFit = 'contain',
  zoom = false,
}) {
  const items = (media || []).map((m) => resolveMediaItem({ type: m.type, url: m.url }))
  const gallery =
    items.length > 0
      ? items
      : [{ type: 'image', url: resolveAssetUrl(fallback) || 'https://placehold.co/600x600?text=No+Image' }]

  const firstVideoIndex = preferVideo ? gallery.findIndex((i) => i.type === 'video' || isVideoType(i.url)) : -1
  const [index, setIndex] = useState(firstVideoIndex > 0 ? firstVideoIndex : 0)
  const [zoomActive, setZoomActive] = useState(false)
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 })

  const current = gallery[Math.min(index, gallery.length - 1)]
  const isVideo = current.type === 'video' || isVideoType(current.url)
  const canZoom = zoom && !isVideo

  function handleZoomMove(e) {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setZoomPos({ x, y })
  }

  function prev(e) {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    setIndex((i) => (i - 1 + gallery.length) % gallery.length)
  }

  function next(e) {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    setIndex((i) => (i + 1) % gallery.length)
  }

  return (
    <div className={`relative ${containerClass}`}>
      <div
        className={`bg-gray-100 rounded-xl overflow-hidden flex items-center justify-center ${aspectClass} ${
          canZoom ? 'cursor-zoom-in' : ''
        }`}
        onMouseEnter={canZoom ? () => setZoomActive(true) : undefined}
        onMouseMove={canZoom ? handleZoomMove : undefined}
        onMouseLeave={canZoom ? () => setZoomActive(false) : undefined}
      >
        {isVideo ? (
          <video
            key={current.url}
            src={current.url}
            className={`w-full h-full ${objectFit === 'cover' ? 'object-cover' : 'object-contain'}`}
            autoPlay
            muted
            loop
            playsInline
            controls={videoControls}
          />
        ) : (
          <img
            key={current.url}
            src={current.url}
            alt=""
            loading="lazy"
            className={`w-full h-full ${objectFit === 'cover' ? 'object-cover' : 'object-contain'}`}
            onError={(e) => {
              e.currentTarget.src = 'https://placehold.co/600x600?text=No+Image'
            }}
          />
        )}
        {showBadge && isVideo && (
          <span className="absolute top-2 left-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full">
            ▶ Video
          </span>
        )}
        {zoomActive && canZoom && (
          <>
            <div
              className="absolute pointer-events-none z-10 border-2 border-gray-400 bg-white/20"
              style={{
                width: '50%',
                height: '50%',
                left: `${Math.max(0, Math.min(50, zoomPos.x - 25))}%`,
                top: `${Math.max(0, Math.min(50, zoomPos.y - 25))}%`,
              }}
            />
            <div className="absolute left-full top-0 ml-4 z-20 hidden lg:block w-[440px] h-[440px] max-w-[calc(100vw-2rem)] rounded-lg overflow-hidden border border-gray-200 bg-white shadow-2xl pointer-events-none">
              <img
                src={current.url}
                alt=""
                className="w-full h-full object-contain"
                style={{
                  transform: 'scale(2)',
                  transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                }}
                onError={(e) => {
                  e.currentTarget.src = 'https://placehold.co/600x600?text=No+Image'
                }}
              />
            </div>
          </>
        )}
      </div>

      {gallery.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-1 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-700 w-7 h-7 rounded-full flex items-center justify-center text-sm shadow"
            aria-label="Previous media"
          >
            ‹
          </button>
          <button
            onClick={next}
            className="absolute right-1 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-700 w-7 h-7 rounded-full flex items-center justify-center text-sm shadow"
            aria-label="Next media"
          >
            ›
          </button>
          <div className="absolute bottom-1.5 inset-x-0 flex justify-center gap-1">
            {gallery.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full ${i === index ? 'w-3 bg-primary' : 'w-1.5 bg-gray-400'}`}
              />
            ))}
          </div>
        </>
      )}

      {showThumbs && gallery.length > 1 && (
        <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1">
          {gallery.map((item, i) => {
            const isV = item.type === 'video' || isVideoType(item.url)
            return (
              <button
                key={`${item.url}-${i}`}
                onClick={() => setIndex(i)}
                className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 ${
                  i === index ? 'border-primary' : 'border-transparent hover:border-gray-300'
                }`}
              >
                {isV ? (
                  <span className="flex items-center justify-center w-full h-full bg-gray-200 text-gray-500 text-sm">
                    ▶
                  </span>
                ) : (
                  <img
                    src={item.url}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = 'https://placehold.co/80x80?text=X'
                    }}
                  />
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

