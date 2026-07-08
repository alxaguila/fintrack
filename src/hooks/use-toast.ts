// Minimal toast implementation (no external deps beyond Radix)
import { useState, useCallback } from 'react'

export interface ToastMessage {
  id: string
  title?: string
  description?: string
  variant?: 'default' | 'destructive'
  action?: React.ReactElement
  duration?: number
}

let listeners: Array<(toasts: ToastMessage[]) => void> = []
let memToasts: ToastMessage[] = []

function dispatch(toasts: ToastMessage[]) {
  memToasts = toasts
  listeners.forEach(l => l(toasts))
}

export function toast(message: Omit<ToastMessage, 'id'>) {
  const id = Math.random().toString(36).slice(2)
  const t: ToastMessage = { ...message, id }
  dispatch([...memToasts, t])
  setTimeout(() => {
    dispatch(memToasts.filter(x => x.id !== id))
  }, message.duration ?? 4000)
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>(memToasts)
  const cb = useCallback((t: ToastMessage[]) => setToasts(t), [])
  // Subscribe on first render, unsubscribe on unmount
  if (!listeners.includes(cb)) listeners.push(cb)
  return {
    toasts,
    toast,
    dismiss: (id: string) => dispatch(memToasts.filter(x => x.id !== id)),
  }
}
