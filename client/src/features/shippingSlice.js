import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import client from '../api/client'

export const fetchShippingMethods = createAsyncThunk('shipping/fetchMethods', async (_, { rejectWithValue }) => {
  try {
    const { data } = await client.get('/shipping/methods')
    return data
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to load shipping methods')
  }
})

export const fetchAddresses = createAsyncThunk('shipping/fetchAddresses', async (_, { rejectWithValue }) => {
  try {
    const { data } = await client.get('/addresses')
    return data.addresses
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to load addresses')
  }
})

export const createAddress = createAsyncThunk('shipping/createAddress', async (address, { rejectWithValue }) => {
  try {
    const { data } = await client.post('/addresses', address)
    return data.address
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to save address')
  }
})

export const updateAddress = createAsyncThunk('shipping/updateAddress', async ({ id, ...address }, { rejectWithValue }) => {
  try {
    const { data } = await client.put(`/addresses/${id}`, address)
    return data.address
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to update address')
  }
})

export const deleteAddress = createAsyncThunk('shipping/deleteAddress', async (id, { rejectWithValue }) => {
  try {
    await client.delete(`/addresses/${id}`)
    return id
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to delete address')
  }
})

export const fetchQuote = createAsyncThunk('shipping/fetchQuote', async (payload, { rejectWithValue }) => {
  try {
    const { data } = await client.post('/shipping/quote', payload)
    return data
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to get shipping quote')
  }
})

const initialState = {
  methods: [],
  provider: 'manual',
  addresses: [],
  quote: null,
  methodsLoading: false,
  addressesLoading: false,
  quoteLoading: false,
  error: null,
}

const shippingSlice = createSlice({
  name: 'shipping',
  initialState,
  reducers: {
    clearQuote(state) {
      state.quote = null
    },
    clearShippingError(state) {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchShippingMethods.fulfilled, (state, action) => {
        state.methods = action.payload.methods
        state.provider = action.payload.provider
        state.methodsLoading = false
      })
      .addCase(fetchShippingMethods.pending, (state) => {
        state.methodsLoading = true
      })
      .addCase(fetchShippingMethods.rejected, (state, action) => {
        state.methodsLoading = false
        state.error = action.payload
      })
      .addCase(fetchAddresses.fulfilled, (state, action) => {
        state.addresses = action.payload
        state.addressesLoading = false
      })
      .addCase(fetchAddresses.pending, (state) => {
        state.addressesLoading = true
      })
      .addCase(fetchAddresses.rejected, (state, action) => {
        state.addressesLoading = false
        state.error = action.payload
      })
      .addCase(createAddress.fulfilled, (state, action) => {
        state.addresses = [action.payload, ...state.addresses.filter((a) => !(a.is_default && action.payload.is_default))]
        state.error = null
      })
      .addCase(createAddress.rejected, (state, action) => {
        state.error = action.payload
      })
      .addCase(updateAddress.fulfilled, (state, action) => {
        state.addresses = state.addresses
          .map((a) => (a.id === action.payload.id ? action.payload : { ...a, is_default: a.is_default && !action.payload.is_default ? 0 : a.is_default }))
        state.error = null
      })
      .addCase(updateAddress.rejected, (state, action) => {
        state.error = action.payload
      })
      .addCase(deleteAddress.fulfilled, (state, action) => {
        state.addresses = state.addresses.filter((a) => a.id !== action.payload)
        state.error = null
      })
      .addCase(deleteAddress.rejected, (state, action) => {
        state.error = action.payload
      })
      .addCase(fetchQuote.pending, (state) => {
        state.quoteLoading = true
      })
      .addCase(fetchQuote.fulfilled, (state, action) => {
        state.quoteLoading = false
        state.quote = action.payload
        state.error = null
      })
      .addCase(fetchQuote.rejected, (state, action) => {
        state.quoteLoading = false
        state.error = action.payload
      })
  },
})

export const { clearQuote, clearShippingError } = shippingSlice.actions

export const selectShippingMethods = (state) => state.shipping.methods
export const selectShippingProvider = (state) => state.shipping.provider
export const selectAddresses = (state) => state.shipping.addresses
export const selectQuote = (state) => state.shipping.quote
export const selectQuoteLoading = (state) => state.shipping.quoteLoading
export const selectAddressesLoading = (state) => state.shipping.addressesLoading

export default shippingSlice.reducer
