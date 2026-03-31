import React from 'react'

export default function Modal({
  open,
  title,
  onClose,
  children,
  footer,
  showHeader = true,
  containerClassName = '',
  panelClassName = '',
  bodyClassName = '',
}) {
  if (!open) return null
  return (
    <div className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-1 ${containerClassName}`}>
      <div className={`relative w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl max-h-[calc(100vh-20px)] flex flex-col ${panelClassName}`}>
        {showHeader && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
            <h3 className="font-semibold text-lg">{title}</h3>
            <button className="text-slate-300 hover:text-white" onClick={onClose}>✕</button>
          </div>
        )}
        {!showHeader && (
          <button className="absolute right-3 top-3 z-10 text-slate-300 hover:text-white" onClick={onClose}>✕</button>
        )}
        <div className={`p-5 overflow-y-auto min-h-0 ${bodyClassName}`}>{children}</div>
        {footer && <div className="px-5 py-4 border-t border-slate-700">{footer}</div>}
      </div>
    </div>
  )
}
