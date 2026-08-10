import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export const storefrontApi = createApi({
  reducerPath: 'storefrontApi',
  baseQuery: fetchBaseQuery({
    baseUrl: API_URL,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('token')
      if (token) {
        headers.set('Authorization', `Bearer ${token}`)
      }
      return headers
    },
  }),
  tagTypes: ['Catalog'],
  keepUnusedDataFor: 30,
  refetchOnMountOrArgChange: 30,
  endpoints: (builder) => ({
    getHome: builder.query({
      query: () => '/home',
    }),
    getProducts: builder.query({
      query: (params) => ({ url: '/products', params }),
    }),
    getProduct: builder.query({
      query: (slug) => `/products/${slug}`,
    }),
    getCategories: builder.query({
      query: () => '/categories',
    }),
    getBrands: builder.query({
      query: () => '/brands',
    }),
    getPriceRange: builder.query({
      query: () => '/products/price-range',
    }),
  }),
})

export const {
  useGetHomeQuery,
  useGetProductsQuery,
  useGetProductQuery,
  useGetCategoriesQuery,
  useGetBrandsQuery,
  useGetPriceRangeQuery,
} = storefrontApi
