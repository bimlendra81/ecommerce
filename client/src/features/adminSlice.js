import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import adminClient from '../api/adminClient'

export const checkAdmin = createAsyncThunk('admin/checkAdmin', async (_, { rejectWithValue }) => {
  const token = localStorage.getItem('admin_token')
  if (!token) return null
  try {
    const { data } = await adminClient.get('/admin/stats')
    return data.stats
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Session expired')
  }
})

const token = localStorage.getItem('admin_token')
const user = JSON.parse(localStorage.getItem('admin_user') || 'null')

const initialState = {
  user,
  token,
  isLoading: false,
  isBooting: Boolean(token),
  error: null,
}

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    loginStart(state) {
      state.isLoading = true
      state.error = null
    },
    loginSuccess(state, action) {
      state.isLoading = false
      state.isBooting = false
      state.user = action.payload.user
      state.token = action.payload.token
      localStorage.setItem('admin_token', action.payload.token)
      localStorage.setItem('admin_user', JSON.stringify(action.payload.user))
    },
    loginFailure(state, action) {
      state.isLoading = false
      state.isBooting = false
      state.error = action.payload
    },
    logout(state) {
      state.user = null
      state.token = null
      state.error = null
      localStorage.removeItem('admin_token')
      localStorage.removeItem('admin_user')
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(checkAdmin.pending, (state) => {
        state.isBooting = true
      })
      .addCase(checkAdmin.fulfilled, (state) => {
        state.isBooting = false
      })
      .addCase(checkAdmin.rejected, (state) => {
        state.isBooting = false
        state.user = null
        state.token = null
        state.error = 'Session expired, please login again'
        localStorage.removeItem('admin_token')
        localStorage.removeItem('admin_user')
      })
  },
})

export const { loginStart, loginSuccess, loginFailure, logout } = adminSlice.actions

export const selectAdminUser = (state) => state.admin.user
export const selectAdminAuthenticated = (state) => Boolean(state.admin.token)
export const selectAdminBooting = (state) => state.admin.isBooting

export default adminSlice.reducer
