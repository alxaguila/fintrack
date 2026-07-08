import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  format, parseISO, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameDay, isSameMonth, isToday, addMonths, addDays,
} from 'date-fns'
import { es, enUS } from 'date-fns/locale'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

interface DatePickerFieldProps {
  value?: string                             // 'yyyy-MM-dd'
  onChange: (value: string | undefined) => void
  placeholder: string
  className?: string
}

/**
 * Campo de fecha con calendario propio (Popover + date-fns), con la paleta y
 * estilos de la app. El label va dentro como placeholder atenuado y el icono
 * de calendario a la derecha.
 */
export function DatePickerField({ value, onChange, placeholder, className }: DatePickerFieldProps) {
  const { t, i18n } = useTranslation('common')
  const locale = i18n.language.startsWith('es') ? es : enUS
  const selected = value ? parseISO(value) : undefined
  const [open, setOpen] = useState(false)
  const [month, setMonth] = useState<Date>(selected ?? new Date())

  const gridStart = startOfWeek(startOfMonth(month), { weekStartsOn: 1 })
  const gridEnd = endOfWeek(endOfMonth(month), { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd })
  const weekdays = Array.from({ length: 7 }).map((_, i) => format(addDays(gridStart, i), 'EEEEEE', { locale }))

  function pick(day: Date) {
    onChange(format(day, 'yyyy-MM-dd'))
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={o => { setOpen(o); if (o) setMonth(selected ?? new Date()) }}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'flex h-9 w-full items-center justify-between gap-2 rounded-md border border-input bg-card px-3 py-2 text-sm shadow-sm transition-colors hover:bg-muted/40 focus:outline-none focus:ring-1 focus:ring-ring',
            className,
          )}
        >
          <span className={cn('truncate', !selected && 'text-muted-foreground')}>
            {selected ? format(selected, 'dd/MM/yyyy') : placeholder}
          </span>
          <CalendarIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[272px]">
        {/* Cabecera de mes */}
        <div className="mb-2 flex items-center justify-between">
          <button type="button" onClick={() => setMonth(m => addMonths(m, -1))} className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-semibold capitalize">{format(month, 'LLLL yyyy', { locale })}</span>
          <button type="button" onClick={() => setMonth(m => addMonths(m, 1))} className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        {/* Rejilla de días (cabecera de semana + días del mes) */}
        <div className="grid grid-cols-7 justify-items-center gap-0.5">
          {weekdays.map((d, i) => (
            <div key={i} className="py-1 text-center text-[11px] font-medium uppercase text-muted-foreground">{d}</div>
          ))}
          {days.map(day => {
            const isSel = !!selected && isSameDay(day, selected)
            const inMonth = isSameMonth(day, month)
            return (
              <button
                key={day.toISOString()}
                type="button"
                onClick={() => pick(day)}
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full text-sm transition-colors',
                  !inMonth && 'text-muted-foreground/40',
                  isSel ? 'bg-primary font-semibold text-primary-foreground' : 'hover:bg-muted',
                  !isSel && inMonth && isToday(day) && 'ring-1 ring-primary/40',
                )}
              >
                {format(day, 'd')}
              </button>
            )
          })}
        </div>
        {/* Pie: borrar la fecha */}
        {selected && (
          <div className="mt-2 flex justify-end border-t pt-2">
            <button
              type="button"
              onClick={() => { onChange(undefined); setOpen(false) }}
              className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
            >
              {t('actions.clear')}
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
