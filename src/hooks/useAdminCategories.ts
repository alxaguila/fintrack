import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Category, CategoryGroup, CategoryType } from '@/lib/database.types'

/**
 * Mutaciones de administración de la taxonomía: grupos y subcategorías + sus
 * traducciones ES/EN (tabla category_translations, migración 016). La escritura
 * la gobierna is_admin() en RLS; aquí solo orquestamos.
 */

type Labels = { es: string; en: string }

function invalidateAll(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ['category_groups'] })
  qc.invalidateQueries({ queryKey: ['categories'] })
  qc.invalidateQueries({ queryKey: ['category_translations'] })
}

async function upsertTranslations(keyType: 'group' | 'category', slug: string, labels: Labels) {
  const rows = [
    { key_type: keyType, slug, lang: 'es', label: labels.es, updated_at: new Date().toISOString() },
    { key_type: keyType, slug, lang: 'en', label: labels.en, updated_at: new Date().toISOString() },
  ]
  const { error } = await supabase
    .from('category_translations')
    .upsert(rows, { onConflict: 'key_type,slug,lang' })
  if (error) throw error
}

async function deleteTranslations(keyType: 'group' | 'category', slug: string) {
  await supabase.from('category_translations').delete().eq('key_type', keyType).eq('slug', slug)
}

// ------------------------------------------------------------
// Grupos
// ------------------------------------------------------------
type GroupInput = {
  slug: string
  type: CategoryType
  icon: string | null
  color: string | null
  sort_order: number
  labels: Labels
}

export function useSaveCategoryGroup() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, labels, ...fields }: GroupInput & { id?: string }) => {
      if (id) {
        const { error } = await supabase.from('category_groups').update(fields).eq('id', id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('category_groups').insert(fields)
        if (error) throw error
      }
      await upsertTranslations('group', fields.slug, labels)
    },
    onSuccess: () => invalidateAll(qc),
  })
}

export function useDeleteCategoryGroup() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (group: CategoryGroup) => {
      const { error } = await supabase.from('category_groups').delete().eq('id', group.id)
      if (error) throw error
      await deleteTranslations('group', group.slug)
    },
    onSuccess: () => invalidateAll(qc),
  })
}

// ------------------------------------------------------------
// Subcategorías
// ------------------------------------------------------------
type CategoryInput = {
  slug: string
  group_id: string
  icon: string | null
  sort_order: number
  labels: Labels
}

export function useSaveCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, labels, ...fields }: CategoryInput & { id?: string }) => {
      if (id) {
        const { error } = await supabase.from('categories').update(fields).eq('id', id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('categories').insert(fields)
        if (error) throw error
      }
      await upsertTranslations('category', fields.slug, labels)
    },
    onSuccess: () => invalidateAll(qc),
  })
}

export function useDeleteCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (category: Category) => {
      const { error } = await supabase.from('categories').delete().eq('id', category.id)
      if (error) throw error
      await deleteTranslations('category', category.slug)
    },
    onSuccess: () => invalidateAll(qc),
  })
}
