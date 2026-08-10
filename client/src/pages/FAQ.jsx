import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { selectSettings } from '../features/settingsSlice'

export default function FAQ() {
  const settings = useSelector(selectSettings)

  const items = [
    {
      q: 'How long does shipping take?',
      a: 'Orders are usually processed within 1-2 business days. Standard delivery typically arrives in 3-7 business days depending on your location.',
    },
    {
      q: 'When do I get free shipping?',
      a: `Orders over $${settings.free_shipping_threshold} ship for free. Orders below that amount are charged a small flat shipping fee at checkout.`,
    },
    {
      q: 'How do returns work?',
      a: `Most products can be returned within ${settings.return_days} days of delivery. Some items may have a different return window — check the product page for the exact policy. Items must be unused and in original packaging.`,
    },
    {
      q: 'How do I track my order?',
      a: 'After your order ships, you will receive a confirmation email with tracking information. You can also view order status anytime in the My Orders page.',
    },
    {
      q: 'What payment methods do you accept?',
      a: 'We accept major credit/debit cards and UPI through our secure payment gateway.',
    },
    {
      q: 'Can I change or cancel my order?',
      a: 'Orders can be cancelled before they are shipped. Contact support as soon as possible and we will help you.',
    },
  ]

  return (
    <section className="max-w-3xl mx-auto px-4 py-14">
      <h1 className="text-4xl font-bold mb-2">Frequently Asked Questions</h1>
      <p className="text-gray-600 mb-8">
        Everything you need to know. Still have questions?{' '}
        <Link to="/contact" className="text-primary hover:underline">
          Contact us
        </Link>
        .
      </p>

      <div className="space-y-4">
        {items.map((item) => (
          <details
            key={item.q}
            className="group bg-white border rounded-lg shadow-sm p-5 cursor-pointer"
          >
            <summary className="flex items-center justify-between font-semibold text-gray-800 list-none">
              <span>{item.q}</span>
              <span className="text-gray-400 group-open:rotate-45 transition-transform text-xl">+</span>
            </summary>
            <p className="mt-3 text-gray-600 leading-relaxed">{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  )
}
