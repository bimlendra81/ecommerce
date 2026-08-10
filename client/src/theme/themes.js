export const BUILTIN_TEMPLATES = [
  {
    id: 'amazon',
    name: 'Amazon',
    description: 'Dark navy header with warm orange accents',
    headerBg: '#131921',
    headerText: '#ffffff',
    primary: '#232f3e',
    primaryDark: '#37475a',
    primarySoft: '#eef1f3',
    primaryLight: '#d1d5db',
    accent: '#febd69',
    accentDark: '#f3a847',
    bodyBg: '#ffffff',
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: '16',
    footerBg: '#131921',
    footerText: '#d1d5db',
  },
  {
    id: 'ocean',
    name: 'Ocean Blue',
    description: 'Classic blue storefront',
    headerBg: '#1e3a8a',
    headerText: '#ffffff',
    primary: '#2563eb',
    primaryDark: '#1d4ed8',
    primarySoft: '#eff6ff',
    primaryLight: '#dbeafe',
    accent: '#0ea5e9',
    accentDark: '#0284c7',
    bodyBg: '#ffffff',
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: '16',
    footerBg: '#1e3a8a',
    footerText: '#d1d5db',
  },
  {
    id: 'emerald',
    name: 'Emerald',
    description: 'Fresh green tones',
    headerBg: '#064e3b',
    headerText: '#ffffff',
    primary: '#059669',
    primaryDark: '#047857',
    primarySoft: '#ecfdf5',
    primaryLight: '#a7f3d0',
    accent: '#10b981',
    accentDark: '#059669',
    bodyBg: '#ffffff',
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: '16',
    footerBg: '#064e3b',
    footerText: '#d1d5db',
  },
  {
    id: 'violet',
    name: 'Royal Purple',
    description: 'Bold violet and purple',
    headerBg: '#4c1d95',
    headerText: '#ffffff',
    primary: '#7c3aed',
    primaryDark: '#6d28d9',
    primarySoft: '#f5f3ff',
    primaryLight: '#ddd6fe',
    accent: '#a855f7',
    accentDark: '#9333ea',
    bodyBg: '#ffffff',
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: '16',
    footerBg: '#4c1d95',
    footerText: '#d1d5db',
  },
  {
    id: 'rose',
    name: 'Rose',
    description: 'Warm red-pink accents',
    headerBg: '#881337',
    headerText: '#ffffff',
    primary: '#e11d48',
    primaryDark: '#be123c',
    primarySoft: '#fff1f2',
    primaryLight: '#fecdd3',
    accent: '#f43f5e',
    accentDark: '#e11d48',
    bodyBg: '#ffffff',
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: '16',
    footerBg: '#881337',
    footerText: '#d1d5db',
  },
  {
    id: 'dark',
    name: 'Dark Mode',
    description: 'Near-black header with orange and cyan',
    headerBg: '#111827',
    headerText: '#ffffff',
    primary: '#f97316',
    primaryDark: '#ea580c',
    primarySoft: '#27272a',
    primaryLight: '#fed7aa',
    accent: '#22d3ee',
    accentDark: '#06b6d4',
    bodyBg: '#0b0f19',
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: '16',
    footerBg: '#111827',
    footerText: '#d1d5db',
  },
]

export const FONT_FAMILIES = [
  { label: 'Inter', value: 'Inter, system-ui, sans-serif' },
  { label: 'Poppins', value: 'Poppins, system-ui, sans-serif' },
  { label: 'Roboto', value: 'Roboto, system-ui, sans-serif' },
  { label: 'Open Sans', value: '"Open Sans", system-ui, sans-serif' },
  { label: 'Lato', value: 'Lato, system-ui, sans-serif' },
  { label: 'Montserrat', value: 'Montserrat, system-ui, sans-serif' },
  { label: 'Merriweather', value: 'Merriweather, Georgia, serif' },
  { label: 'Georgia', value: 'Georgia, serif' },
]

export function defaultThemeSetting() {
  return {
    selected: 'ocean',
    primary: '',
    accent: '',
    templates: BUILTIN_TEMPLATES.map((t) => ({ ...t })),
  }
}

export function parseThemeSetting(raw) {
  try {
    const p = typeof raw === 'string' ? JSON.parse(raw) : raw
    if (!p || typeof p !== 'object') return defaultThemeSetting()
    const templates =
      Array.isArray(p.templates) && p.templates.length > 0
        ? p.templates
        : BUILTIN_TEMPLATES.map((t) => ({ ...t }))
    return {
      selected: p.selected || p.template || templates[0].id,
      primary: p.primary || '',
      accent: p.accent || '',
      templates,
    }
  } catch {
    return defaultThemeSetting()
  }
}

export function resolveTheme(raw) {
  const setting = parseThemeSetting(raw)
  const base =
    setting.templates.find((t) => t.id === setting.selected) ||
    setting.templates[0] ||
    BUILTIN_TEMPLATES[0]
  return {
    ...base,
    primary: setting.primary || base.primary,
    accent: setting.accent || base.accent,
  }
}

export function applyTheme(raw) {
  const theme = resolveTheme(raw)
  const root = document.documentElement
  root.style.setProperty('--primary', theme.primary)
  root.style.setProperty('--primary-dark', theme.primaryDark)
  root.style.setProperty('--primary-soft', theme.primarySoft)
  root.style.setProperty('--primary-light', theme.primaryLight)
  root.style.setProperty('--accent', theme.accent)
  root.style.setProperty('--accent-dark', theme.accentDark)
  root.style.setProperty('--header-bg', theme.headerBg)
  root.style.setProperty('--header-text', theme.headerText)
  root.style.setProperty('--body-bg', theme.bodyBg || '#ffffff')
  root.style.setProperty('--font-family', theme.fontFamily || 'Inter, system-ui, sans-serif')
  root.style.setProperty('--font-size', `${theme.fontSize || '16'}px`)
  root.style.setProperty('--footer-bg', theme.footerBg || theme.headerBg || '#111827')
  root.style.setProperty('--footer-text', theme.footerText || theme.headerText || '#d1d5db')
}
