import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { selectSettings } from '../features/settingsSlice'

export default function Footer() {
  const settings = useSelector(selectSettings)

  const columns = [
    {
      title: 'Shop',
      links: [
        { label: 'All Products', to: '/search' },
        { label: 'Cart', to: '/cart' },
        { label: 'My Orders', to: '/orders' },
      ],
    },
    {
      title: 'Company',
      links: [
        { label: 'About Us', to: '/about' },
        { label: 'Contact Us', to: '/contact' },
        { label: 'FAQ', to: '/faq' },
      ],
    },
    {
      title: 'Support',
      links: [
        { label: 'Terms & Conditions', to: '/terms' },
        { label: 'Privacy Policy', to: '/privacy' },
      ],
    },
  ]

  const hasSocial = settings.facebook_url || settings.instagram_url

  return (
    <footer className="bg-footer-bg text-footer-text">
      <div className="max-w-6xl mx-auto px-4 py-16 grid md:grid-cols-2 lg:grid-cols-4 gap-10">
        <div>
          <div className="flex items-center gap-2 mb-3">
            {settings.footer_logo || settings.site_logo ? (
              <img src={settings.footer_logo || settings.site_logo} alt={settings.site_title} className="h-8 w-auto object-contain" />
            ) : (
              <span className="text-xl font-extrabold tracking-tight text-footer-text">{settings.site_title || 'SHOP'}</span>
            )}
          </div>
          <p className="text-sm text-footer-text/70 leading-relaxed">
            {settings.site_tagline ||
              'Quality products at great prices. Shop our curated catalog with fast delivery and easy returns.'}
          </p>
          {hasSocial && (
            <div className="flex gap-3 mt-4">
              {settings.facebook_url && (
                <a
                  href={settings.facebook_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-footer-text/10 hover:bg-accent flex items-center justify-center transition-colors"
                  aria-label="Facebook"
                >
                  f
                </a>
              )}
              {settings.instagram_url && (
                <a
                  href={settings.instagram_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-footer-text/10 hover:bg-accent flex items-center justify-center transition-colors"
                  aria-label="Instagram"
                >
                  ◉
                </a>
              )}
            </div>
          )}
        </div>

        {columns.map((col) => (
          <div key={col.title}>
            <h4 className="text-footer-text font-semibold mb-3">{col.title}</h4>
            <ul className="space-y-2 text-sm">
              {col.links.map((link) => (
                <li key={link.label}>
                  <Link to={link.to} className="hover:text-accent">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div>
          <h4 className="text-footer-text font-semibold mb-3">Contact</h4>
          <ul className="space-y-2 text-sm">
            <li>
              <a href={`mailto:${settings.contact_email}`} className="hover:text-accent">
                {settings.contact_email}
              </a>
            </li>
            <li>
              <a href={`tel:${settings.contact_phone}`} className="hover:text-accent">
                {settings.contact_phone}
              </a>
            </li>
            <li className="text-footer-text/70 pt-2">
              🚚 Free shipping on orders over ${settings.free_shipping_threshold}
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-footer-text/15">
        <div className="max-w-6xl mx-auto px-4 py-5 text-sm text-footer-text/60 flex flex-col md:flex-row items-center justify-between gap-2">
          <p>© {new Date().getFullYear()} {settings.site_title || 'Shop'}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
