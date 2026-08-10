import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import client from '../api/client'

export const checkAuth = createAsyncThunk('auth/checkAuth', async (_, { rejectWithValue }) => {
  const token = localStorage.getItem('token')
  if (!token) return null
  try {
    const { data } = await client.get('/auth/me')
    return data.user
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Session expired')
  }
})

const token = localStorage.getItem('token')
const user = JSON.parse(localStorage.getItem('user') || 'null')

const initialState = {
  user,
  token,
  isLoading: false,
  isBooting: Boolean(token),
  error: null,
}

const authSlice = createSlice({
  name: 'auth',
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
      localStorage.setItem('token', action.payload.token)
      localStorage.setItem('user', JSON.stringify(action.payload.user))
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
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    },
    setUser(state, action) {
      state.user = action.payload
      localStorage.setItem('user', JSON.stringify(action.payload))
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(checkAuth.pending, (state) => {
        state.isBooting = true
      })
      .addCase(checkAuth.fulfilled, (state, action) => {
        state.isBooting = false
        if (action.payload) {
          state.user = action.payload
          localStorage.setItem('user', JSON.stringify(action.payload))
        } else {
          state.user = null
          state.token = null
        }
      })
      .addCase(checkAuth.rejected, (state) => {
        state.isBooting = false
        state.user = null
        state.token = null
        state.error = 'Session expired, please login again'
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      })
  },
})

export const { loginStart, loginSuccess, loginFailure, logout, setUser } = authSlice.actions

export const selectIsAuthenticated = (state) => Boolean(state.auth.token)
export const selectUser = (state) => state.auth.user
export const selectIsBooting = (state) => state.auth.isBooting

export default authSlice.reducer
