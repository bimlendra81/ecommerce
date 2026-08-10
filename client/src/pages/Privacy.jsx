import { useSelector } from 'react-redux'
import { selectSettings } from '../features/settingsSlice'

export default function Privacy() {
  const settings = useSelector(selectSettings)

  return (
    <section className="max-w-3xl mx-auto px-4 py-14">
      <h1 className="text-4xl font-bold mb-6">Privacy Policy</h1>
      <div className="space-y-6 text-gray-700 leading-relaxed">
        <div>
          <h2 className="text-xl font-semibold mb-2">1. Information we collect</h2>
          <p>
            We collect information you provide when creating an account, placing an order, or
            contacting us — such as your name, email, phone number and shipping address.
          </p>
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-2">2. How we use it</h2>
          <p>
            Your information is used to process orders, manage your account, provide support, and
            improve our store. We never sell your personal data to third parties.
          </p>
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-2">3. Payment security</h2>
          <p>
            Payment transactions are handled by our secure payment gateway. Card details are encrypted
            and never stored on our servers.
          </p>
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-2">4. Cookies</h2>
          <p>
            We use cookies to keep you logged in and remember your cart. You can disable cookies in
            your browser, though some features may not work correctly.
          </p>
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-2">5. Your rights</h2>
          <p>
            You may request a copy, correction, or deletion of your personal data at any time by
            contacting us at {settings.contact_email || 'support@example.com'}.
          </p>
        </div>
      </div>
    </section>
  )
}
