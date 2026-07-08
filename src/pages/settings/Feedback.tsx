import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'
import { APP_VERSION } from '@/lib/version'
import type { FeedbackType } from '@/lib/database.types'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { toast } from '@/hooks/useToast'
import { SettingsHeader } from './SettingsHeader'

const TYPES: FeedbackType[] = ['suggestion', 'complaint', 'bug', 'other']
const MAX = 4000

export default function SettingsFeedback() {
  const { t } = useTranslation('settings')
  const [type, setType] = useState<FeedbackType>('suggestion')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = message.trim()
    if (!trimmed) return
    setSending(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { error } = await supabase.from('feedback').insert({
        user_id: user?.id ?? null,
        email: user?.email ?? null,
        type,
        message: trimmed.slice(0, MAX),
        app_version: APP_VERSION,
      })
      if (error) throw error
      setMessage('')
      setType('suggestion')
      toast({ title: t('feedback.sent'), variant: 'success' })
    } catch (err: any) {
      toast({ title: t('feedback.error'), description: err?.message, variant: 'destructive' })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl p-6 space-y-6">
      <SettingsHeader title={t('feedback.title')} />

      <Card className="rounded-2xl">
        <CardContent className="pt-6">
          <p className="mb-4 text-sm text-muted-foreground">{t('feedback.description')}</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>{t('feedback.type')}</Label>
              <Select value={type} onValueChange={(v) => setType(v as FeedbackType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TYPES.map((ty) => (
                    <SelectItem key={ty} value={ty}>{t(`feedback.types.${ty}`)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fb-message">{t('feedback.message')}</Label>
              <Textarea
                id="fb-message"
                value={message}
                onChange={(e) => setMessage(e.target.value.slice(0, MAX))}
                placeholder={t('feedback.message_placeholder')}
                rows={6}
                maxLength={MAX}
                className="resize-y"
              />
              <p className="text-right text-xs text-muted-foreground">{message.length}/{MAX}</p>
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={sending || !message.trim()}>
                {sending ? t('feedback.sending') : t('feedback.submit')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
