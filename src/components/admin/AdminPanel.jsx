import React, { useState } from 'react'
import { BookOpen, ShieldCheck } from 'lucide-react'
import UserModal from './UserModal'
import RoleModal from './RoleModal'
import PermissionModal from './PermissionModal'
import ConfirmDialog from '../common/ConfirmDialog'
import AdminTable from './AdminTable'
import Modal from '../common/Modal'

export default function AdminPanel({
  roles,
  permissions,
  users,
  pager,
  onSearchUsers,
  onPageUsers,
  onPageSizeUsers,
  onCreateUser,
  onUpdateUser,
  onDeleteUser,
  onCreateRole,
  onUpdateRole,
  onDeleteRole,
  onCreatePermission,
  onNotify,
}) {
  const [roleModal, setRoleModal] = useState({ open: false, editing: null })
  const [userModal, setUserModal] = useState({ open: false, editing: null })
  const [permissionOpen, setPermissionOpen] = useState(false)
  const [confirmDeactivate, setConfirmDeactivate] = useState({ open: false, user: null })
  const [search, setSearch] = useState(pager.search || '')
  const [adminTab, setAdminTab] = useState('users')
  const [rolePage, setRolePage] = useState(1)
  const [permissionPage, setPermissionPage] = useState(1)
  const [rolePageSize, setRolePageSize] = useState(10)
  const [permissionPageSize, setPermissionPageSize] = useState(10)
  const [permissionHelpOpen, setPermissionHelpOpen] = useState(false)
  const [confirmDeleteRole, setConfirmDeleteRole] = useState({ open: false, role: null })
  const [confirmDeleteUser, setConfirmDeleteUser] = useState({ open: false, user: null })
  const pageSizes = [10, 25, 50, 75, 100]
  const permissionGuide = [
    { key: 'system.superadmin', enabled: 'Full unrestricted access to all protected areas.', disabled: 'User can only access what explicit permissions allow.' },
    { key: 'dashboard.view', enabled: 'Dashboard tab and dashboard summary data are visible.', disabled: 'Dashboard tab is hidden and summary endpoints are blocked.' },
    { key: 'users.view', enabled: 'Can view users list in Admin.', disabled: 'Users tab data is not available.' },
    { key: 'users.manage', enabled: 'Can create/edit/activate/deactivate users.', disabled: 'User management actions are blocked.' },
    { key: 'users.delete', enabled: 'Can permanently delete users.', disabled: 'User delete action is blocked.' },
    { key: 'roles.view', enabled: 'Can view role list and role details.', disabled: 'Roles data is not shown.' },
    { key: 'roles.manage', enabled: 'Can create/update roles and assign permissions to roles.', disabled: 'Role create/edit operations are blocked.' },
    { key: 'roles.delete', enabled: 'Can permanently delete roles.', disabled: 'Role delete action is blocked.' },
    { key: 'permissions.view', enabled: 'Can view permission catalog.', disabled: 'Permission list is hidden.' },
    { key: 'permissions.manage', enabled: 'Can add new permission entries.', disabled: 'Cannot create new permissions.' },
    { key: 'feedback.create', enabled: 'Can submit feedback (text/audio).', disabled: 'Submit feature is blocked.' },
    { key: 'feedback.read_own', enabled: 'Can view personal feedback history.', disabled: 'My Feedback list is unavailable.' },
    { key: 'feedbackboard.naturallanguagesearch', enabled: 'Can use AI natural language search in My Feedback and Feedback Board to auto-apply filters.', disabled: 'AI search box is hidden and endpoint is blocked.' },
    { key: 'feedback.submitter.view', enabled: 'Can see the submitter name beside the date on feedback cards.', disabled: 'Submitter name is hidden.' },
    { key: 'feedback.read_all', enabled: 'Can view all feedback board records.', disabled: 'Cannot access global feedback board.' },
    { key: 'feedback.read_assigned', enabled: 'Can view assigned feedback scope (role-based).', disabled: 'Assigned-only visibility is unavailable.' },
    { key: 'feedback.update', enabled: 'Can update status (in progress/completed).', disabled: 'Status update buttons are hidden/blocked.' },
    { key: 'feedback.assign', enabled: 'Can assign feedback ownership.', disabled: 'Assignment operations are blocked.' },
    { key: 'feedback.analysis.view', enabled: 'Can open View Analysis and inspect analysis tabs.', disabled: 'Analysis modal/details are hidden.' },
    { key: 'feedback.transcript.original.view', enabled: 'Can view original transcript text in analysis.', disabled: 'Only redacted transcript is shown.' },
    { key: 'feedback.sensitive.view', enabled: 'Can view sensitive/original message content.', disabled: 'Sensitive content remains masked/redacted.' },
    { key: 'feedback.sensitive.mask', enabled: 'Sensitive analysis/transcript/content is redacted in UI.', disabled: 'Original sensitive content is shown in UI.' },
    { key: 'feedback.audio.download', enabled: 'Can download the original audio file from the Audio Signal tab.', disabled: 'Download is hidden; the download endpoint returns 403.' },
    { key: 'ai.cost.view', enabled: 'Can view AI/Whisper/GPT cost metrics.', disabled: 'Cost metrics are hidden from cards/dashboard.' },
  ]

  const roleColumns = [
    { key: 'name', label: 'Role' },
    { key: 'description', label: 'Description', render: (row) => row.description || '-' },
    { key: 'permissions', label: 'Permissions', render: (row) => row.permissions.length },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex gap-2">
          <button className="rounded bg-slate-700 px-2 py-1 text-xs text-white" onClick={() => setRoleModal({ open: true, editing: row })}>Edit</button>
          <button className="rounded bg-red-700 px-2 py-1 text-xs text-white" onClick={() => setConfirmDeleteRole({ open: true, role: row })}>Delete</button>
        </div>
      ),
    },
  ]

  const permissionColumns = [
    { key: 'key', label: 'Key' },
    { key: 'label', label: 'Label' },
    { key: 'description', label: 'Description', render: (row) => row.description || '-' },
    { key: 'tab_key', label: 'Tab', render: (row) => row.tab_key || '-' },
  ]

  const userColumns = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'roles', label: 'Roles', render: (row) => (row.roles || []).map((r) => r.name).join(', ') || 'No roles' },
    { key: 'active', label: 'Status', render: (row) => (row.active ? 'Active' : 'Inactive') },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex gap-2">
          <button className="rounded bg-slate-700 px-2 py-1 text-xs text-white" onClick={() => setUserModal({ open: true, editing: row })}>Edit</button>
          {row.active ? (
            <button className="rounded bg-red-700 px-2 py-1 text-xs text-white" onClick={() => setConfirmDeactivate({ open: true, user: row })}>Deactivate</button>
          ) : (
            <button className="rounded bg-emerald-700 px-2 py-1 text-xs text-white" onClick={() => onUpdateUser(row.id, { is_active: true })}>Activate</button>
          )}
          <button className="rounded bg-red-800 px-2 py-1 text-xs text-white" onClick={() => setConfirmDeleteUser({ open: true, user: row })}>Delete</button>
        </div>
      ),
    },
  ]

  const roleStart = (rolePage - 1) * rolePageSize
  const permissionStart = (permissionPage - 1) * permissionPageSize
  const pagedRoles = roles.slice(roleStart, roleStart + rolePageSize)
  const pagedPermissions = permissions.slice(permissionStart, permissionStart + permissionPageSize)

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 space-y-4">
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3">
        {[
          { key: 'users', label: 'Users' },
          { key: 'roles', label: 'Roles' },
          { key: 'permissions', label: 'Permissions' },
        ].map((tab) => (
          <button
            key={tab.key}
            className={`rounded-lg border px-3 py-1.5 text-sm ${adminTab === tab.key ? 'border-violet-400/40 bg-violet-500/10 text-violet-200' : 'border-slate-700 bg-slate-900 text-slate-300'}`}
            onClick={() => setAdminTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {adminTab === 'users' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Users</h3>
            <button className="rounded-lg bg-violet-600 px-3 py-1 text-sm" onClick={() => setUserModal({ open: true, editing: null })}>+ User</button>
          </div>
          <div className="flex gap-2">
            <input
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-200 placeholder:text-slate-400"
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button className="rounded-lg bg-slate-700 px-3" onClick={() => onSearchUsers(search)}>Go</button>
          </div>
          <AdminTable columns={userColumns} rows={users} emptyText="No users found." />
          <div className="flex items-center justify-between text-xs gap-3">
            <span>Total: {pager.total}</span>
            <div className="flex items-center gap-2">
              <span>Per page</span>
              <select
                className="rounded bg-slate-900 border border-slate-700 px-2 py-1 [&>option]:text-slate-900 [&>option]:bg-white"
                value={pager.page_size}
                onChange={(e) => onPageSizeUsers(Number(e.target.value))}
              >
                {pageSizes.map((size) => <option key={size} value={size}>{size}</option>)}
              </select>
              <button className="rounded bg-slate-800 px-2 py-1 disabled:opacity-40" disabled={pager.page <= 1} onClick={() => onPageUsers(pager.page - 1)}>Prev</button>
              <button className="rounded bg-slate-800 px-2 py-1 disabled:opacity-40" disabled={pager.page * pager.page_size >= pager.total} onClick={() => onPageUsers(pager.page + 1)}>Next</button>
            </div>
          </div>
        </div>
      )}

      {adminTab === 'roles' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> Roles</h3>
            <button className="rounded-lg bg-violet-600 px-3 py-1 text-sm" onClick={() => setRoleModal({ open: true, editing: null })}>+ Role</button>
          </div>
          <AdminTable columns={roleColumns} rows={pagedRoles} emptyText="No roles found." />
          <div className="flex items-center justify-between text-xs gap-3">
            <span>Total: {roles.length}</span>
            <div className="flex items-center gap-2">
              <span>Per page</span>
              <select
                className="rounded bg-slate-900 border border-slate-700 px-2 py-1 [&>option]:text-slate-900 [&>option]:bg-white"
                value={rolePageSize}
                onChange={(e) => {
                  setRolePageSize(Number(e.target.value))
                  setRolePage(1)
                }}
              >
                {pageSizes.map((size) => <option key={size} value={size}>{size}</option>)}
              </select>
              <button className="rounded bg-slate-800 px-2 py-1 disabled:opacity-40" disabled={rolePage <= 1} onClick={() => setRolePage((p) => p - 1)}>Prev</button>
              <button className="rounded bg-slate-800 px-2 py-1 disabled:opacity-40" disabled={rolePage * rolePageSize >= roles.length} onClick={() => setRolePage((p) => p + 1)}>Next</button>
            </div>
          </div>
        </div>
      )}

      {adminTab === 'permissions' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Permissions</h3>
            <div className="flex items-center gap-2">
              <button
                className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1 text-sm inline-flex items-center gap-1.5"
                onClick={() => setPermissionHelpOpen(true)}
              >
                <BookOpen className="h-3.5 w-3.5" />
                Permission Help
              </button>
              <button className="rounded-lg bg-violet-600 px-3 py-1 text-sm" onClick={() => setPermissionOpen(true)}>+ Permission</button>
            </div>
          </div>
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs text-slate-300">
            <span className="font-medium text-amber-300">Mask rule:</span> <span>`feedback.sensitive.mask` ON = redacted view, OFF = original view.</span>
          </div>
          <AdminTable columns={permissionColumns} rows={pagedPermissions} emptyText="No permissions found." />
          <div className="flex items-center justify-between text-xs gap-3">
            <span>Total: {permissions.length}</span>
            <div className="flex items-center gap-2">
              <span>Per page</span>
              <select
                className="rounded bg-slate-900 border border-slate-700 px-2 py-1 [&>option]:text-slate-900 [&>option]:bg-white"
                value={permissionPageSize}
                onChange={(e) => {
                  setPermissionPageSize(Number(e.target.value))
                  setPermissionPage(1)
                }}
              >
                {pageSizes.map((size) => <option key={size} value={size}>{size}</option>)}
              </select>
              <button className="rounded bg-slate-800 px-2 py-1 disabled:opacity-40" disabled={permissionPage <= 1} onClick={() => setPermissionPage((p) => p - 1)}>Prev</button>
              <button className="rounded bg-slate-800 px-2 py-1 disabled:opacity-40" disabled={permissionPage * permissionPageSize >= permissions.length} onClick={() => setPermissionPage((p) => p + 1)}>Next</button>
            </div>
          </div>
        </div>
      )}

      <RoleModal
        open={roleModal.open}
        initialValue={roleModal.editing}
        permissions={permissions}
        onClose={() => setRoleModal({ open: false, editing: null })}
        onSave={async (data) => {
          try {
            if (roleModal.editing) await onUpdateRole(roleModal.editing.id, data)
            else await onCreateRole(data)
            onNotify?.('success', roleModal.editing ? 'Role updated successfully.' : 'Role created successfully.')
            setRoleModal({ open: false, editing: null })
          } catch (err) {
            onNotify?.('error', err.message || 'Failed to save role.')
          }
        }}
      />
      <UserModal
        open={userModal.open}
        initialValue={userModal.editing}
        roles={roles}
        onClose={() => setUserModal({ open: false, editing: null })}
        onSave={async (data) => {
          try {
            if (userModal.editing) await onUpdateUser(userModal.editing.id, data)
            else await onCreateUser(data)
            onNotify?.('success', userModal.editing ? 'User updated successfully.' : 'User created successfully.')
            setUserModal({ open: false, editing: null })
          } catch (err) {
            onNotify?.('error', err.message || 'Failed to save user.')
          }
        }}
      />
      <PermissionModal
        open={permissionOpen}
        onClose={() => setPermissionOpen(false)}
        onSave={async (data) => {
          try {
            await onCreatePermission(data)
            onNotify?.('success', 'Permission added successfully.')
            setPermissionOpen(false)
          } catch (err) {
            onNotify?.('error', err.message || 'Failed to add permission.')
          }
        }}
      />
      <ConfirmDialog
        open={confirmDeactivate.open}
        title="Deactivate User"
        message={`Are you sure you want to deactivate ${confirmDeactivate.user?.name}?`}
        confirmLabel="Deactivate"
        onCancel={() => setConfirmDeactivate({ open: false, user: null })}
        onConfirm={async () => {
          if (!confirmDeactivate.user) return
          try {
            await onUpdateUser(confirmDeactivate.user.id, { is_active: false })
            onNotify?.('warning', 'User deactivated.')
          } catch (err) {
            onNotify?.('error', err.message || 'Failed to deactivate user.')
          } finally {
            setConfirmDeactivate({ open: false, user: null })
          }
        }}
      />
      <ConfirmDialog
        open={confirmDeleteRole.open}
        title="Delete Role"
        message={`Are you sure you want to permanently delete role "${confirmDeleteRole.role?.name}"?`}
        confirmLabel="Delete"
        onCancel={() => setConfirmDeleteRole({ open: false, role: null })}
        onConfirm={async () => {
          if (!confirmDeleteRole.role) return
          try {
            await onDeleteRole(confirmDeleteRole.role.id)
            onNotify?.('warning', 'Role deleted.')
          } catch (err) {
            onNotify?.('error', err.message || 'Failed to delete role.')
          } finally {
            setConfirmDeleteRole({ open: false, role: null })
          }
        }}
      />
      <ConfirmDialog
        open={confirmDeleteUser.open}
        title="Delete User"
        message={`Are you sure you want to permanently delete ${confirmDeleteUser.user?.name}?`}
        confirmLabel="Delete"
        onCancel={() => setConfirmDeleteUser({ open: false, user: null })}
        onConfirm={async () => {
          if (!confirmDeleteUser.user) return
          try {
            await onDeleteUser(confirmDeleteUser.user.id)
            onNotify?.('warning', 'User deleted.')
          } catch (err) {
            onNotify?.('error', err.message || 'Failed to delete user.')
          } finally {
            setConfirmDeleteUser({ open: false, user: null })
          }
        }}
      />
      <Modal
        open={permissionHelpOpen}
        title="Permission Behavior Guide"
        onClose={() => setPermissionHelpOpen(false)}
        panelClassName="max-w-4xl"
      >
        <div className="space-y-3 text-sm">
          <p className="text-slate-300">
            Use this guide to understand what each permission does when enabled vs disabled.
          </p>
          <div className="overflow-x-auto rounded-xl border border-slate-700">
            <table className="w-full min-w-[860px] text-left">
              <thead className="bg-slate-900/90 text-slate-300">
                <tr>
                  <th className="px-3 py-2 font-medium">Permission Key</th>
                  <th className="px-3 py-2 font-medium">When Enabled</th>
                  <th className="px-3 py-2 font-medium">When Disabled</th>
                </tr>
              </thead>
              <tbody>
                {permissionGuide.map((item) => (
                  <tr key={item.key} className="border-t border-slate-800 align-top">
                    <td className="px-3 py-2 text-violet-200 font-mono text-xs">{item.key}</td>
                    <td className="px-3 py-2 text-slate-200">{item.enabled}</td>
                    <td className="px-3 py-2 text-slate-400">{item.disabled}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>
    </div>
  )
}
