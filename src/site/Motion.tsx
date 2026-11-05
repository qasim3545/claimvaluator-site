'use client'
import { useEffect } from 'react'

/**
 * The page's two moving parts, both skipped for people who ask for reduced motion:
 * sections ease in once as they scroll into view, and the hero's worked example tilts
 * with the pointer like a sheet of paper on a desk.
 */
export function Motion() {
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) return
    const root = document.documentElement
    root.classList.add('has-motion')

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add('is-in')
            io.unobserve(e.target)
          }
        }
      },
      { rootMargin: '0px 0px -8% 0px' },
    )
    document.querySelectorAll('[data-reveal]').forEach((el) => io.observe(el))

    const stage = document.querySelector<HTMLElement>('.stage')
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches
    let frame = 0
    const onMove = (ev: PointerEvent) => {
      if (!stage) return
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const r = stage.getBoundingClientRect()
        const x = (ev.clientX - (r.left + r.width / 2)) / r.width
        const y = (ev.clientY - (r.top + r.height / 2)) / r.height
        stage.style.setProperty('--tilt-y', `${(-12 + x * 10).toFixed(2)}deg`)
        stage.style.setProperty('--tilt-x', `${(6 - y * 8).toFixed(2)}deg`)
      })
    }
    const onLeave = () => {
      stage?.style.removeProperty('--tilt-y')
      stage?.style.removeProperty('--tilt-x')
    }
    const hero = stage?.closest('.hero')
    if (stage && hero && fine) {
      hero.addEventListener('pointermove', onMove as EventListener)
      hero.addEventListener('pointerleave', onLeave)
    }
    return () => {
      io.disconnect()
      cancelAnimationFrame(frame)
      hero?.removeEventListener('pointermove', onMove as EventListener)
      hero?.removeEventListener('pointerleave', onLeave)
    }
  }, [])
  return null
}
