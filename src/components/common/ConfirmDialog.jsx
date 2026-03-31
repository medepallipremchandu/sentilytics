import React from 'react'
import Modal from './Modal'

export default function ConfirmDialog({ open, title, message, onCancel, onConfirm, confirmLabel = 'Confirm' }) {
  return (
    <Modal
      open={open}
      title={title}
      onClose={onCancel}
      footer={
        <div className="flex justify-end gap-2">
          <button className="rounded-lg bg-slate-700 px-4 py-2" onClick={onCancel}>Cancel</button>
          <button className="rounded-lg bg-red-600 px-4 py-2" onClick={onConfirm}>{confirmLabel}</button>
        </div>
      }
    >
      <p className="text-sm text-slate-300">{message}</p>
    </Modal>
  )
}
