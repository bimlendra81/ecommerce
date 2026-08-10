import { useDispatch, useSelector } from 'react-redux'
import { Link, Outlet, useNavigate } from 'react-router-dom'
import { logout, selectAdminUser } from '../features/adminSlice'

const links = [
  { to: '/admin', label: 'Dashboard' },
  { to: '/admin/products', label: 'Products' },
  { to: '/admin/categories', label: 'Categories' },
  { to: '/admin/brands', label: 'Brands' },
  { to: '/admin/slides', label: 'Slides' },
  { to: '/admin/settings', label: 'Settings' },
  { to: '/admin/orders', label: 'Orders' },
  { to: '/admin/shipping', label: 'Shipping' },
  { to: '/admin/payments', label: 'Payments' },
  { to: '/admin/coupons', label: 'Coupons' },
  { to: '/admin/reviews', label: 'Reviews' },
  { to: '/admin/subscribers', label: 'Subscribers' },
  { to: '/admin/users', label: 'Users' },
]

export default function AdminLayout() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const admin = useSelector(selectAdminUser)

  function handleLogout() {
    dispatch(logout())
    navigate('/admin/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 md:flex">
      <aside className="bg-gray-900 text-white md:w-56 md:min-h-screen">
        <div className="flex md:flex-col items-center md:items-start px-4 py-3 md:p-4 gap-3 md:gap-0">
          <h1 className="text-lg font-bold md:mb-2 whitespace-nowrap">Admin Panel</h1>
          <p className="hidden md:block text-xs text-gray-400 mb-4 truncate w-full">
            Signed in as {admin?.email}
          </p>
          <nav className="flex md:flex-col gap-1 md:gap-1 overflow-x-auto w-full">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="px-3 py-2 text-sm whitespace-nowrap hover:bg-gray-800 hover:text-blue-400 rounded"
              >
                {link.label}
              </Link>
            ))}
            <Link
              to="/"
              className="px-3 py-2 text-sm text-gray-400 hover:text-white whitespace-nowrap rounded"
            >
              ← Back to shop
            </Link>
            <button
              onClick={handleLogout}
              className="px-3 py-2 text-sm text-left text-red-400 hover:text-red-300 hover:bg-gray-800 whitespace-nowrap rounded"
            >
              Sign out
            </button>
          </nav>
        </div>
      </aside>
      <main className="flex-1 p-4 md:p-6 overflow-x-auto">
        <Outlet />
      </main>
    </div>
  )
}
