import React from 'react'
import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react'

const styles = {
  success: { icon: CheckCircle2, tone: 'border-emerald-500/50 bg-emerald-950/80' },
  error: { icon: XCircle, tone: 'border-red-500/50 bg-red-950/80' },
  warning: { icon: AlertTriangle, tone: 'border-amber-500/50 bg-amber-950/80' },
  info: { icon: Info, tone: 'border-blue-500/50 bg-blue-950/80' },
}

export default function ToastContainer({ toasts, onDismiss }) {
  return (
    <div className="fixed right-4 top-4 z-[70] flex w-[360px] max-w-[calc(100vw-2rem)] flex-col gap-2">
      {toasts.map((toast) => {
        const config = styles[toast.type] || styles.info
        const Icon = config.icon
        return (
          <div key={toast.id} className={`rounded-xl border px-3 py-3 shadow-lg backdrop-blur ${config.tone}`}>
            <div className="flex items-start gap-2">
              <Icon className="mt-0.5 h-4 w-4 shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-white">{toast.message}</p>
              </div>
              <button className="text-xs text-slate-300 hover:text-white" onClick={() => onDismiss(toast.id)}>Close</button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
