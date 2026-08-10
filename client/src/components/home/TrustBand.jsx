export default function TrustBand({ features, variant = 'cards' }) {
  if (!features || features.length === 0) return null

  if (variant === 'center') {
    return (
      <div className="grid sm:grid-cols-3 gap-10 text-center">
        {features.map((f, i) => (
          <div key={`${f.title}-${i}`}>
            <span className="text-3xl">{f.icon}</span>
            <p className="font-semibold mt-3">{f.title}</p>
            <p className="text-sm text-gray-500 mt-1">{f.text}</p>
          </div>
        ))}
      </div>
    )
  }

  if (variant === 'dark') {
    return (
      <div className="grid md:grid-cols-3 gap-10 text-center">
        {features.map((f, i) => (
          <div key={`${f.title}-${i}`} className={i === 1 ? 'md:border-x md:border-white/10' : ''}>
            <span className="text-3xl">{f.icon}</span>
            <p className="font-bold text-lg mt-3">{f.title}</p>
            <p className="text-white/60 text-sm mt-1">{f.text}</p>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-14">
      {features.map((f, i) => (
        <div
          key={`${f.title}-${i}`}
          className="flex items-center gap-4 bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="w-12 h-12 rounded-full bg-primary-soft text-primary flex items-center justify-center text-2xl shrink-0">
            {f.icon}
          </div>
          <div>
            <p className="font-semibold">{f.title}</p>
            <p className="text-sm text-gray-500 mt-0.5">{f.text}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
