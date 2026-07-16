import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Lightbulb, Frown, Bug, MessageSquare, MailOpen } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useAdminFeedback, useMarkFeedbackRead } from '@/hooks/useAdminFeedback'
import type { Feedback, FeedbackType } from '@/lib/database.types'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { AdminHeader } from './AdminHeader'

/** Icono + color de marca por tipo de feedback (paleta teal / rosa / gris). */
const TYPE_STYLE: Record<FeedbackType, { icon: LucideIcon; color: string }> = {
  suggestion: { icon: Lightbulb, color: '#14B8A6' },
  complaint: { icon: Frown, color: '#CB6391' },
  bug: { icon: Bug, color: '#CB6391' },
  other: { icon: MessageSquare, color: '#64748b' },
}

function stamp(iso: string, locale: string, withTime = false) {
  return new Date(iso).toLocaleString(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  })
}

export default function AdminFeedback() {
  const { t, i18n } = useTranslation('admin')
  const { t: tc } = useTranslation('common')
  const { data: items = [], isLoading } = useAdminFeedback()
  const markM = useMarkFeedbackRead()

  const [selectedId, setSelectedId] = useState<string | null>(null)
  // Se deriva de la lista (y no se guarda la fila) para que el diálogo refleje
  // el estado de leído en cuanto la mutación invalida la query.
  const selected = items.find((f) => f.id === selectedId) ?? null
  const unread = items.filter((f) => !f.read_at).length

  function open(fb: Feedback) {
    setSelectedId(fb.id)
    if (!fb.read_at) markM.mutate({ id: fb.id, read: true })
  }

  return (
    <div className="mx-auto max-w-2xl p-6 space-y-6">
      <AdminHeader title={t('feedback.title')} />

      {isLoading ? (
        <p className="text-sm text-slate-500">{tc('actions.loading')}</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-slate-500">{t('feedback.empty')}</p>
      ) : (
        <>
          <p className="text-sm text-slate-500">{t('feedback.unread_count', { count: unread })}</p>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            {items.map((f) => {
              const { icon: Icon, color } = TYPE_STYLE[f.type]
              const isUnread = !f.read_at
              return (
                <button
                  key={f.id}
                  onClick={() => open(f)}
                  className="flex w-full items-center gap-3 border-b border-slate-100 px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-slate-50"
                >
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                    style={{ backgroundColor: `${color}1f`, color }}
                  >
                    <Icon className="h-4 w-4" />
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {isUnread && <span className="h-2 w-2 shrink-0 rounded-full bg-red-500" />}
                      <span
                        className="shrink-0 rounded-full px-2 py-0.5 text-xs font-medium"
                        style={{ backgroundColor: `${color}1f`, color }}
                      >
                        {t(`feedback.types.${f.type}`)}
                      </span>
                      <span className="truncate text-xs text-slate-500">{f.email ?? t('feedback.no_email')}</span>
                    </div>
                    <p className={`truncate text-sm ${isUnread ? 'font-semibold text-slate-900' : 'text-slate-600'}`}>
                      {f.message}
                    </p>
                  </div>

                  <span className="shrink-0 text-xs text-slate-400">{stamp(f.created_at, i18n.language)}</span>
                </button>
              )
            })}
          </div>
        </>
      )}

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelectedId(null)}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:rounded-2xl">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>{t(`feedback.types.${selected.type}`)}</DialogTitle>
                <DialogDescription>
                  {stamp(selected.created_at, i18n.language, true)}
                  {selected.app_version ? ` · ${selected.app_version}` : ''}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <p className="text-xs text-slate-500">{t('feedback.from')}</p>
                  <p className="break-words text-sm font-medium">{selected.email ?? t('feedback.no_email')}</p>
                </div>

                <div className="-mx-6 w-auto border-t border-slate-300" />

                <p className="whitespace-pre-wrap break-words text-sm text-slate-700">{selected.message}</p>
              </div>

              <DialogFooter className="flex-col gap-2 sm:flex-row">
                <Button
                  variant="outline"
                  disabled={markM.isPending}
                  onClick={() => {
                    markM.mutate({ id: selected.id, read: false })
                    setSelectedId(null)
                  }}
                >
                  <MailOpen className="h-4 w-4" /> {t('feedback.mark_unread')}
                </Button>
                <Button onClick={() => setSelectedId(null)}>{tc('actions.close')}</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
