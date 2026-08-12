import { useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { checkAuth, selectIsAuthenticated, selectIsBooting } from './features/authSlice'
import { checkAdmin, selectAdminAuthenticated, selectAdminBooting } from './features/adminSlice'
import { fetchCart, clearCart } from './features/cartSlice'
import { fetchWishlist, clearWishlist } from './features/wishlistSlice'
import { fetchSettings, selectSettings, selectSettingsLoaded } from './features/settingsSlice'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import FloatingCart from './components/FloatingCart'
import Home from './pages/Home'
import Shop from './pages/Shop'
import ProductDetail from './pages/ProductDetail'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import Orders from './pages/Orders'
import OrderDetail from './pages/OrderDetail'
import About from './pages/About'
import Contact from './pages/Contact'
import FAQ from './pages/FAQ'
import Terms from './pages/Terms'
import Privacy from './pages/Privacy'
import AdminLayout from './admin/AdminLayout'
import AdminLogin from './admin/AdminLogin'
import AdminDashboard from './admin/AdminDashboard'
import AdminProducts from './admin/AdminProducts'
import AdminProductForm from './admin/AdminProductForm'
import AdminCategories from './admin/AdminCategories'
import AdminBrands from './admin/AdminBrands'
import AdminSlides from './admin/AdminSlides'
import AdminSettings from './admin/AdminSettings'
import AdminOrders from './admin/AdminOrders'
import AdminUsers from './admin/AdminUsers'
import AdminShipping from './admin/AdminShipping'
import AdminPayments from './admin/AdminPayments'
import AdminCoupons from './admin/AdminCoupons'
import AdminSubscribers from './admin/AdminSubscribers'
import AdminReviews from './admin/AdminReviews'
import Profile from './pages/Profile'
import Wishlist from './pages/Wishlist'
import Addresses from './pages/Addresses'
import { applyTheme } from './theme/themes'
import PageLoader from './components/PageLoader'

function RequireAdmin({ children }) {
  const isAdmin = useSelector(selectAdminAuthenticated)
  if (!isAdmin) {
    return <Navigate to="/admin/login" replace />
  }
  return children
}

function RequireAuth({ children }) {
  const isAuth = useSelector(selectIsAuthenticated)
  if (!isAuth) {
    return <Navigate to="/login" replace />
  }
  return children
}

export default function App() {
  const dispatch = useDispatch()
  const location = useLocation()
  const isBooting = useSelector(selectIsBooting)
  const isAdminBooting = useSelector(selectAdminBooting)
  const isAuth = useSelector(selectIsAuthenticated)
  const settings = useSelector(selectSettings)
  const settingsLoaded = useSelector(selectSettingsLoaded)

  useEffect(() => {
    dispatch(checkAuth())
    dispatch(checkAdmin())
  }, [dispatch])

  useEffect(() => {
    dispatch(fetchSettings())
  }, [dispatch])

  useEffect(() => {
    if (settings?.site_title) {
      document.title = settings.site_title
    }
    if (settings?.site_favicon) {
      let link = document.querySelector("link[rel*='icon']")
      if (!link) {
        link = document.createElement('link')
        link.rel = 'icon'
        document.head.appendChild(link)
      }
      link.href = settings.site_favicon
    }
    applyTheme(settings?.theme)
  }, [settings])

  useEffect(() => {
    if (isAuth) {
      dispatch(fetchCart())
      dispatch(fetchWishlist())
    } else {
      dispatch(clearCart())
      dispatch(clearWishlist())
    }
  }, [dispatch, isAuth])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  if (isBooting || isAdminBooting || !settingsLoaded) {
    return <PageLoader />
  }

  return (
    <>
      <Routes>
        <Route element={<Navbar />}>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<Shop />} />
          <Route path="/shop" element={<Navigate to="/search" replace />} />
          <Route path="/product/:slug" element={<ProductDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route
            path="/cart"
            element={
              <RequireAuth>
                <Cart />
              </RequireAuth>
            }
          />
          <Route
            path="/wishlist"
            element={
              <RequireAuth>
                <Wishlist />
              </RequireAuth>
            }
          />
          <Route
            path="/checkout"
            element={
              <RequireAuth>
                <Checkout />
              </RequireAuth>
            }
          />
          <Route
            path="/orders"
            element={
              <RequireAuth>
                <Orders />
              </RequireAuth>
            }
          />
          <Route
            path="/orders/:id"
            element={
              <RequireAuth>
                <OrderDetail />
              </RequireAuth>
            }
          />
          <Route
            path="/profile"
            element={
              <RequireAuth>
                <Profile />
              </RequireAuth>
            }
          />
          <Route
            path="/account/addresses"
            element={
              <RequireAuth>
                <Addresses />
              </RequireAuth>
            }
          />
        </Route>
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin"
          element={
            <RequireAdmin>
              <AdminLayout />
            </RequireAdmin>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="products/new" element={<AdminProductForm />} />
          <Route path="products/:id/edit" element={<AdminProductForm />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="brands" element={<AdminBrands />} />
          <Route path="slides" element={<AdminSlides />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="shipping" element={<AdminShipping />} />
          <Route path="payments" element={<AdminPayments />} />
          <Route path="coupons" element={<AdminCoupons />} />
          <Route path="subscribers" element={<AdminSubscribers />} />
          <Route path="reviews" element={<AdminReviews />} />
          <Route path="users" element={<AdminUsers />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {!location.pathname.startsWith('/admin') && (
        <>
          <Footer />
          <FloatingCart />
        </>
      )}
    </>
  )
}
