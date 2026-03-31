import React, { useEffect, useState } from 'react'
import Modal from '../common/Modal'

export default function UserModal({ open, onClose, onSave, roles, initialValue }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', role_ids: [], is_active: true })

  useEffect(() => {
    if (!initialValue) {
      setForm({ name: '', email: '', password: '', role_ids: [], is_active: true })
      return
    }
    setForm({
      name: initialValue.name,
      email: initialValue.email,
      password: '',
      role_ids: (initialValue.roles || []).map((r) => r.id),
      is_active: initialValue.active,
    })
  }, [initialValue, open])

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initialValue ? 'Edit User' : 'Create User'}
      footer={
        <div className="flex justify-end gap-2">
          <button className="px-4 py-2 rounded-lg bg-slate-700" onClick={onClose}>Cancel</button>
          <button className="px-4 py-2 rounded-lg bg-violet-600" onClick={() => onSave(form)}>{initialValue ? 'Save Changes' : 'Create User'}</button>
        </div>
      }
    >
      <div className="grid gap-3">
        <input className="rounded-lg bg-slate-800 p-3" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input className="rounded-lg bg-slate-800 p-3" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input className="rounded-lg bg-slate-800 p-3" type="password" placeholder={initialValue ? 'Leave blank to keep password' : 'Password'} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <div className="rounded-lg bg-slate-800 p-3">
          <p className="text-sm mb-2 text-slate-300">Roles</p>
          <div className="grid sm:grid-cols-2 gap-2">
            {roles.map((role) => {
              const checked = form.role_ids.includes(role.id)
              return (
                <label key={role.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => setForm({
                      ...form,
                      role_ids: e.target.checked
                        ? [...form.role_ids, role.id]
                        : form.role_ids.filter((id) => id !== role.id),
                    })}
                  />
                  <span>{role.name}</span>
                </label>
              )
            })}
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
          Active user
        </label>
      </div>
    </Modal>
  )
}
