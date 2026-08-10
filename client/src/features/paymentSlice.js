import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import client from '../api/client'

export const fetchPaymentConfig = createAsyncThunk('payment/fetchConfig', async (_, { rejectWithValue }) => {
  try {
    const { data } = await client.get('/payment/config')
    return data.config
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to load payment config')
  }
})

const initialState = {
  config: {
    gateway: 'test',
    currency: 'INR',
    configured: false,
    key_id: null,
    publishable_key: null,
  },
  status: 'idle',
  error: null,
}

const paymentSlice = createSlice({
  name: 'payment',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPaymentConfig.pending, (state) => {
        state.status = 'loading'
      })
      .addCase(fetchPaymentConfig.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.config = action.payload
        state.error = null
      })
      .addCase(fetchPaymentConfig.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
      })
  },
})

export const selectPaymentConfig = (state) => state.payment.config
export const selectPaymentConfigStatus = (state) => state.payment.status

export default paymentSlice.reducer
