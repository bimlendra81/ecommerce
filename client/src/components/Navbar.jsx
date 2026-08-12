import { useState, useRef, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, Outlet, useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { logout, selectIsAuthenticated, selectUser } from '../features/authSlice'
import { selectCartCount } from '../features/cartSlice'
import { selectWishlistCount } from '../features/wishlistSlice'
import { selectSettings } from '../features/settingsSlice'
import { useGetCategoriesQuery } from '../api/storefrontApi'
import CartPopup from './CartPopup'

function CartIcon() {
  return (
    <svg
      className="h-6 w-6"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  )
}

function HeartIcon() {
  return (
    <svg
      className="h-6 w-6"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  )
}

export default function Navbar() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const isAuth = useSelector(selectIsAuthenticated)
  const user = useSelector(selectUser)
  const cartCount = useSelector(selectCartCount)
  const wishlistCount = useSelector(selectWishlistCount)
  const settings = useSelector(selectSettings)
  const { data } = useGetCategoriesQuery()
  const categories = data?.categories || []
  const [menuOpen, setMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchCategory, setSearchCategory] = useState('')
  const userMenuRef = useRef(null)

  const urlCategory = searchParams.get('category')

  useEffect(() => {
    if (location.pathname === '/search') {
      setSearchCategory(urlCategory || '')
    }
  }, [urlCategory, location.pathname])

  function handleCategorySelect(value) {
    setSearchCategory(value)
    if (location.pathname === '/search') {
      const p = new URLSearchParams(searchParams)
      if (value) {
        p.set('category', value)
      } else {
        p.delete('category')
      }
      setSearchParams(p, { replace: true })
    }
  }

  useEffect(() => {
    function handleClickOutside(e) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleLogout() {
    dispatch(logout())
    setMenuOpen(false)
    setUserMenuOpen(false)
    navigate('/')
  }

  function submitSearch(e) {
    e.preventDefault()
    const term = searchTerm.trim()
    setSearchTerm('')
    setMenuOpen(false)
    const params = new URLSearchParams()
    if (term) params.set('search', term)
    if (searchCategory) params.set('category', searchCategory)
    navigate(params.toString() ? `/search?${params.toString()}` : '/search')
  }

  const selectedCategoryName = searchCategory
    ? categories.find((c) => c.slug === searchCategory)?.name
    : ''

  const avatarText = user?.name?.charAt(0).toUpperCase() || '?'

  return (
    <>
      <header className="sticky top-0 z-10 bg-header-bg text-header-text border-b border-primary-light">
        <nav className="w-full px-4 md:px-8 lg:px-10 py-3 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            {settings.site_logo ? (
              <img
                src={settings.site_logo}
                alt={settings.site_title}
                className="h-8 w-auto object-contain"
              />
            ) : (
              <span className="text-xl font-extrabold tracking-tight">{settings.site_title || 'SHOP'}</span>
            )}
          </Link>

          <form noValidate
            onSubmit={submitSearch}
            className="hidden md:flex flex-1 max-w-xl items-stretch"
            role="search"
          >
            <select
              value={searchCategory}
              onChange={(e) => handleCategorySelect(e.target.value)}
              className="rounded-l-xl bg-primary-soft border-r border-primary-light px-2 py-2 text-sm text-gray-700 focus:outline-none"
              aria-label="Search category"
            >
              <option value="">All</option>
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={selectedCategoryName ? `Search ${selectedCategoryName}` : 'Search products...'}
              className="w-full bg-white border-y border-primary-light px-4 py-2 text-gray-800 placeholder-gray-400 focus:outline-none"
            />
            <button
              type="submit"
              className="rounded-r-xl bg-accent text-white px-5 hover:bg-accent-dark transition-colors"
              aria-label="Search"
            >
              <SearchIcon />
            </button>
          </form>

          <div className="hidden md:flex items-center gap-6">
            {isAuth && (
              <Link to="/wishlist" className="relative hover:text-accent" aria-label="Wishlist">
                <HeartIcon />
                {wishlistCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-accent text-white text-xs font-bold rounded-full h-5 min-w-5 px-1 flex items-center justify-center">
                    {wishlistCount}
                  </span>
                )}
              </Link>
            )}
            <Link to="/cart" className="relative hover:text-accent" aria-label="Cart">
              <CartIcon />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-accent text-white text-xs font-bold rounded-full h-5 min-w-5 px-1 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>
            {isAuth ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen((o) => !o)}
                  className="flex items-center gap-2 rounded-full"
                  aria-label="Account menu"
                >
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="h-9 w-9 rounded-full object-cover border border-primary-light"
                    />
                  ) : (
                    <span className="h-9 w-9 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm">
                      {avatarText}
                    </span>
                  )}
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-primary-light py-1 text-gray-800">
                    <div className="px-4 py-2 border-b border-primary-light">
                      <p className="text-sm font-semibold truncate">{user?.name}</p>
                      <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                    </div>
                    <Link
                      to="/profile"
                      onClick={() => setUserMenuOpen(false)}
                      className="block px-4 py-2 text-sm hover:bg-primary-soft"
                    >
                      My Profile
                    </Link>
                    <Link
                      to="/orders"
                      onClick={() => setUserMenuOpen(false)}
                      className="block px-4 py-2 text-sm hover:bg-primary-soft"
                    >
                      Orders
                    </Link>
                    <Link
                      to="/account/addresses"
                      onClick={() => setUserMenuOpen(false)}
                      className="block px-4 py-2 text-sm hover:bg-primary-soft"
                    >
                      Addresses
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-primary-soft"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="bg-primary text-white px-5 py-2 rounded-full hover:bg-primary-dark font-medium transition-colors"
              >
                Login
              </Link>
            )}
          </div>

          <div className="md:hidden flex items-center gap-3">
            {isAuth && (
              <Link to="/wishlist" className="relative" aria-label="Wishlist">
                <HeartIcon />
                {wishlistCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-accent text-white text-xs font-bold rounded-full h-5 min-w-5 px-1 flex items-center justify-center">
                    {wishlistCount}
                  </span>
                )}
              </Link>
            )}
            <Link to="/cart" className="relative" aria-label="Cart">
              <CartIcon />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-accent text-white text-xs font-bold rounded-full h-5 min-w-5 px-1 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="text-2xl leading-none px-2"
              aria-label="Toggle menu"
            >
              {menuOpen ? '✕' : '☰'}
            </button>
          </div>
        </nav>

        {menuOpen && (
          <div className="md:hidden bg-white border-t border-primary-light px-4 py-3 flex flex-col gap-3 text-base text-gray-800">
            <form noValidate onSubmit={submitSearch} className="flex items-stretch" role="search">
              <select
                value={searchCategory}
                onChange={(e) => handleCategorySelect(e.target.value)}
                className="rounded-l-md border border-r-0 border-primary-light bg-primary-soft px-2 py-2 text-sm text-gray-700 focus:outline-none"
                aria-label="Search category"
              >
                <option value="">All</option>
                {categories.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
              <input
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={selectedCategoryName ? `Search ${selectedCategoryName}` : 'Search products...'}
                className="w-full bg-white border border-primary-light px-3 py-2 text-gray-800 focus:outline-none"
              />
              <button
                type="submit"
                className="rounded-r-md border border-l-0 border-primary-light bg-accent px-3 text-white"
                aria-label="Search"
              >
                <SearchIcon />
              </button>
            </form>
            <Link to="/search" onClick={() => setMenuOpen(false)}>Search</Link>
            {isAuth ? (
              <>
                <div className="flex items-center gap-3">
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="h-8 w-8 rounded-full object-cover border border-primary-light"
                    />
                  ) : (
                    <span className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm">
                      {avatarText}
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{user?.name}</p>
                    <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                  </div>
                </div>
               <Link to="/profile" onClick={() => setMenuOpen(false)}>My Profile</Link>
               <Link to="/orders" onClick={() => setMenuOpen(false)}>Orders</Link>
               <Link to="/account/addresses" onClick={() => setMenuOpen(false)}>Addresses</Link>
                <button onClick={handleLogout} className="text-left text-red-600">
                  Logout
                </button>
              </>
            ) : (
              <Link
                to="/login"
                onClick={() => setMenuOpen(false)}
                className="bg-primary text-white px-4 py-2 rounded-full text-center font-medium"
              >
                Login
              </Link>
            )}
          </div>
        )}
      </header>
      <main className="min-h-screen">
        <Outlet />
      </main>
      <CartPopup />
    </>
  )
}
