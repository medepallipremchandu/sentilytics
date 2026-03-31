import React, { useState } from 'react'
import Modal from '../common/Modal'

export default function PermissionModal({ open, onClose, onSave }) {
  const [form, setForm] = useState({ key: '', label: '', description: '', tab_key: '' })

  const save = () => {
    onSave({ ...form, description: form.description || null, tab_key: form.tab_key || null })
    setForm({ key: '', label: '', description: '', tab_key: '' })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add Permission"
      footer={
        <div className="flex justify-end gap-2">
          <button className="px-4 py-2 rounded-lg bg-slate-700" onClick={onClose}>Cancel</button>
          <button className="px-4 py-2 rounded-lg bg-violet-600" onClick={save}>Add Permission</button>
        </div>
      }
    >
      <div className="grid gap-3">
        <input className="rounded-lg bg-slate-800 p-3" placeholder="Permission key (e.g. users.manage)" value={form.key} onChange={(e) => setForm({ ...form, key: e.target.value })} />
        <input className="rounded-lg bg-slate-800 p-3" placeholder="Label" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
        <textarea className="rounded-lg bg-slate-800 p-3 min-h-24" placeholder="Detailed description (what this permission allows)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <input className="rounded-lg bg-slate-800 p-3" placeholder="Tab key (optional)" value={form.tab_key} onChange={(e) => setForm({ ...form, tab_key: e.target.value })} />
      </div>
    </Modal>
  )
}
