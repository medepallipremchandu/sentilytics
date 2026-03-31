import React, { useEffect, useState } from 'react'
import Modal from '../common/Modal'

export default function RoleModal({ open, onClose, onSave, permissions, initialValue }) {
  const [form, setForm] = useState({ name: '', description: '', permission_ids: [] })

  useEffect(() => {
    if (!initialValue) {
      setForm({ name: '', description: '', permission_ids: [] })
      return
    }
    setForm({
      name: initialValue.name,
      description: initialValue.description || '',
      permission_ids: (initialValue.permissions || []).map((p) => p.id),
    })
  }, [initialValue, open])

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initialValue ? 'Edit Role' : 'Create Role'}
      footer={
        <div className="flex justify-end gap-2">
          <button className="px-4 py-2 rounded-lg bg-slate-700" onClick={onClose}>Cancel</button>
          <button className="px-4 py-2 rounded-lg bg-violet-600" onClick={() => onSave(form)}>{initialValue ? 'Save Changes' : 'Create Role'}</button>
        </div>
      }
    >
      <div className="grid gap-3">
        <input className="rounded-lg bg-slate-800 p-3" placeholder="Role name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input className="rounded-lg bg-slate-800 p-3" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <div className="rounded-lg bg-slate-800 p-3">
          <p className="text-sm mb-2 text-slate-300">Permissions</p>
          <div className="grid sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-2">
            {permissions.map((perm) => {
              const checked = form.permission_ids.includes(perm.id)
              return (
                <label key={perm.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => setForm({
                      ...form,
                      permission_ids: e.target.checked
                        ? [...form.permission_ids, perm.id]
                        : form.permission_ids.filter((id) => id !== perm.id),
                    })}
                  />
                  <span>{perm.key}</span>
                </label>
              )
            })}
          </div>
        </div>
      </div>
    </Modal>
  )
}
