'use client'

import { useEffect } from 'react'

/**
 * Loads the calculator engine after React has hydrated the page, so the engine's DOM
 * updates never collide with hydration.
 */
export function EngineLoader() {
  useEffect(() => {
    const w = window as unknown as { CVEngine?: { boot: () => void }; __cvLoading?: boolean }
    if (w.CVEngine) {
      w.CVEngine.boot()
      return
    }
    if (w.__cvLoading) return
    w.__cvLoading = true
    const add = (src: string, onload?: () => void) => {
      const s = document.createElement('script')
      s.src = src
      s.async = false
      if (onload) s.onload = onload
      document.body.appendChild(s)
    }
    add('/js/engine.min.js')
    add('/js/cv-enhance.js')
  }, [])
  return null
}
