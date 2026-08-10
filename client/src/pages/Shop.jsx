import { useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { useSearchParams } from 'react-router-dom'
import {
  useGetProductsQuery,
  useGetCategoriesQuery,
  useGetBrandsQuery,
  useGetPriceRangeQuery,
} from '../api/storefrontApi'
import { selectSettings } from '../features/settingsSlice'
import {
  MarketplaceShopLayout,
  MinimalShopLayout,
  EditorialShopLayout,
} from '../components/shop/ShopLayouts'

const SHOP_LAYOUTS = {
  marketplace: MarketplaceShopLayout,
  minimal: MinimalShopLayout,
  editorial: EditorialShopLayout,
}

export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams()
  const settings = useSelector(selectSettings)
  const { data: categoriesData } = useGetCategoriesQuery()
  const categories = categoriesData?.categories || []
  const { data: brandsData } = useGetBrandsQuery()
  const brands = brandsData?.brands || []
  const { data: priceData } = useGetPriceRangeQuery()
  const globalMin = priceData?.minPrice
  const globalMax = priceData?.maxPrice

  const [category, setCategory] = useState(searchParams.get('category') || '')
  const [selectedBrands, setSelectedBrands] = useState([])
  const [draftMin, setDraftMin] = useState(null)
  const [draftMax, setDraftMax] = useState(null)
  const [appliedPrice, setAppliedPrice] = useState({ min: '', max: '' })
  const [ratingFilter, setRatingFilter] = useState('')
  const [sort, setSort] = useState('newest')
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    if (
      appliedPrice.min === '' &&
      appliedPrice.max === '' &&
      globalMin !== undefined &&
      globalMax !== undefined
    ) {
      setDraftMin(globalMin)
      setDraftMax(globalMax)
    }
  }, [globalMin, globalMax, appliedPrice])

  useEffect(() => {
    if (draftMin === null || draftMax === null) return
    const untouched = appliedPrice.min === '' && appliedPrice.max === ''
    if (untouched && draftMin === globalMin && draftMax === globalMax) return
    const t = setTimeout(() => {
      setAppliedPrice({ min: String(draftMin), max: String(draftMax) })
      setPage(1)
    }, 400)
    return () => clearTimeout(t)
  }, [draftMin, draftMax, globalMin, globalMax, appliedPrice])

  useEffect(() => {
    const c = searchParams.get('category')
    if (c && c !== category) {
      setCategory(c)
      setPage(1)
    }
    const s = searchParams.get('search')
    if (s !== null && s !== search) {
      setSearch(s)
      setQuery(s)
      setPage(1)
    } else if (s === null && search !== '') {
      setSearch('')
      setQuery('')
      setPage(1)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  function handleSearchInput(value) {
    setSearch(value)
    const p = new URLSearchParams(searchParams)
    if (value) {
      p.set('search', value)
    } else {
      p.delete('search')
    }
    setSearchParams(p, { replace: true })
  }

  const productParams = useMemo(
    () => ({
      category: category || undefined,
      search: query || undefined,
      brand: selectedBrands.length > 0 ? selectedBrands.join(',') : undefined,
      minPrice: appliedPrice.min || undefined,
      maxPrice: appliedPrice.max || undefined,
      minRating: ratingFilter || undefined,
      sort: sort || undefined,
      page,
    }),
    [category, query, selectedBrands, appliedPrice, ratingFilter, sort, page]
  )
  const { data: productsData, isLoading, isFetching } = useGetProductsQuery(productParams)
  const products = productsData?.products || []
  const pages = productsData?.pages || 1
  const total = productsData?.total || 0

  useEffect(() => {
    const t = setTimeout(() => {
      if (search.length > 3 && search !== query) {
        setQuery(search)
        setPage(1)
      } else if (search.length === 0 && query !== '') {
        setQuery('')
        setPage(1)
      }
    }, 500)
    return () => clearTimeout(t)
  }, [search, query])

  function toggleBrand(slug) {
    setSelectedBrands((prev) =>
      prev.includes(slug) ? prev.filter((b) => b !== slug) : [...prev, slug]
    )
    setPage(1)
  }

  function setCategoryFilter(slug) {
    setCategory(slug)
    setPage(1)
    const p = new URLSearchParams(searchParams)
    if (slug) {
      p.set('category', slug)
    } else {
      p.delete('category')
    }
    setSearchParams(p, { replace: true })
  }

  function clearAll() {
    setCategory('')
    setSelectedBrands([])
    setDraftMin(globalMin)
    setDraftMax(globalMax)
    setAppliedPrice({ min: '', max: '' })
    setRatingFilter('')
    setQuery('')
    setSearch('')
    setSort('newest')
    setPage(1)
    setSearchParams({})
  }

  function handleSearch(e) {
    e.preventDefault()
    setQuery(search)
    setPage(1)
  }

  function handlePageChange(p) {
    setPage(p)
    const el = document.getElementById('product-list')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const hasFilters =
    category ||
    selectedBrands.length > 0 ||
    appliedPrice.min !== '' ||
    appliedPrice.max !== '' ||
    ratingFilter !== '' ||
    query

  const f = {
    products,
    isLoading: isLoading || isFetching,
    total,
    page,
    pages,
    setPage: handlePageChange,
    sort,
    setSort,
    search,
    onSearchChange: handleSearchInput,
    onSearchSubmit: handleSearch,
    categories,
    category,
    setCategoryFilter,
    brands,
    selectedBrands,
    toggleBrand,
    draftMin,
    draftMax,
    setDraftMin,
    setDraftMax,
    globalMin,
    globalMax,
    ratingFilter,
    setRatingFilter,
    hasFilters,
    clearAll,
  }

  const Layout = SHOP_LAYOUTS[settings.home_template] || MarketplaceShopLayout

  return <Layout f={f} />
}
