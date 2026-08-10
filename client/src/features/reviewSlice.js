import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import client from '../api/client'

export const submitReview = createAsyncThunk(
  'reviews/submitReview',
  async ({ slug, rating, title, comment }, { rejectWithValue }) => {
    try {
      const { data } = await client.post(`/products/${slug}/reviews`, { rating, title, comment })
      return data.review
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to submit review')
    }
  }
)

export const updateReview = createAsyncThunk(
  'reviews/updateReview',
  async ({ slug, rating, title, comment }, { rejectWithValue }) => {
    try {
      const { data } = await client.put(`/products/${slug}/reviews`, { rating, title, comment })
      return data.review
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update review')
    }
  }
)

export const deleteReview = createAsyncThunk(
  'reviews/deleteReview',
  async (slug, { rejectWithValue }) => {
    try {
      const { data } = await client.delete(`/products/${slug}/reviews`)
      return data.message
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to delete review')
    }
  }
)

const initialState = {
  isLoading: false,
  error: null,
}

const reviewSlice = createSlice({
  name: 'reviews',
  initialState,
  reducers: {
    clearReviewError(state) {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(submitReview.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(submitReview.fulfilled, (state) => {
        state.isLoading = false
      })
      .addCase(submitReview.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
      .addCase(updateReview.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(updateReview.fulfilled, (state) => {
        state.isLoading = false
      })
      .addCase(updateReview.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
      .addCase(deleteReview.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(deleteReview.fulfilled, (state) => {
        state.isLoading = false
      })
      .addCase(deleteReview.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
  },
})

export const { clearReviewError } = reviewSlice.actions

export const selectReviewLoading = (state) => state.reviews.isLoading
export const selectReviewError = (state) => state.reviews.error

export default reviewSlice.reducer
