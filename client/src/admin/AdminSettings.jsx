import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import client from '../api/adminClient'
import { fetchSettings, selectSettings, selectHomeFeatures } from '../features/settingsSlice'
import { parseThemeSetting, FONT_FAMILIES } from '../theme/themes'
import { field, validateFields } from '../utils/validation'
import FieldError from '../components/FieldError'

const inputClass =
  'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'

const HOME_TEMPLATES = [
  {
    id: 'marketplace',
    name: 'Marketplace',
    description: 'Category chips, hero slider with promo rail, product grid, category showcase and promo banners.',
  },
  {
    id: 'minimal',
    name: 'Minimal Premium',
    description: 'Large editorial hero, product grid, rounded category tiles and an underlined newsletter.',
  },
  {
    id: 'editorial',
    name: 'Bold Editorial',
    description: 'Full-bleed dark hero, marquee strip, giant type, staggered categories and a colored newsletter.',
  },
]

function TemplatePreview({ id }) {
  if (id === 'minimal') {
    return (
      <div className="bg-white rounded-md border border-gray-200 p-2.5 h-36 overflow-hidden">
        <div className="flex items-end gap-2 mb-2">
          <div className="flex-1 space-y-1.5">
            <div className="h-1 w-8 bg-gray-300 rounded" />
            <div className="h-2.5 w-16 bg-gray-900 rounded" />
            <div className="h-2.5 w-12 bg-primary rounded" />
            <div className="h-1.5 w-14 bg-gray-200 rounded" />
          </div>
          <div className="w-14 aspect-[4/5] rounded-lg bg-gradient-to-br from-gray-300 to-gray-200" />
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          <div className="h-8 rounded-md bg-gray-100" />
          <div className="h-8 rounded-md bg-gray-100" />
          <div className="h-8 rounded-md bg-gray-100" />
        </div>
      </div>
    )
  }
  if (id === 'editorial') {
    return (
      <div className="bg-gray-900 rounded-md p-2.5 h-36 overflow-hidden">
        <div className="h-2 w-10 bg-accent rounded mb-2" />
        <div className="h-3.5 w-20 bg-white rounded mb-1" />
        <div className="h-3.5 w-14 bg-white/40 rounded mb-2" />
        <div className="flex gap-1.5 mb-2">
          <div className="h-4 flex-1 rounded-sm bg-gray-700" />
          <div className="h-4 flex-1 rounded-sm bg-gray-700" />
          <div className="h-4 flex-1 rounded-sm bg-gray-700" />
        </div>
        <div className="h-1.5 w-24 bg-accent/70 rounded" />
      </div>
    )
  }
  return (
    <div className="bg-white rounded-md border border-gray-200 p-2.5 h-36 overflow-hidden">
      <div className="flex gap-1.5 mb-2">
        <div className="h-2 w-8 rounded-full bg-primary" />
        <div className="h-2 w-6 rounded-full bg-gray-200" />
        <div className="h-2 w-6 rounded-full bg-gray-200" />
      </div>
      <div className="flex gap-1.5 mb-2">
        <div className="h-12 flex-[2] rounded-md bg-gradient-to-r from-gray-700 to-gray-500 relative">
          <div className="absolute left-1 bottom-1 space-y-1">
            <div className="h-1.5 w-8 bg-white rounded" />
            <div className="h-1 w-5 bg-white/60 rounded" />
          </div>
        </div>
        <div className="flex-1 flex flex-col gap-1.5">
          <div className="flex-1 rounded-md bg-gray-300" />
          <div className="flex-1 rounded-md bg-gray-200" />
        </div>
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        <div className="h-6 rounded bg-gray-100" />
        <div className="h-6 rounded bg-gray-100" />
        <div className="h-6 rounded bg-gray-100" />
        <div className="h-6 rounded bg-gray-100" />
      </div>
    </div>
  )
}

