import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import client from '../api/client'

export const fetchSettings = createAsyncThunk('settings/fetchSettings', async (_, { rejectWithValue }) => {
  try {
    const { data } = await client.get('/settings')
    return data.settings
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to load settings')
  }
})

const initialState = {
  settings: {
    site_title: 'Shop',
    site_logo: '',
    site_favicon: '',
    site_tagline: 'Quality products at great prices. Shop our curated catalog with fast delivery and easy returns.',
    footer_logo: '',
    home_features: JSON.stringify([
      { icon: '🚚', title: 'Free Shipping', text: 'On orders over {threshold}' },
      { icon: '🔒', title: 'Secure Payment', text: '100% protected checkout' },
      { icon: '🎧', title: '24/7 Support', text: 'We are here to help' },
    ]),
    theme: JSON.stringify({ selected: 'ocean', primary: '', accent: '' }),
    home_template: 'marketplace',
    facebook_url: '',
    instagram_url: '',
    free_shipping_threshold: '50',
    return_days: '30',
    contact_email: 'support@example.com',
    contact_phone: '+1 800 000 0000',
  },
  isLoading: false,
  isLoaded: false,
}

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSettings.pending, (state) => {
        state.isLoading = true
      })
      .addCase(fetchSettings.fulfilled, (state, action) => {
        state.isLoading = false
        state.isLoaded = true
        state.settings = { ...state.settings, ...action.payload }
      })
      .addCase(fetchSettings.rejected, (state) => {
        state.isLoading = false
        state.isLoaded = true
      })
  },
})

export const selectSettings = (state) => state.settings.settings
export const selectSettingsLoading = (state) => state.settings.isLoading
export const selectSettingsLoaded = (state) => state.settings.isLoaded
export const selectHomeFeatures = (state) => {
  try {
    const parsed = JSON.parse(state.settings.settings.home_features || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export default settingsSlice.reducer
