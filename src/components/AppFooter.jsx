import React from 'react'
import { Heart } from 'lucide-react'
import { COPYRIGHT_HOLDER, COPYRIGHT_YEAR } from '../lib/branding'

/** Minimal site-wide footer: one row, copyright left, tagline right. */
export default function AppFooter() {
  return (
    <footer className="app-footer mt-auto border-t border-white/[0.08] bg-white/[0.04] py-4 backdrop-blur-sm sm:py-5">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col items-center justify-between gap-3 px-3 sm:flex-row sm:px-4 md:px-6">
        <p className="text-center text-[12px] text-slate-500 sm:text-left">
          © {COPYRIGHT_YEAR}{' '}
          <span className="font-semibold text-slate-400">{COPYRIGHT_HOLDER}</span>
          <span className="text-slate-600"> · </span>
          All rights reserved
        </p>
        {/* <p className="inline-flex items-center gap-1.5 text-[11px] text-slate-600">
          <Heart className="h-3.5 w-3.5 shrink-0 text-[#05924a]" strokeWidth={1.75} fill="none" aria-hidden />
          Crafted for higher education
        </p> */}
      </div>
    </footer>
  )
}
