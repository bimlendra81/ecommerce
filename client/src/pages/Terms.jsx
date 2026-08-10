import { useSelector } from 'react-redux'
import { selectSettings } from '../features/settingsSlice'

export default function Terms() {
  const settings = useSelector(selectSettings)

  return (
    <section className="max-w-3xl mx-auto px-4 py-14">
      <h1 className="text-4xl font-bold mb-6">Terms & Conditions</h1>
      <div className="space-y-6 text-gray-700 leading-relaxed">
        <div>
          <h2 className="text-xl font-semibold mb-2">1. General</h2>
          <p>
            These terms govern your use of {settings.site_title || 'Shop'}. By placing an order you
            agree to these terms. We may update them from time to time.
          </p>
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-2">2. Orders & Pricing</h2>
          <p>
            All prices are listed in dollars and include applicable taxes unless stated otherwise. We
            reserve the right to refuse or cancel any order, including orders with suspected fraud or
            pricing errors.
          </p>
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-2">3. Payment</h2>
          <p>
            Payment is collected securely at checkout. Your card or UPI details are handled by our
            payment gateway and never stored by us.
          </p>
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-2">4. Shipping</h2>
          <p>
            Orders ship to the address you provide. We are not responsible for delays caused by the
            courier. Free shipping applies to orders over ${settings.free_shipping_threshold}.
          </p>
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-2">5. Returns</h2>
          <p>
            Items may be returned within the window shown on each product page (usually
            {settings.return_days} days from delivery). Products must be unused and in original
            packaging to qualify for a refund.
          </p>
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-2">6. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by law, {settings.site_title || 'Shop'} is not liable for
            indirect, incidental or consequential damages arising from your use of the site or
            products.
          </p>
        </div>
      </div>
    </section>
  )
}
