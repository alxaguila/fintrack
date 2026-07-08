import { useState, useCallback } from 'react'

type ToastVariant = 'default' | 'destructive' | 'success'

interface ToastItem {
  id: string
  title?: string
  description?: string
  variant?: ToastVariant
  duration?: number
}

let toastQueue: ToastItem[] = []
let listeners: Array<(toasts: ToastItem[]) => void> = []

function notify() {
  listeners.forEach(l => l([...toastQueue]))
}

export function toast(item: Omit<ToastItem, 'id'>) {
  const id = Math.random().toString(36).slice(2)
  const duration = item.duration ?? 4000
  toastQueue.push({ ...item, id })
  notify()
  setTimeout(() => {
    toastQueue = toastQueue.filter(t => t.id !== id)
    notify()
  }, duration)
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([...toastQueue])

  // Suscribirse a cambios
  const subscribe = useCallback(() => {
    const handler = (t: ToastItem[]) => setToasts(t)
    listeners.push(handler)
    return () => { listeners = listeners.filter(l => l !== handler) }
  }, [])

  // Auto-suscripción en mount
  useState(() => { const unsub = subscribe(); return unsub })

  return { toasts, toast }
}
