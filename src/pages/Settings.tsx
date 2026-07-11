import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { User, Lock, MessageSquare, LogOut, Trash2, ChevronRight, AlertTriangle, Languages } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useUpdateLanguage } from '@/hooks/useUserSettings'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { toast } from '@/hooks/useToast'

// Palabra que el usuario debe teclear para confirmar el borrado (igual en ES/EN).
const DELETE_WORD = 'delete'

export default function Settings() {
  const { t } = useTranslation('settings')

  return (
    <div className="mx-auto max-w-2xl p-6 space-y-6">
      <h1 className="text-3xl font-extrabold tracking-tight">{t('title')}</h1>

      {/* Grupo principal: navegación */}
      <nav className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <MenuLink to="/settings/profile" icon={User} label={t('menu.profile')} />
        <MenuLink to="/settings/security" icon={Lock} label={t('menu.security')} />
        <MenuLink to="/settings/feedback" icon={MessageSquare} label={t('menu.feedback')} />
        <LanguageRow />
      </nav>

      {/* Grupo secundario: sesión y cuenta */}
      <div className="space-y-3">
        <LogoutRow />
        <DeleteAccountRow />
      </div>
    </div>
  )
}

/** Fila de navegación: icono redondo + label + chevron. */
function MenuLink({ to, icon: Icon, label }: { to: string; icon: typeof User; label: string }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-4 border-b border-slate-100 px-4 py-4 transition-colors last:border-b-0 hover:bg-slate-50"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
        <Icon className="h-5 w-5" />
      </span>
      <span className="flex-1 text-[15px] font-medium text-slate-800">{label}</span>
      <ChevronRight className="h-5 w-5 shrink-0 text-slate-400" />
    </Link>
  )
}

/** Fila de idioma: alterna ES/EN mostrando el idioma actual a la derecha. */
function LanguageRow() {
  const { t } = useTranslation('settings')
  const { i18n, t: tc } = useTranslation('common')
  const updateLanguage = useUpdateLanguage()
  const current = i18n.language.startsWith('es') ? 'es' : 'en'
  return (
    <button
      onClick={() => updateLanguage.mutate(current === 'es' ? 'en' : 'es')}
      className="flex w-full items-center gap-4 border-b border-slate-100 px-4 py-4 text-left transition-colors last:border-b-0 hover:bg-slate-50"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
        <Languages className="h-5 w-5" />
      </span>
      <span className="flex-1 text-[15px] font-medium text-slate-800">{t('language.title')}</span>
      <span className="text-sm font-medium text-slate-500">{tc(`language.${current}`)}</span>
    </button>
  )
}

/** Fila de acción: cerrar sesión. */
function LogoutRow() {
  const { t } = useTranslation('settings')
  const [busy, setBusy] = useState(false)

  async function handleLogout() {
    setBusy(true)
    await supabase.auth.signOut()
    // onAuthStateChange (en Auth) redirige al login.
  }

  return (
    <button
      onClick={handleLogout}
      disabled={busy}
      className="flex w-full items-center gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-4 text-left transition-colors hover:bg-slate-50 disabled:opacity-50"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-50 text-[#CB6391]">
        <LogOut className="h-5 w-5" />
      </span>
      <span className="flex-1 text-[15px] font-medium text-[#CB6391]">{t('menu.logout')}</span>
    </button>
  )
}

/** Fila de peligro: eliminar cuenta con doble confirmación. */
function DeleteAccountRow() {
  const { t } = useTranslation('settings')
  const navigate = useNavigate()
  // 0 = cerrado, 1 = primer aviso, 2 = confirmación escribiendo "delete".
  const [step, setStep] = useState(0)
  const [word, setWord] = useState('')
  const [deleting, setDeleting] = useState(false)

  const canDelete = word.trim().toLowerCase() === DELETE_WORD

  function close() {
    if (deleting) return
    setStep(0)
    setWord('')
  }

  async function handleDelete() {
    if (!canDelete) return
    setDeleting(true)
    try {
      const { error } = await supabase.functions.invoke('delete-account', { method: 'POST' })
      if (error) throw error
      await supabase.auth.signOut()
      navigate('/auth', { replace: true })
    } catch (err: any) {
      setDeleting(false)
      toast({ title: t('delete.error'), description: err?.message, variant: 'destructive' })
    }
  }

  return (
    <>
      <button
        onClick={() => setStep(1)}
        className="flex w-full items-center gap-4 rounded-2xl border border-rose-200 bg-white px-4 py-4 text-left transition-colors hover:bg-rose-50"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-600">
          <Trash2 className="h-5 w-5" />
        </span>
        <span className="flex-1 text-[15px] font-medium text-rose-600">{t('delete.title')}</span>
      </button>

      {/* Aviso 1: irreversibilidad */}
      <Dialog open={step === 1} onOpenChange={(o) => !o && close()}>
        <DialogContent className="rounded-2xl sm:rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-600">
              <AlertTriangle className="h-5 w-5" />
              {t('delete.warn1.title')}
            </DialogTitle>
            <DialogDescription>{t('delete.warn1.body')}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={close}>{t('delete.cancel')}</Button>
            <Button variant="destructive" onClick={() => setStep(2)}>{t('delete.continue')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Aviso 2: escribir "delete" para confirmar */}
      <Dialog open={step === 2} onOpenChange={(o) => !o && close()}>
        <DialogContent className="rounded-2xl sm:rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-600">
              <AlertTriangle className="h-5 w-5" />
              {t('delete.warn2.title')}
            </DialogTitle>
            <DialogDescription>{t('delete.warn2.body')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <p className="text-sm text-slate-600">
              {t('delete.warn2.prompt')}{' '}
              <span className="font-mono font-bold text-rose-600">{DELETE_WORD}</span>
            </p>
            <Input
              value={word}
              onChange={(e) => setWord(e.target.value)}
              placeholder={DELETE_WORD}
              autoComplete="off"
              className={cn('font-mono', canDelete && 'border-rose-400')}
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={close} disabled={deleting}>{t('delete.cancel')}</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={!canDelete || deleting}>
              {deleting ? t('delete.deleting') : t('delete.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