export default function AdminSettings() {
  const dispatch = useDispatch()
  const settings = useSelector(selectSettings)
  const savedFeatures = useSelector(selectHomeFeatures)
  const [form, setForm] = useState({})
  const [features, setFeatures] = useState([])
  const [logoFile, setLogoFile] = useState(null)
  const [faviconFile, setFaviconFile] = useState(null)
  const [footerLogoFile, setFooterLogoFile] = useState(null)
  const [theme, setTheme] = useState(parseThemeSetting(''))
  const [template, setTemplate] = useState('marketplace')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  useEffect(() => {
    setForm({
      site_title: settings.site_title || '',
      site_logo: settings.site_logo || '',
      site_favicon: settings.site_favicon || '',
      site_tagline: settings.site_tagline || '',
      footer_logo: settings.footer_logo || '',
      facebook_url: settings.facebook_url || '',
      instagram_url: settings.instagram_url || '',
      free_shipping_threshold: settings.free_shipping_threshold || '',
      return_days: settings.return_days || '',
      contact_email: settings.contact_email || '',
      contact_phone: settings.contact_phone || '',
      tax_enabled: settings.tax_enabled || '0',
      tax_rate: settings.tax_rate || '0',
      tax_inclusive: settings.tax_inclusive || '0',
      reviews_auto_approve: settings.reviews_auto_approve || '1',
      smtp_host: settings.smtp_host || '',
      smtp_port: settings.smtp_port || '587',
      smtp_secure: settings.smtp_secure || '0',
      smtp_user: settings.smtp_user || '',
      smtp_password: settings.smtp_password || '',
      smtp_from: settings.smtp_from || '',
    })
    setFeatures(savedFeatures)
    setTheme(parseThemeSetting(settings.theme))
    setTemplate(settings.home_template || 'marketplace')
  }, [settings, savedFeatures])

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }))
    setFieldErrors((prev) => {
      if (!(key in prev)) return prev
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  function selectTemplate(id) {
    setTheme((t) => ({ ...t, selected: id }))
  }

  function updateTemplate(id, key, value) {
    setTheme((t) => ({
      ...t,
      templates: t.templates.map((tm) => (tm.id === id ? { ...tm, [key]: value } : tm)),
    }))
  }

  function addTemplate() {
    setTheme((t) => {
      const source = t.templates.find((tm) => tm.id === t.selected) || t.templates[0]
      const copy = { ...source, id: `${source.id}-${Date.now()}`, name: 'New theme' }
      return { ...t, selected: copy.id, templates: [...t.templates, copy] }
    })
  }

  function removeTemplate(id) {
    setTheme((t) => {
      if (t.templates.length <= 1) return t
      const templates = t.templates.filter((tm) => tm.id !== id)
      const selected = t.selected === id ? templates[0].id : t.selected
      return { ...t, selected, templates }
    })
  }

  function setFeature(i, key, value) {
    setFeatures((list) => list.map((f, j) => (j === i ? { ...f, [key]: value } : f)))
  }

  async function save(e) {
    e.preventDefault()
    setMessage('')
    setError('')
    const { fieldErrors: errors, isValid } = validateFields({
      free_shipping_threshold: [field.number('Free shipping threshold'), field.min(0, 'Free shipping threshold')],
      return_days: [field.int('Return period'), field.min(0, 'Return period')],
      tax_rate: [field.number('Tax rate'), field.min(0, 'Tax rate'), field.max(100, 'Tax rate')],
      contact_email: [field.email('Contact email')],
      smtp_from: [field.email('From address')],
    }, form)
    setFieldErrors(errors)
    if (!isValid) return
    setSaving(true)
    const fd = new FormData()
    for (const [key, value] of Object.entries(form)) {
      fd.append(key, value ?? '')
    }
    fd.append('home_features', JSON.stringify(features))
    fd.append('theme', JSON.stringify(theme))
    fd.append('home_template', template)
    if (logoFile) fd.append('logo', logoFile)
    if (faviconFile) fd.append('favicon', faviconFile)
    if (footerLogoFile) fd.append('footer_logo', footerLogoFile)
    try {
      await client.put('/admin/settings', fd)
      setMessage('Settings saved')
      setLogoFile(null)
      setFaviconFile(null)
      setFooterLogoFile(null)
      dispatch(fetchSettings())
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <Link to="/admin" className="text-sm text-blue-600 hover:underline">
          ← Back to dashboard
        </Link>
        <h1 className="text-2xl font-bold mt-1">Store Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Branding, social links, shipping defaults and home page features
        </p>
      </div>

      {message && <p className="mb-4 text-green-600">{message}</p>}
      {error && <p className="mb-4 text-red-600">{error}</p>}

      <form noValidate onSubmit={save}>
        {/* Branding */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <header className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-800">Branding</h2>
            <p className="text-xs text-gray-500 mt-0.5">Site name, logos, favicon and tagline</p>
          </header>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Site title</label>
              <input
                value={form.site_title || ''}
                onChange={(e) => set('site_title', e.target.value)}
                className={inputClass}
                placeholder="Shop"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Site tagline</label>
              <textarea
                value={form.site_tagline || ''}
                onChange={(e) => set('site_tagline', e.target.value)}
                className={inputClass}
                rows={2}
                placeholder="Short description shown in the footer"
              />
              <p className="text-xs text-gray-500 mt-1">Shown in the footer under the logo.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Header logo</label>
                {form.site_logo && (
                  <img src={form.site_logo} alt="Logo" className="h-10 w-auto object-contain mb-2 bg-gray-50 rounded p-1 border" />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setLogoFile(e.target.files[0] || null)}
                  className="w-full border rounded p-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Footer logo</label>
                {form.footer_logo && (
                  <img src={form.footer_logo} alt="Footer logo" className="h-10 w-auto object-contain mb-2 bg-gray-50 rounded p-1 border" />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFooterLogoFile(e.target.files[0] || null)}
                  className="w-full border rounded p-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Favicon</label>
                {form.site_favicon && (
                  <img src={form.site_favicon} alt="Favicon" className="h-10 w-auto object-contain mb-2 bg-gray-50 rounded p-1 border" />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFaviconFile(e.target.files[0] || null)}
                  className="w-full border rounded p-2 text-sm"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Home page template */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <header className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-800">Home page template</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Choose the layout of your storefront home page. All templates use the same content.
            </p>
          </header>
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            {HOME_TEMPLATES.map((t) => {
              const selected = template === t.id
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTemplate(t.id)}
                  className={`text-left rounded-lg border p-3 transition-colors ${
                    selected ? 'border-blue-600 ring-2 ring-blue-500' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <TemplatePreview id={t.id} />
                  <p className="font-semibold text-sm mt-2 flex items-center justify-between">
                    {t.name}
                    {selected && <span className="text-xs text-blue-600 font-semibold">In use</span>}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{t.description}</p>
                </button>
              )
            })}
          </div>
        </section>

        {/* Theme */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <header className="px-6 py-4 border-b border-gray-100 flex items-start justify-between gap-4">
            <div>
              <h2 className="font-bold text-gray-800">Color themes</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Create and manage storefront color patterns. Edit names, descriptions and colors, or
                add your own.
              </p>
            </div>
            <button
              type="button"
              onClick={addTemplate}
              className="shrink-0 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-blue-700"
            >
              + Add theme
            </button>
          </header>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {theme.templates.map((t) => {
              const selected = theme.selected === t.id
              return (
                <div
                  key={t.id}
                  className={`rounded-lg border p-4 transition-colors ${selected ? 'border-blue-600 ring-2 ring-blue-500' : 'border-gray-200'}`}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className="h-6 w-6 rounded-full border border-black/10" style={{ backgroundColor: t.primary }} />
                    <span className="h-6 w-6 rounded-full border border-black/10" style={{ backgroundColor: t.accent }} />
                    <span className="ml-auto flex items-center gap-2">
                      {selected && (
                        <span className="text-xs text-blue-600 font-semibold">In use</span>
                      )}
                      <button
                        type="button"
                        onClick={() => selectTemplate(t.id)}
                        className="text-sm text-blue-600 hover:underline font-medium"
                      >
                        {selected ? 'Selected' : 'Use'}
                      </button>
                      <button
                        type="button"
                        onClick={() => removeTemplate(t.id)}
                        disabled={theme.templates.length <= 1}
                        className="text-red-600 hover:text-red-800 text-xl leading-none px-1 disabled:opacity-30"
                        aria-label={`Delete theme ${t.name}`}
                      >
                        ×
                      </button>
                    </span>
                  </div>
                  <div className="space-y-2">
                    <input
                      value={t.name || ''}
                      onChange={(e) => updateTemplate(t.id, 'name', e.target.value)}
                      className={inputClass}
                      placeholder="Theme name"
                    />
                    <input
                      value={t.description || ''}
                      onChange={(e) => updateTemplate(t.id, 'description', e.target.value)}
                      className={inputClass}
                      placeholder="Short description"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-semibold text-gray-600 shrink-0">Primary</label>
                        <input
                          type="color"
                          value={t.primary || '#2563eb'}
                          onChange={(e) => updateTemplate(t.id, 'primary', e.target.value)}
                          className="h-8 w-10 rounded border border-gray-300"
                        />
                        <input
                          value={t.primary || ''}
                          onChange={(e) => updateTemplate(t.id, 'primary', e.target.value)}
                          className="w-full border rounded p-1.5 text-xs"
                          placeholder="#hex"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-semibold text-gray-600 shrink-0">Accent</label>
                        <input
                          type="color"
                          value={t.accent || '#0ea5e9'}
                          onChange={(e) => updateTemplate(t.id, 'accent', e.target.value)}
                          className="h-8 w-10 rounded border border-gray-300"
                        />
                        <input
                          value={t.accent || ''}
                          onChange={(e) => updateTemplate(t.id, 'accent', e.target.value)}
                          className="w-full border rounded p-1.5 text-xs"
                          placeholder="#hex"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Header background</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={t.headerBg || '#ffffff'}
                            onChange={(e) => updateTemplate(t.id, 'headerBg', e.target.value)}
                            className="h-8 w-10 rounded border border-gray-300"
                          />
                          <input
                            value={t.headerBg || ''}
                            onChange={(e) => updateTemplate(t.id, 'headerBg', e.target.value)}
                            className="w-full border rounded p-1.5 text-xs"
                            placeholder="#hex"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Header text</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={t.headerText || '#111827'}
                            onChange={(e) => updateTemplate(t.id, 'headerText', e.target.value)}
                            className="h-8 w-10 rounded border border-gray-300"
                          />
                          <input
                            value={t.headerText || ''}
                            onChange={(e) => updateTemplate(t.id, 'headerText', e.target.value)}
                            className="w-full border rounded p-1.5 text-xs"
                            placeholder="#hex"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Body background</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={t.bodyBg || '#ffffff'}
                            onChange={(e) => updateTemplate(t.id, 'bodyBg', e.target.value)}
                            className="h-8 w-10 rounded border border-gray-300"
                          />
                          <input
                            value={t.bodyBg || ''}
                            onChange={(e) => updateTemplate(t.id, 'bodyBg', e.target.value)}
                            className="w-full border rounded p-1.5 text-xs"
                            placeholder="#hex"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Base font size (px)</label>
                        <input
                          type="number"
                          min="12"
                          max="20"
                          value={t.fontSize || '16'}
                          onChange={(e) => updateTemplate(t.id, 'fontSize', e.target.value)}
                          className="w-full border rounded p-1.5 text-xs"
                          placeholder="16"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Font family</label>
                      <select
                        value={t.fontFamily || 'Inter, system-ui, sans-serif'}
                        onChange={(e) => updateTemplate(t.id, 'fontFamily', e.target.value)}
                        className="w-full border rounded p-1.5 text-xs"
                      >
                        {FONT_FAMILIES.map((f) => (
                          <option key={f.label} value={f.value}>
                            {f.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Footer background</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={t.footerBg || t.headerBg || '#111827'}
                            onChange={(e) => updateTemplate(t.id, 'footerBg', e.target.value)}
                            className="h-8 w-10 rounded border border-gray-300"
                          />
                          <input
                            value={t.footerBg || ''}
                            onChange={(e) => updateTemplate(t.id, 'footerBg', e.target.value)}
                            className="w-full border rounded p-1.5 text-xs"
                            placeholder="#hex"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Footer text</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={t.footerText || t.headerText || '#d1d5db'}
                            onChange={(e) => updateTemplate(t.id, 'footerText', e.target.value)}
                            className="h-8 w-10 rounded border border-gray-300"
                          />
                          <input
                            value={t.footerText || ''}
                            onChange={(e) => updateTemplate(t.id, 'footerText', e.target.value)}
                            className="w-full border rounded p-1.5 text-xs"
                            placeholder="#hex"
                          />
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        updateTemplate(t.id, 'footerBg', t.headerBg)
                        updateTemplate(t.id, 'footerText', t.headerText)
                      }}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Set footer same as header
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Social & contact */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <header className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-800">Social & contact</h2>
            <p className="text-xs text-gray-500 mt-0.5">Links and contact details shown in the footer</p>
          </header>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Facebook URL</label>
              <input
                value={form.facebook_url || ''}
                onChange={(e) => set('facebook_url', e.target.value)}
                className={inputClass}
                placeholder="https://facebook.com/..."
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Instagram URL</label>
              <input
                value={form.instagram_url || ''}
                onChange={(e) => set('instagram_url', e.target.value)}
                className={inputClass}
                placeholder="https://instagram.com/..."
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Contact email</label>
                <input
                  type="email"
                  value={form.contact_email || ''}
                  onChange={(e) => set('contact_email', e.target.value)}
                  className={inputClass}
                  placeholder="support@example.com"
                />
                <FieldError name="contact_email" errors={fieldErrors} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Contact phone</label>
              <input
                value={form.contact_phone || ''}
                onChange={(e) => set('contact_phone', e.target.value)}
                className={inputClass}
                placeholder="+1 800 000 0000"
              />
            </div>
          </div>
        </section>

        {/* Shipping & returns */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <header className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-800">Shipping & returns</h2>
            <p className="text-xs text-gray-500 mt-0.5">Store-wide defaults used across the storefront</p>
          </header>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Free shipping threshold ($)
              </label>
                <input
                  type="number"
                  min="0"
                  value={form.free_shipping_threshold || ''}
                  onChange={(e) => set('free_shipping_threshold', e.target.value)}
                  className={inputClass}
                  placeholder="50"
                />
                <FieldError name="free_shipping_threshold" errors={fieldErrors} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Default return period (days)
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.return_days || ''}
                  onChange={(e) => set('return_days', e.target.value)}
                  className={inputClass}
                  placeholder="30"
                />
                <FieldError name="return_days" errors={fieldErrors} />
              <p className="text-xs text-gray-500 mt-1">Products can override this individually.</p>
            </div>
          </div>
        </section>

        {/* Tax */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <header className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-800">Tax</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Sales tax applied to order subtotals at checkout
            </p>
          </header>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Collect tax</label>
              <select
                value={form.tax_enabled || '0'}
                onChange={(e) => set('tax_enabled', e.target.value)}
                className={inputClass}
              >
                <option value="0">Disabled</option>
                <option value="1">Enabled</option>
              </select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Tax rate (%)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={form.tax_rate || '0'}
                  onChange={(e) => set('tax_rate', e.target.value)}
                  className={inputClass}
                  placeholder="0"
                />
                <FieldError name="tax_rate" errors={fieldErrors} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Prices include tax?</label>
                <select
                  value={form.tax_inclusive || '0'}
                  onChange={(e) => set('tax_inclusive', e.target.value)}
                  className={inputClass}
                >
                  <option value="0">No — add tax on top</option>
                  <option value="1">Yes — tax is included in prices</option>
                </select>
              </div>
            </div>
            <p className="text-xs text-gray-500">
              Tax is calculated on the discounted subtotal. With "prices include tax" the total
              doesn't change; the tax amount is shown for transparency.
            </p>
          </div>
        </section>

        {/* Reviews */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <header className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-800">Reviews</h2>
            <p className="text-xs text-gray-500 mt-0.5">How customer reviews are handled</p>
          </header>
          <div className="p-6">
            <label className="block text-sm font-semibold text-gray-700 mb-1">New reviews</label>
            <select
              value={form.reviews_auto_approve || '1'}
              onChange={(e) => set('reviews_auto_approve', e.target.value)}
              className={inputClass}
            >
              <option value="1">Auto-approve</option>
              <option value="0">Require moderation</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              When moderation is required, new reviews are hidden until you approve them in
              Admin &gt; Reviews.
            </p>
          </div>
        </section>

        {/* Email (SMTP) */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <header className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-800">Email (SMTP)</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Used for transactional emails like order confirmations and password reset.
            </p>
          </header>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">SMTP host</label>
              <input
                type="text"
                value={form.smtp_host || ''}
                onChange={(e) => set('smtp_host', e.target.value)}
                placeholder="smtp.example.com"
                className={inputClass}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Port</label>
                <input
                  type="text"
                  value={form.smtp_port || '587'}
                  onChange={(e) => set('smtp_port', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Secure (TLS)</label>
                <select
                  value={form.smtp_secure || '0'}
                  onChange={(e) => set('smtp_secure', e.target.value)}
                  className={inputClass}
                >
                  <option value="1">Yes (TLS)</option>
                  <option value="0">No</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Username</label>
              <input
                type="text"
                value={form.smtp_user || ''}
                onChange={(e) => set('smtp_user', e.target.value)}
                autoComplete="off"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={form.smtp_password || ''}
                onChange={(e) => set('smtp_password', e.target.value)}
                autoComplete="new-password"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">From address</label>
              <input
                type="text"
                value={form.smtp_from || ''}
                onChange={(e) => set('smtp_from', e.target.value)}
                placeholder="no-reply@example.com"
                className={inputClass}
              />
              <FieldError name="smtp_from" errors={fieldErrors} />
            </div>
          </div>
        </section>

        {/* Home features */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <header className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-800">Home features</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Icons, titles and text shown below the categories on the home page. Use{' '}
              <code className="bg-gray-100 px-1 rounded">{'{threshold}'}</code> in text to insert the
              free shipping threshold.
            </p>
          </header>
          <div className="p-6 space-y-4">
            {features.map((f, i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-4 space-y-3">
                <div className="grid grid-cols-[80px_1fr] gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Icon (emoji)</label>
                    <input
                      value={f.icon || ''}
                      onChange={(e) => setFeature(i, 'icon', e.target.value)}
                      className="w-full border rounded p-2 text-center text-lg"
                      placeholder="🚚"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Title</label>
                    <input
                      value={f.title || ''}
                      onChange={(e) => setFeature(i, 'title', e.target.value)}
                      className="w-full border rounded p-2 text-sm"
                      placeholder="Free Shipping"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Text</label>
                  <div className="flex gap-2">
                    <input
                      value={f.text || ''}
                      onChange={(e) => setFeature(i, 'text', e.target.value)}
                      className="flex-1 border rounded p-2 text-sm"
                      placeholder="On orders over {threshold}"
                    />
                    <button
                      type="button"
                      onClick={() => setFeatures(features.filter((_, j) => j !== i))}
                      className="text-red-600 hover:text-red-800 text-xl leading-none px-2"
                      aria-label="Remove feature"
                    >
                      ×
                    </button>
                  </div>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setFeatures([...features, { icon: '✨', title: '', text: '' }])}
              className="w-full border border-dashed border-gray-300 rounded-lg py-2.5 text-sm text-gray-600 hover:bg-gray-50"
            >
              + Add feature
            </button>
          </div>
        </section>

        <div className="fixed bottom-6 right-6 z-40">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-semibold"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  )
}
