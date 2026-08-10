import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import client from '../api/client'

export const fetchWishlist = createAsyncThunk('wishlist/fetchWishlist', async (_, { rejectWithValue }) => {
  try {
    const { data } = await client.get('/wishlist')
    return data.items
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to load wishlist')
  }
})

export const addToWishlist = createAsyncThunk('wishlist/addToWishlist', async (productId, { rejectWithValue }) => {
  try {
    const { data } = await client.post(`/wishlist/${productId}`)
    return data.items
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to add to wishlist')
  }
})

export const removeFromWishlist = createAsyncThunk('wishlist/removeFromWishlist', async (productId, { rejectWithValue }) => {
  try {
    const { data } = await client.delete(`/wishlist/${productId}`)
    return data.items
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to remove from wishlist')
  }
})

const initialState = {
  items: [],
  isLoading: false,
  error: null,
}

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState,
  reducers: {
    clearWishlist(state) {
      state.items = []
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWishlist.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchWishlist.fulfilled, (state, action) => {
        state.isLoading = false
        state.items = action.payload
      })
      .addCase(fetchWishlist.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
      .addCase(addToWishlist.fulfilled, (state, action) => {
        state.items = action.payload
        state.error = null
      })
      .addCase(addToWishlist.rejected, (state, action) => {
        state.error = action.payload
      })
      .addCase(removeFromWishlist.fulfilled, (state, action) => {
        state.items = action.payload
        state.error = null
      })
      .addCase(removeFromWishlist.rejected, (state, action) => {
        state.error = action.payload
      })
  },
})

export const { clearWishlist } = wishlistSlice.actions

export const selectWishlistItems = (state) => state.wishlist.items
export const selectWishlistCount = (state) => state.wishlist.items.length
export const selectIsWishlisted = (productId) => (state) =>
  state.wishlist.items.some((item) => item.product_id === productId)
export const selectWishlistLoading = (state) => state.wishlist.isLoading

export default wishlistSlice.reducer
