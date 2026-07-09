import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { CategoryTranslation } from '@/lib/database.types'
import i18n from '@/i18n'

const KEY = ['category_translations']

/** Todas las traducciones de categorías/grupos definidas por el admin en BD. */
export function useCategoryTranslations() {
  return useQuery({
    queryKey: KEY,
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('category_translations')
        .select('*')
      if (error) throw error
      return data as CategoryTranslation[]
    },
  })
}

/**
 * Fusiona las traducciones de BD SOBRE el bundle `categories.json` (override +
 * extensión), para cada idioma. `category_group.<slug>` y `category.<slug>` son
 * las claves i18n que consume la app. Se llama una vez, alto en el árbol.
 */
export function useMergeCategoryTranslations() {
  const { data } = useCategoryTranslations()

  useEffect(() => {
    if (!data?.length) return
    // { es: { category_group: {...}, category: {...} }, en: {...} }
    const byLang: Record<string, { category_group: Record<string, string>; category: Record<string, string> }> = {}
    for (const row of data) {
      const lang = (byLang[row.lang] ??= { category_group: {}, category: {} })
      const bucket = row.key_type === 'group' ? lang.category_group : lang.category
      bucket[row.slug] = row.label
    }
    for (const [lang, res] of Object.entries(byLang)) {
      // deep=true, overwrite=true → override lo del bundle y añade nuevas claves.
      i18n.addResourceBundle(lang, 'categories', res, true, true)
    }
    // react-i18next solo re-renderiza por defecto ante 'languageChanged'; lo
    // emitimos (no-op de idioma) para que los labels ya montados se refresquen.
    i18n.emit('languageChanged', i18n.language)
  }, [data])
}
