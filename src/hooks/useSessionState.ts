import { useState } from 'react'

/**
 * Como useState, pero persiste en sessionStorage (sobrevive a recargar la
 * pestaña, se pierde al cerrarla). Falla en silencio si sessionStorage no
 * está disponible o el valor guardado no es JSON válido.
 */
export function useSessionState<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = sessionStorage.getItem(key)
      return raw != null ? (JSON.parse(raw) as T) : initialValue
    } catch {
      return initialValue
    }
  })

  function set(next: T | ((prev: T) => T)) {
    setValue(prev => {
      const resolved = typeof next === 'function' ? (next as (prev: T) => T)(prev) : next
      try {
        sessionStorage.setItem(key, JSON.stringify(resolved))
      } catch {
        // sessionStorage no disponible (modo privado, cuota, etc.): se ignora.
      }
      return resolved
    })
  }

  return [value, set] as const
}
