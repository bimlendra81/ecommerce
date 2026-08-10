import { configureStore } from '@reduxjs/toolkit'
import authReducer from './features/authSlice'
import adminReducer from './features/adminSlice'
import cartReducer from './features/cartSlice'
import settingsReducer from './features/settingsSlice'
import wishlistReducer from './features/wishlistSlice'
import reviewReducer from './features/reviewSlice'
import shippingReducer from './features/shippingSlice'
import paymentReducer from './features/paymentSlice'
import { storefrontApi } from './api/storefrontApi'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    admin: adminReducer,
    cart: cartReducer,
    settings: settingsReducer,
    wishlist: wishlistReducer,
    reviews: reviewReducer,
    shipping: shippingReducer,
    payment: paymentReducer,
    [storefrontApi.reducerPath]: storefrontApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(storefrontApi.middleware),
})
