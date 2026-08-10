import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { selectSettings } from '../features/settingsSlice'

export default function About() {
  const settings = useSelector(selectSettings)

  return (
    <section className="max-w-3xl mx-auto px-4 py-14">
      <h1 className="text-4xl font-bold mb-4">About Us</h1>
      <p className="text-gray-600 mb-8">
        Welcome to {settings.site_title || 'Shop'} — your destination for quality products at great prices.
      </p>

      <div className="space-y-6 text-gray-700 leading-relaxed">
        <div>
          <h2 className="text-xl font-semibold mb-2">Who we are</h2>
          <p>
            We are an online store focused on a curated catalog of products across electronics, fashion,
            books and home essentials. Every item is chosen to deliver the best value for our customers.
          </p>
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-2">What we offer</h2>
          <p>
            Fast and secure checkout, free shipping on orders over ${settings.free_shipping_threshold},
            a {settings.return_days}-day easy return policy, and 24/7 customer support.
          </p>
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-2">Our promise</h2>
          <p>
            Simple browsing, transparent pricing and a hassle-free shopping experience. If you have any
            questions, our team is always happy to help.
          </p>
        </div>
      </div>

      <Link to="/search" className="inline-block mt-8 bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-dark">
        Start shopping
      </Link>
    </section>
  )
}
