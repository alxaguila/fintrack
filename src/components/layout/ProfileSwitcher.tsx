import { useState } from 'react'
import { Check, ChevronDown, Plus, User } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useProfile } from '@/contexts/ProfileContext'
import { useProfiles, useCreateProfile } from '@/hooks/useProfiles'
import { useLimitGate } from '@/hooks/usePlan'
import { LimitReachedDialog } from '@/components/plan/LimitReachedDialog'
import { cn } from '@/lib/utils'
import { profileNameSchema, firstError, LIMITS } from '@/lib/validation'
import { toast } from '@/hooks/useToast'
import type { FinancialProfile } from '@/lib/database.types'

function ProfileAvatar({ profile, size = 'sm' }: { profile: FinancialProfile; size?: 'sm' | 'md' }) {
  const sz = size === 'sm' ? 'h-7 w-7 text-xs' : 'h-9 w-9 text-sm'
  return (
    <span
      className={cn('inline-flex items-center justify-center rounded-full font-semibold text-white shrink-0', sz)}
      style={{ backgroundColor: profile.avatar_color }}
    >
      {profile.name.charAt(0).toUpperCase()}
    </span>
  )
}

export function ProfileSwitcher() {
  const { t } = useTranslation('common')
  const { activeProfile, setActiveProfile } = useProfile()
  const { data: profiles = [] } = useProfiles()
  const createProfile = useCreateProfile()
  const profilesLimit = useLimitGate('profiles')
  const [open, setOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [showLimitDialog, setShowLimitDialog] = useState(false)

  async function handleCreate() {
    const name = newName.trim()
    if (!name) return
    if (profilesLimit.limited) {
      setOpen(false)
      setShowLimitDialog(true)
      return
    }
    // Validación (defensa en profundidad): longitud del nombre de perfil.
    if (firstError(profileNameSchema.safeParse(name))) {
      toast({ variant: 'destructive', title: t('errors.invalid_input') })
      return
    }
    const colors = ['#6366f1','#8b5cf6','#ec4899','#f97316','#22c55e','#06b6d4']
    const color = colors[profiles.length % colors.length]
    const result = await createProfile.mutateAsync({
      name,
      avatar_color: color,
      is_default: profiles.length === 0,
    })
    setActiveProfile(result as FinancialProfile)
    setNewName('')
    setCreating(false)
    setOpen(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-center gap-2 rounded-lg bg-slate-800 px-3 py-2 text-sm hover:bg-slate-700 transition-colors"
      >
        {activeProfile
          ? <ProfileAvatar profile={activeProfile} />
          : <User className="h-7 w-7 text-slate-400" />
        }
        <span className="flex-1 truncate text-left text-slate-200 font-medium">
          {activeProfile?.name ?? t('profile.select')}
        </span>
        <ChevronDown className={cn('h-4 w-4 text-slate-400 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-lg border border-slate-700 bg-slate-800 py-1 shadow-xl">
          {profiles.map(p => (
            <button
              key={p.id}
              onClick={() => { setActiveProfile(p); setOpen(false) }}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-200 hover:bg-slate-700"
            >
              <ProfileAvatar profile={p} />
              <span className="flex-1 truncate text-left">{p.name}</span>
              {activeProfile?.id === p.id && <Check className="h-4 w-4 text-indigo-400" />}
            </button>
          ))}

          {creating ? (
            <div className="px-3 py-2 flex gap-2">
              <input
                autoFocus
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
                placeholder={t('profile.new')}
                maxLength={LIMITS.profileName}
                className="flex-1 rounded bg-slate-700 px-2 py-1 text-xs text-white placeholder:text-slate-400 outline-none"
              />
              <button onClick={handleCreate} className="text-xs text-indigo-400 hover:text-indigo-300">OK</button>
            </div>
          ) : (
            <button
              onClick={() => setCreating(true)}
              className="flex w-full items-center gap-2 px-3 py-2 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-700"
            >
              <Plus className="h-3 w-3" />
              {t('profile.new')}
            </button>
          )}
        </div>
      )}

      {profilesLimit.limit != null && (
        <LimitReachedDialog
          open={showLimitDialog}
          onOpenChange={setShowLimitDialog}
          dimension="profiles"
          plan={profilesLimit.plan!}
          limit={profilesLimit.limit}
        />
      )}
    </div>
  )
}
