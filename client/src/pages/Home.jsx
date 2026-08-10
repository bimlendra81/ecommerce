import { useSelector } from 'react-redux'
import { useGetHomeQuery } from '../api/storefrontApi'
import { selectUser } from '../features/authSlice'
import { selectSettings, selectHomeFeatures } from '../features/settingsSlice'
import MarketplaceTemplate from '../components/home/MarketplaceTemplate'
import MinimalTemplate from '../components/home/MinimalTemplate'
import EditorialTemplate from '../components/home/EditorialTemplate'

const TEMPLATES = {
  marketplace: MarketplaceTemplate,
  minimal: MinimalTemplate,
  editorial: EditorialTemplate,
}

export default function Home() {
  const user = useSelector(selectUser)
  const { data } = useGetHomeQuery(user ? `u:${user.id}` : 'anon')
  const settings = useSelector(selectSettings)
  const homeFeatures = useSelector(selectHomeFeatures)

  const slides = data?.slides || []
  const popularProducts = data?.popularProducts || []
  const categories = data?.categories || []
  const trendingCategories = data?.trendingCategories || []
  const featuredCategories = data?.featuredCategories || []
  const recommended = data?.recommended || []

  const features = homeFeatures.map((f) => ({
    ...f,
    text: (f.text || '').replace('{threshold}', `$${settings.free_shipping_threshold}`),
  }))

  const Template = TEMPLATES[settings.home_template] || MarketplaceTemplate

  return (
    <Template
      slides={slides}
      popularProducts={popularProducts}
      categories={categories}
      trendingCategories={trendingCategories}
      featuredCategories={featuredCategories}
      recommended={recommended}
      features={features}
      settings={settings}
    />
  )
}
