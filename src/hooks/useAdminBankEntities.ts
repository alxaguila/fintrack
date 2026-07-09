import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { BankEntity } from '@/lib/database.types'

export const BANK_LOGO_BUCKET = 'bank-logos'
export const MAX_BANK_LOGO_BYTES = 1024 * 1024 // 1 MB

/** Sube un logo de entidad al bucket bank-logos y devuelve su URL pública. */
export async function uploadBankLogo(file: File): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'png'
  const path = `${crypto.randomUUID()}.${ext}`
  const { error } = await supabase.storage
    .from(BANK_LOGO_BUCKET)
    .upload(path, file, { cacheControl: '3600', upsert: true })
  if (error) throw error
  const { data } = supabase.storage.from(BANK_LOGO_BUCKET).getPublicUrl(path)
  return data.publicUrl
}

type BankEntityInput = { name: string; logo_url: string | null; sort_order: number }

export function useCreateBankEntity() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: BankEntityInput) => {
      const { error } = await supabase.from('bank_entities').insert(input)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bank_entities'] }),
  })
}

export function useUpdateBankEntity() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...patch }: BankEntityInput & { id: string }) => {
      const { error } = await supabase.from('bank_entities').update(patch).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bank_entities'] }),
  })
}

export function useDeleteBankEntity() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (entity: BankEntity) => {
      const { error } = await supabase.from('bank_entities').delete().eq('id', entity.id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bank_entities'] }),
  })
}
