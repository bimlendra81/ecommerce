import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import client from '../api/client'

export const fetchCart = createAsyncThunk('cart/fetchCart', async (_, { rejectWithValue }) => {
  try {
    const { data } = await client.get('/cart')
    return data.items
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to load cart')
  }
})

export const addToCart = createAsyncThunk('cart/addToCart', async (payload, { rejectWithValue }) => {
  try {
    const { data } = await client.post('/cart', payload)
    return data.items
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to add to cart')
  }
})

export const updateCartItem = createAsyncThunk(
  'cart/updateCartItem',
  async ({ product_id, quantity }, { rejectWithValue }) => {
    try {
      const { data } = await client.patch(`/cart/${product_id}`, { quantity })
      return data.items
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update cart')
    }
  }
)

export const removeFromCart = createAsyncThunk('cart/removeFromCart', async (product_id, { rejectWithValue }) => {
  try {
    const { data } = await client.delete(`/cart/${product_id}`)
    return data.items
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to remove item')
  }
})

const initialState = {
  items: [],
  isLoading: false,
  error: null,
  toast: null,
}

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    setCart(state, action) {
      state.items = action.payload
    },
    clearCart(state) {
      state.items = []
    },
    openCartToast(state, action) {
      state.toast = action.payload
    },
    closeCartToast(state) {
      state.toast = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCart.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.isLoading = false
        state.items = action.payload
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
      .addCase(addToCart.fulfilled, (state, action) => {
        state.isLoading = false
        state.error = null
        state.items = action.payload
      })
      .addCase(addToCart.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
      .addCase(updateCartItem.fulfilled, (state, action) => {
        state.isLoading = false
        state.error = null
        state.items = action.payload
      })
      .addCase(updateCartItem.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
      .addCase(removeFromCart.fulfilled, (state, action) => {
        state.isLoading = false
        state.error = null
        state.items = action.payload
      })
      .addCase(removeFromCart.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
  },
})

export const { setCart, clearCart, openCartToast, closeCartToast } = cartSlice.actions

export const selectCartItems = (state) => state.cart.items
export const selectCartCount = (state) => state.cart.items.reduce((sum, i) => sum + i.quantity, 0)
export const selectCartTotal = (state) =>
  state.cart.items.reduce((sum, i) => sum + Number(i.price) * i.quantity, 0)
export const selectCartLoading = (state) => state.cart.isLoading
export const selectCartToast = (state) => state.cart.toast

export default cartSlice.reducer
