import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Info } from 'lucide-react'

/**
 * Info icon with tooltip in a portal (fixed position) so parents with overflow:hidden / overflow-x-auto
 * do not clip. Works on touch: tap toggles; fine-pointer devices use hover.
 */
export default function InfoTip({ text, className = '', iconClassName = '' }) {
  const triggerRef = useRef(null)
  const bubbleRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [coords, setCoords] = useState({ top: -9999, left: 0, maxW: 320, placeAbove: true })
  const hideTimer = useRef(null)
  const [canHover, setCanHover] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)')
    const apply = () => setCanHover(mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

  useEffect(() => () => clearHideTimer(), [])

  const clearHideTimer = () => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current)
      hideTimer.current = null
    }
  }

  const scheduleHide = () => {
    clearHideTimer()
    hideTimer.current = window.setTimeout(() => setOpen(false), 200)
  }

  useLayoutEffect(() => {
    if (!open) return
    const el = triggerRef.current
    const bubble = bubbleRef.current
    if (!el) return

    const pad = 8
    const vw = window.innerWidth
    const vh = window.innerHeight
    const maxW = Math.min(360, Math.max(260, vw - pad * 2))

    const tr = el.getBoundingClientRect()
    let left = tr.left + tr.width / 2 - maxW / 2
    left = Math.max(pad, Math.min(left, vw - maxW - pad))

    const measureAndPlace = () => {
      const b = bubbleRef.current
      if (!b) {
        setCoords({ top: Math.max(pad, tr.top - 100), left, maxW, placeAbove: true })
        return
      }
      const bh = b.getBoundingClientRect().height
      let top = tr.top - bh - 8
      let placeAbove = true
      if (top < pad) {
        top = tr.bottom + 8
        placeAbove = false
      }
      if (top + bh > vh - pad) {
        top = Math.max(pad, vh - bh - pad)
      }
      setCoords({ top, left, maxW, placeAbove })
    }

    measureAndPlace()
    requestAnimationFrame(measureAndPlace)
  }, [open, text])

  useEffect(() => {
    if (!open) return
    const ro = () => {
      const el = triggerRef.current
      const bubble = bubbleRef.current
      if (!el) return
      const pad = 8
      const vw = window.innerWidth
      const vh = window.innerHeight
      const maxW = Math.min(360, Math.max(260, vw - pad * 2))
      const tr = el.getBoundingClientRect()
      let left = tr.left + tr.width / 2 - maxW / 2
      left = Math.max(pad, Math.min(left, vw - maxW - pad))
      if (!bubble) return
      const bh = bubble.getBoundingClientRect().height
      let top = tr.top - bh - 8
      let placeAbove = true
      if (top < pad) {
        top = tr.bottom + 8
        placeAbove = false
      }
      if (top + bh > vh - pad) top = Math.max(pad, vh - bh - pad)
      setCoords({ top, left, maxW, placeAbove })
    }
    window.addEventListener('scroll', ro, true)
    window.addEventListener('resize', ro)
    return () => {
      window.removeEventListener('scroll', ro, true)
      window.removeEventListener('resize', ro)
    }
  }, [open])

  useEffect(() => {
    if (!open || canHover) return
    const onDoc = (e) => {
      if (triggerRef.current?.contains(e.target)) return
      if (bubbleRef.current?.contains(e.target)) return
      setOpen(false)
    }
    document.addEventListener('pointerdown', onDoc, true)
    return () => document.removeEventListener('pointerdown', onDoc, true)
  }, [open, canHover])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  if (!text) return null

  /** Only add a scroll container for very long copy; short glossary blurbs stay one box with no scrollbar. */
  const scrollIfNeeded = text.length > 480

  const onEnter = () => {
    if (!canHover) return
    clearHideTimer()
    setOpen(true)
  }

  const onLeave = () => {
    if (!canHover) return
    scheduleHide()
  }

  const bubble = open && (
    <div
      ref={bubbleRef}
      role="tooltip"
      className={`fixed z-[99999] box-border rounded-xl border border-slate-600 bg-slate-800 px-3.5 py-3 text-left text-xs leading-relaxed text-slate-100 shadow-2xl sm:px-4 sm:text-[13px] sm:leading-snug ${
        scrollIfNeeded
          ? 'max-h-[min(50vh,22rem)] overflow-y-auto overscroll-contain [scrollbar-width:thin]'
          : 'max-h-none overflow-visible'
      } ${canHover ? 'pointer-events-none' : scrollIfNeeded ? 'pointer-events-auto touch-pan-y' : 'pointer-events-auto'}`}
      style={{
        top: coords.top,
        left: coords.left,
        width: coords.maxW,
        maxWidth: coords.maxW,
        minWidth: Math.min(260, typeof window !== 'undefined' ? window.innerWidth - 16 : 260),
      }}
    >
      <p className="normal-case [text-wrap:pretty]">{text}</p>
      <span
        className={`pointer-events-none absolute h-0 w-0 border-8 border-transparent ${
          coords.placeAbove ? 'top-full left-1/2 -translate-x-1/2 border-t-slate-800' : 'bottom-full left-1/2 -translate-x-1/2 border-b-slate-800'
        }`}
        aria-hidden
      />
    </div>
  )

  return (
    <>
      <span
        ref={triggerRef}
        className={`relative inline-flex items-center align-middle ${className}`}
        onMouseEnter={onEnter}
        onMouseLeave={onLeave}
      >
        <button
          type="button"
          className="inline-flex touch-manipulation rounded p-0.5 text-slate-500 transition-colors hover:text-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/60"
          aria-label="More info"
          onClick={(e) => {
            e.stopPropagation()
            if (canHover) return
            e.preventDefault()
            setOpen((o) => !o)
          }}
        >
          <Info className={`h-3.5 w-3.5 shrink-0 cursor-help ${iconClassName}`} />
        </button>
      </span>
      {typeof document !== 'undefined' && bubble ? createPortal(bubble, document.body) : null}
    </>
  )
}
