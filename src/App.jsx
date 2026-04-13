import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, BarChart3, ClipboardList, Compass, LayoutPanelLeft, Loader2, LogOut, Mic, Send, Settings2, Shield, Sparkles, UserCircle2 } from 'lucide-react'
import AdminPanel from './components/admin/AdminPanel'
import DashboardHome from './components/DashboardHome'
import FeedbackBoard from './components/FeedbackBoard'
import SubmitPanel from './components/SubmitPanel'
import AggregateInsightsSidebar from './components/AggregateInsightsSidebar'
import Modal from './components/common/Modal'
import ToastContainer from './components/common/ToastContainer'
import FeedbackAnalysisModal from './components/feedback/FeedbackAnalysisModal'
import { apiFetch, API_URL } from './lib/api'
import { ThemeSwitcher, useTheme } from './components/ThemeSwitcher'
import AppFooter from './components/AppFooter'
import { APP_LOGO, APP_NAME, APP_SUBTITLE } from './lib/branding'

const defaultFeedbackFilters = () => ({
  search: '',
  status: '',
  sentiment: '',
  input_type: '',
  source_id: '',
  department_id: '',
  course_code: '',
  priority: '',
})

function App() {
  const { mode } = useTheme()
  const [token, setToken] = useState(localStorage.getItem('token') || '')
  const [me, setMe] = useState(null)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [dashboard, setDashboard] = useState(null)
  const [dashboardAggregates, setDashboardAggregates] = useState(null)
  const [recentRows, setRecentRows] = useState([])
  const [feedbackRows, setFeedbackRows] = useState([])
  const [recentPage, setRecentPage] = useState(1)
  const [recentTotal, setRecentTotal] = useState(0)
  const [isRecentLoadingMore, setIsRecentLoadingMore] = useState(false)
  const [isDashboardAggregatesLoading, setIsDashboardAggregatesLoading] = useState(false)
  const [pagination, setPagination] = useState({ page: 1, page_size: 10, total: 0 })
  const [filters, setFilters] = useState(defaultFeedbackFilters)
  const [adminUsers, setAdminUsers] = useState([])
  const [adminPager, setAdminPager] = useState({ page: 1, page_size: 10, total: 0, search: '' })
  const [roles, setRoles] = useState([])
  const [permissions, setPermissions] = useState([])
  const [error, setError] = useState('')
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [submitMode, setSubmitMode] = useState('text')
  const [audioFile, setAudioFile] = useState(null)
  const [feedbackText, setFeedbackText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formMeta, setFormMeta] = useState({ sources: [], departments: [] })
  const [sourceId, setSourceId] = useState('')
  const [departmentId, setDepartmentId] = useState('')
  const [courseCode, setCourseCode] = useState('')
  const [toasts, setToasts] = useState([])
  const [profileOpen, setProfileOpen] = useState(false)
  const [profileModalOpen, setProfileModalOpen] = useState(false)
  const profileRef = useRef(null)
  const dashboardSummaryInFlight = useRef(false)
  const feedbackFetchGen = useRef(0)
  const paginationRef = useRef(pagination)
  const prevTabForFeedbackRef = useRef(null)
  const [analysisModalRow, setAnalysisModalRow] = useState(null)
  const [authScreen, setAuthScreen] = useState('overview')
  const [isSessionLoading, setIsSessionLoading] = useState(!!token)
  const [isLoginSubmitting, setIsLoginSubmitting] = useState(false)
  const [isDashboardLoading, setIsDashboardLoading] = useState(false)
  const [isRecentLoading, setIsRecentLoading] = useState(false)
  const [isFeedbackLoading, setIsFeedbackLoading] = useState(false)
  const [isFeedbackPaging, setIsFeedbackPaging] = useState(false)
  const [isAdminLoading, setIsAdminLoading] = useState(false)

  const notify = (type, message) => {
    const id = `${Date.now()}-${Math.random()}`
    setToasts((prev) => [...prev, { id, type, message }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3200)
  }

  const dismissToast = (id) => setToasts((prev) => prev.filter((t) => t.id !== id))

  useEffect(() => {
    const closeOnOutside = (e) => {
      if (!profileRef.current) return
      if (!profileRef.current.contains(e.target)) setProfileOpen(false)
    }
    document.addEventListener('mousedown', closeOnOutside)
    return () => document.removeEventListener('mousedown', closeOnOutside)
  }, [])

  useEffect(() => {
    if (!token || !me) {
      setProfileOpen(false)
      setProfileModalOpen(false)
    }
  }, [token, me])

  const loadSession = async () => {
    if (!token) {
      setIsSessionLoading(false)
      return
    }
    setIsSessionLoading(true)
    try {
      const user = await apiFetch('/auth/me', { token })
      setMe(user)
      if (!activeTab || !user.tabs.includes(activeTab)) setActiveTab(user.tabs[0] || 'dashboard')
      // Dashboard summary is loaded once when `me` is set (see useEffect below) to avoid duplicate /dashboard/summary calls.
    } catch (err) {
      setError(err.message)
      notify('error', err.message || 'Session expired.')
      handleLogout()
    } finally {
      setIsSessionLoading(false)
    }
  }

  useEffect(() => {
    paginationRef.current = pagination
  }, [pagination])

  const loadFeedback = useCallback(
    async (page = null, opts = {}) => {
      if (!me) return
      const soft = opts.soft === true
      const gen = ++feedbackFetchGen.current
      const pg = paginationRef.current
      const pageNum = page != null ? page : pg.page
      const pageSize = opts.page_size != null ? Number(opts.page_size) : Number(pg.page_size)
      if (!soft) {
        setIsFeedbackLoading(true)
        setFeedbackRows([])
      } else {
        setIsFeedbackPaging(true)
      }
      const params = new URLSearchParams()
      params.set('page', String(pageNum))
      params.set('page_size', String(pageSize))
      if (filters.search) params.set('search', filters.search)
      if (filters.status) params.set('status', filters.status)
      if (filters.sentiment) params.set('sentiment', filters.sentiment)
      if (filters.input_type) params.set('input_type', filters.input_type)
      if (filters.source_id) params.set('source_id', filters.source_id)
      if (filters.department_id) params.set('department_id', filters.department_id)
      if (filters.course_code) params.set('course_code', filters.course_code)
      if (filters.priority) params.set('priority', filters.priority)
      const canReadAll = me.permissions.includes('feedback.read_all')
      try {
        const data = await apiFetch(canReadAll ? `/feedback?${params}` : `/feedback/mine?${params}`, { token })
        if (gen !== feedbackFetchGen.current) return
        setFeedbackRows(data.items)
        setPagination({ page: data.page, page_size: data.page_size, total: data.total })
      } catch (err) {
        if (gen === feedbackFetchGen.current) {
          notify('error', err.message || 'Failed to load feedback.')
          if (!soft) setFeedbackRows([])
        }
      } finally {
        if (gen === feedbackFetchGen.current) {
          if (!soft) setIsFeedbackLoading(false)
          else setIsFeedbackPaging(false)
        }
      }
    },
    [
      me,
      token,
      filters.search,
      filters.status,
      filters.sentiment,
      filters.input_type,
      filters.source_id,
      filters.department_id,
      filters.course_code,
      filters.priority,
    ],
  )

  const goToFeedbackBoard = (patch = {}) => {
    feedbackFetchGen.current += 1
    setIsFeedbackLoading(true)
    setFeedbackRows([])
    setPagination((p) => ({ ...p, page: 1 }))
    paginationRef.current = { ...paginationRef.current, page: 1 }
    setFilters({
      ...defaultFeedbackFilters(),
      ...patch,
    })
    const tabs = me?.tabs || []
    if (tabs.includes('feedback_board')) setActiveTab('feedback_board')
    else if (tabs.includes('my_feedback')) setActiveTab('my_feedback')
    else setActiveTab('feedback_board')
  }

  const resetFeedbackFilters = () => {
    feedbackFetchGen.current += 1
    setIsFeedbackLoading(true)
    setFeedbackRows([])
    setPagination((p) => ({ ...p, page: 1 }))
    paginationRef.current = { ...paginationRef.current, page: 1 }
    setFilters(defaultFeedbackFilters())
  }

  /** Top nav tab clicks: clear filters so board views don’t keep prior search/filters (dashboard KPI nav uses `goToFeedbackBoard` instead). */
  const handleTabNavigate = (tab) => {
    feedbackFetchGen.current += 1
    setIsFeedbackLoading(true)
    setFeedbackRows([])
    setPagination((p) => ({ ...p, page: 1, page_size: 10 }))
    paginationRef.current = { ...paginationRef.current, page: 1, page_size: 10 }
    setFilters(defaultFeedbackFilters())
    setActiveTab(tab)
  }

  const handleFeedbackPageSizeChange = (size) => {
    const n = Number(size)
    if (![5, 10, 20, 50].includes(n)) return
    feedbackFetchGen.current += 1
    setIsFeedbackLoading(true)
    setFeedbackRows([])
    setPagination((p) => ({ ...p, page_size: n, page: 1 }))
    paginationRef.current = { ...paginationRef.current, page_size: n, page: 1 }
    loadFeedback(1, { page_size: n })
  }

  const loadAdmin = async (page = adminPager.page, search = adminPager.search, pageSize = adminPager.page_size) => {
    if (!me?.permissions.includes('users.view')) return
    setIsAdminLoading(true)
    const params = new URLSearchParams({
      page: String(page),
      page_size: String(pageSize),
      search,
    })
    try {
      const [users, roleRows, permissionRows] = await Promise.all([
        apiFetch(`/admin/users?${params}`, { token }),
        apiFetch('/admin/roles', { token }),
        apiFetch('/admin/permissions', { token }),
      ])
      setAdminUsers(users.items)
      setAdminPager({ page: users.page, page_size: users.page_size, total: users.total, search })
      setRoles(roleRows)
      setPermissions(permissionRows)
    } finally {
      setIsAdminLoading(false)
    }
  }

  const refreshDashboard = async () => {
    if (!token) return
    if (dashboardSummaryInFlight.current) return
    dashboardSummaryInFlight.current = true
    setIsDashboardLoading(true)
    try {
      const summary = await apiFetch('/dashboard/summary', { token })
      setDashboard(summary)
    } catch (err) {
      notify('error', err.message || 'Failed to refresh dashboard.')
    } finally {
      dashboardSummaryInFlight.current = false
      setIsDashboardLoading(false)
    }
  }

  const loadFormMeta = async () => {
    try {
      const meta = await apiFetch('/meta/feedback-form', token ? { token } : {})
      setFormMeta({
        sources: meta.sources || [],
        departments: meta.departments || [],
      })
    } catch {
      setFormMeta({ sources: [], departments: [] })
    }
  }

  const RECENT_PAGE_SIZE = 10
  const loadRecent = async ({ page = 1, reset = false } = {}) => {
    if (!me) return
    if (reset) {
      setIsRecentLoading(true)
      setRecentRows([])
    } else {
      setIsRecentLoadingMore(true)
    }

    try {
      const data = await apiFetch(`/dashboard/recent?page=${page}&page_size=${RECENT_PAGE_SIZE}`, { token })
      setRecentTotal(data.total || 0)
      setRecentPage(data.page || page)
      const items = data.items || []
      setRecentRows((prev) => (reset ? items : [...prev, ...items]))
    } catch (err) {
      // Non-fatal
      if (reset) setRecentRows([])
    } finally {
      if (reset) setIsRecentLoading(false)
      else setIsRecentLoadingMore(false)
    }
  }

  const loadDashboardAggregates = async () => {
    if (!token) return
    setIsDashboardAggregatesLoading(true)
    try {
      const data = await apiFetch('/dashboard/aggregates', { token })
      setDashboardAggregates(data)
    } catch (err) {
      setDashboardAggregates(null)
    } finally {
      setIsDashboardAggregatesLoading(false)
    }
  }

  const hasMoreRecent = recentRows.length < recentTotal
  const loadMoreRecent = useCallback(async () => {
    if (!hasMoreRecent) return
    if (isRecentLoadingMore) return
    await loadRecent({ page: recentPage + 1, reset: false })
  }, [hasMoreRecent, isRecentLoadingMore, recentPage, loadRecent])

  useEffect(() => {
    loadSession()
  }, [token])

  useEffect(() => {
    setError('')
  }, [authScreen])

  // Refresh KPIs + sidebar whenever auth or tab changes so submissions appear after tabbing around.
  useEffect(() => {
    if (!me || !token) return
    refreshDashboard()
    loadDashboardAggregates()
    loadRecent({ page: 1, reset: true })
  }, [me?.id, token, activeTab])

  useEffect(() => {
    if (!me) return
    if (activeTab === 'admin') loadAdmin()
    if (activeTab === 'submit' || activeTab === 'my_feedback' || activeTab === 'feedback_board') loadFormMeta()
  }, [activeTab, me])

  useEffect(() => {
    if (token) return
    loadFormMeta()
  }, [token])

  useLayoutEffect(() => {
    if (!me) return
    const onBoard = activeTab === 'my_feedback' || activeTab === 'feedback_board'
    if (!onBoard) {
      prevTabForFeedbackRef.current = activeTab
      return
    }
    const tabChanged = prevTabForFeedbackRef.current !== activeTab
    prevTabForFeedbackRef.current = activeTab

    setIsFeedbackLoading(true)
    setFeedbackRows([])

    const delay = tabChanged ? 0 : 250
    const timer = setTimeout(() => {
      loadFeedback(1)
    }, delay)
    return () => {
      clearTimeout(timer)
      feedbackFetchGen.current += 1
    }
  }, [
    activeTab,
    me,
    filters.search,
    filters.status,
    filters.sentiment,
    filters.input_type,
    filters.source_id,
    filters.department_id,
    filters.course_code,
    filters.priority,
    loadFeedback,
  ])

  // Intentionally no background polling:
  // dashboard/insights should refresh only on explicit user-triggered flows
  // (login, tab switches, submit, status updates, etc.).

  const visibleTabs = useMemo(() => {
    const tabs = me?.tabs || []
    if (me?.permissions.includes('dashboard.view') && !tabs.includes('dashboard')) return ['dashboard', ...tabs]
    return tabs
  }, [me])

  const tabMeta = {
    dashboard: { label: 'Dashboard', icon: BarChart3 },
    submit: { label: 'Submit', icon: Send },
    my_feedback: { label: 'My Feedback', icon: ClipboardList },
    feedback_board: { label: 'Feedback Board', icon: LayoutPanelLeft },
    admin: { label: 'Admin', icon: Settings2 },
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setIsLoginSubmitting(true)
    try {
      const data = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm),
      }).then(async (res) => {
        if (!res.ok) throw new Error('Invalid credentials')
        return res.json()
      })
      localStorage.setItem('token', data.token)
      setToken(data.token)
    } catch (err) {
      setError(err.message)
      notify('error', err.message || 'Login failed.')
    } finally {
      setIsLoginSubmitting(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    setProfileOpen(false)
    setProfileModalOpen(false)
    setToken('')
    setMe(null)
    setDashboard(null)
    setFilters(defaultFeedbackFilters())
    setFeedbackRows([])
    setPagination({ page: 1, page_size: 10, total: 0 })
    setIsFeedbackPaging(false)
    setRoles([])
    setPermissions([])
    setAdminUsers([])
    setToasts([])
    setIsSessionLoading(false)
  }

  const createFeedback = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      if (submitMode === 'audio') {
        if (!audioFile) {
          notify('warning', 'Please select an audio file.')
          return
        }
        const formData = new FormData()
        formData.append('message', feedbackText)
        if (sourceId) formData.append('source_id', sourceId)
        if (departmentId) formData.append('department_id', departmentId)
        if (courseCode.trim()) formData.append('course_code', courseCode.trim())
        formData.append('file', audioFile)
        await apiFetch('/feedback/audio', { method: 'POST', body: formData, token })
        setAudioFile(null)
      } else {
        const trimmed = (feedbackText || '').trim()
        if (!trimmed || trimmed.length < 10) {
          notify('warning', 'Feedback Text is required (min 10 characters).')
          return
        }
        await apiFetch('/feedback', {
          method: 'POST',
          body: JSON.stringify({
            message: trimmed,
            source_id: sourceId ? Number(sourceId) : null,
            department_id: departmentId ? Number(departmentId) : null,
            course_code: courseCode.trim() || null,
          }),
          token,
        })
      }
      setFeedbackText('')
      setSourceId('')
      setDepartmentId('')
      setCourseCode('')
      notify('success', 'Feedback submitted successfully.')
      if (activeTab === 'my_feedback' || activeTab === 'feedback_board') {
        loadFeedback(1)
      } else {
        goToFeedbackBoard()
      }
      await refreshDashboard()
      await loadDashboardAggregates()
      await loadRecent({ page: 1, reset: true })
    } catch (err) {
      notify('error', err.message || 'Failed to submit feedback.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const createPublicFeedback = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      if (submitMode === 'audio') {
        if (!audioFile) throw new Error('Please select an audio file.')
        const formData = new FormData()
        formData.append('message', feedbackText)
        if (sourceId) formData.append('source_id', sourceId)
        if (departmentId) formData.append('department_id', departmentId)
        if (courseCode.trim()) formData.append('course_code', courseCode.trim())
        formData.append('file', audioFile)
        await apiFetch('/feedback/public/audio', { method: 'POST', body: formData })
        setAudioFile(null)
      } else {
        const trimmed = (feedbackText || '').trim()
        if (!trimmed || trimmed.length < 10) throw new Error('Feedback Text is required (min 10 characters).')
        await apiFetch('/feedback/public', {
          method: 'POST',
          body: JSON.stringify({
            message: trimmed,
            source_id: sourceId ? Number(sourceId) : null,
            department_id: departmentId ? Number(departmentId) : null,
            course_code: courseCode.trim() || null,
          }),
        })
      }
      setFeedbackText('')
      setSourceId('')
      setDepartmentId('')
      setCourseCode('')
      notify('success', 'Anonymous feedback submitted successfully.')
    } catch (err) {
      notify('error', err.message || 'Failed to submit anonymous feedback.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const updateFeedback = async (id, status) => {
    try {
      await apiFetch(`/feedback/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
        token,
      })
      notify('success', `Feedback marked as ${status}.`)
      await loadFeedback(pagination.page, { soft: true })
      await refreshDashboard()
      await loadDashboardAggregates()
      await loadRecent({ page: 1, reset: true })
    } catch (err) {
      notify('error', err.message || 'Failed to update feedback.')
    }
  }

  const saveRole = async (payload) => {
    await apiFetch('/admin/roles', { method: 'POST', body: JSON.stringify(payload), token })
    await loadAdmin()
  }

  const updateRole = async (roleId, payload) => {
    await apiFetch(`/admin/roles/${roleId}`, { method: 'PATCH', body: JSON.stringify(payload), token })
    await loadAdmin()
  }

  const deleteRole = async (roleId) => {
    await apiFetch(`/admin/roles/${roleId}`, { method: 'DELETE', token })
    await loadAdmin()
  }

  const savePermission = async (payload) => {
    await apiFetch('/admin/permissions', { method: 'POST', body: JSON.stringify(payload), token })
    await loadAdmin()
  }

  const createUser = async (payload) => {
    await apiFetch('/admin/users', { method: 'POST', body: JSON.stringify(payload), token })
    await loadAdmin(adminPager.page, adminPager.search, adminPager.page_size)
  }

  const updateUser = async (id, patch) => {
    const nextPatch = { ...patch }
    if (!nextPatch.password) delete nextPatch.password
    await apiFetch(`/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify(nextPatch), token })
    await loadAdmin(adminPager.page, adminPager.search, adminPager.page_size)
  }

  const deleteUser = async (id) => {
    await apiFetch(`/admin/users/${id}`, { method: 'DELETE', token })
    await loadAdmin(adminPager.page, adminPager.search, adminPager.page_size)
  }

  if (token && isSessionLoading && !me) {
    return (
      <div className="brand-canvas flex min-h-screen flex-col bg-[#090a0e] text-white">
        <div className="flex flex-1 items-center justify-center px-4 py-10">
          <SessionGateLoader />
        </div>
        <AppFooter />
      </div>
    )
  }

  if (!token || !me) {
    const loginIsLight = mode !== 'dark'
    return (
      <div
        className={`login-screen brand-canvas relative min-h-screen overflow-hidden ${loginIsLight ? 'login-screen--light text-slate-900' : 'bg-[#06060a] text-white'}`}
      >
        {loginIsLight ? (
          <div className="pointer-events-none fixed inset-0">
            <div className="absolute inset-0 bg-gradient-to-b from-emerald-50/90 via-white to-sky-50/80" />
            <div className="absolute -left-24 top-0 h-[min(480px,55vh)] w-[min(480px,70vw)] rounded-full bg-[#05924a]/20 blur-3xl" />
            <div className="absolute -right-24 top-1/4 h-[min(440px,50vh)] w-[min(440px,65vw)] rounded-full bg-[#0970b8]/22 blur-3xl" />
            <div className="absolute bottom-0 left-1/2 h-40 w-[min(900px,95vw)] -translate-x-1/2 rounded-full bg-gradient-to-r from-[#05924a]/15 via-transparent to-[#0970b8]/15 blur-2xl" />
          </div>
        ) : (
          <div className="pointer-events-none fixed inset-0">
            <div className="absolute -left-32 top-0 h-[420px] w-[420px] rounded-full bg-[#0970b8]/25 blur-[120px]" />
            <div className="absolute -right-24 top-1/3 h-[380px] w-[380px] rounded-full bg-[#05924a]/18 blur-[100px]" />
            <div className="absolute bottom-0 left-1/3 h-[280px] w-[600px] -translate-x-1/2 rounded-full bg-[#0970b8]/12 blur-[90px]" />
            <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_0%,rgba(6,6,10,0.4)_40%,#06060a_100%)]" />
          </div>
        )}

        <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-10 sm:px-6 lg:px-8">
          <header className="mb-10 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img
                src={APP_LOGO}
                alt={`${APP_NAME} logo`}
                className={`h-11 w-11 rounded-2xl border p-2 shadow-lg ${loginIsLight ? 'border-[#0970b8]/25 bg-white shadow-[#0970b8]/20]' : 'border-white/10 bg-white/5 shadow-[#0970b8]/25'}`}
              />
              <div>
                <p
                  className={`text-[11px] font-semibold uppercase tracking-[0.2em] ${loginIsLight ? 'text-[#05924a]' : 'text-white'}`}
                >
                  Campus intelligence
                </p>
                <p className={`text-lg font-semibold tracking-tight ${loginIsLight ? 'text-slate-900' : 'text-white'}`}>{APP_NAME}</p>
                <p className={`text-xs ${loginIsLight ? 'text-slate-600' : 'text-slate-400'}`}>{APP_SUBTITLE}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-3">
              <ThemeSwitcher />
              <div
                className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs ${loginIsLight ? 'border-[#0970b8]/25 bg-white/90 text-slate-600 shadow-sm' : 'border-white/10 bg-white/[0.04] text-slate-400'}`}
              >
                <Sparkles className="h-3.5 w-3.5 text-[#05924a]" />
                <span>Text · Audio · AI insights</span>
              </div>
            </div>
          </header>

          <div className="grid flex-1 gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-stretch lg:gap-10">
            <section
              className={`flex flex-col justify-center rounded-3xl border p-8 backdrop-blur-sm sm:p-10 ${
                loginIsLight
                  ? 'border-[#0970b8]/25 bg-white/95 shadow-[0_24px_80px_-28px_rgba(9,112,184,0.25)]'
                  : 'border-white/[0.08] bg-slate-900/90 shadow-[0_24px_80px_-24px_rgba(0,0,0,0.85)]'
              }`}
            >
              <div
                className={`mb-6 inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${
                  loginIsLight
                    ? 'border-[#0970b8]/40 bg-gradient-to-r from-[#0970b8]/12 to-[#05924a]/10 text-[#0c4a6e]'
                    : 'border-[#0970b8]/35 bg-[#0970b8]/15 text-white'
                }`}
              >
                <Compass className="h-3.5 w-3.5" />
                Welcome
              </div>
              <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl md:text-[2.35rem]">
                <span className="gradient-text">Listen smarter.</span>
                <span className={`block ${loginIsLight ? 'text-slate-800' : 'text-slate-100'}`}>Act faster on campus feedback.</span>
              </h1>
              <p className={`mt-4 max-w-xl text-base leading-relaxed ${loginIsLight ? 'text-slate-600' : 'text-slate-400'}`}>
                Capture student voice from text and audio, analyze sentiment and intent, and turn signals into clear next steps for academic quality.
              </p>

              <ul className="mt-8 grid gap-3 sm:grid-cols-3">
                {[
                  { icon: BarChart3, label: 'Sentiment & trends', sub: 'Dashboards & insights' },
                  { icon: Mic, label: 'Voice & text', sub: 'Whisper + analysis' },
                  { icon: Shield, label: 'Role-based access', sub: 'Secure by design' },
                ].map(({ icon: Icon, label, sub }) => (
                  <li
                    key={label}
                    className={`rounded-2xl border px-4 py-3 ${
                      loginIsLight
                        ? 'border-[#05924a]/20 bg-gradient-to-br from-white to-emerald-50/50 shadow-sm'
                        : 'border-white/[0.06] bg-white/[0.03]'
                    }`}
                  >
                    <Icon className={`mb-2 h-5 w-5 ${loginIsLight ? 'text-[#0970b8]' : 'text-white'}`} />
                    <p className={`text-sm font-medium ${loginIsLight ? 'text-slate-800' : 'text-slate-200'}`}>{label}</p>
                    <p className={`text-[11px] ${loginIsLight ? 'text-slate-600' : 'text-slate-500'}`}>{sub}</p>
                  </li>
                ))}
              </ul>

              <div
                className={`mt-10 rounded-2xl border p-6 ${
                  loginIsLight ? 'border-slate-200/90 bg-slate-50/90 shadow-inner' : 'border-white/10 bg-slate-900/30'
                }`}
              >
                <h2 className={`text-lg font-semibold ${loginIsLight ? 'text-slate-900' : 'text-white'}`}>Choose how to continue</h2>
                <p className={`mt-1 text-sm ${loginIsLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  Sign in for dashboards and admin tools, or share feedback anonymously—no account required.
                </p>
                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => setAuthScreen('login')}
                    className={`group flex flex-1 items-center justify-center gap-2 rounded-xl border px-4 py-3.5 text-sm font-semibold transition-all ${
                      authScreen === 'login'
                        ? loginIsLight
                          ? 'border-[#0970b8] bg-[#0970b8] text-white shadow-lg shadow-[#0970b8]/25'
                          : 'border-[#0970b8]/55 bg-[#0970b8]/20 text-white shadow-lg shadow-[#0970b8]/20'
                        : loginIsLight
                          ? 'border-slate-200 bg-white text-slate-700 hover:border-[#0970b8]/45 hover:bg-sky-50'
                          : 'border-slate-600/50 bg-slate-900/50 text-slate-300 hover:border-[#0970b8]/45 hover:bg-[#0970b8]/10'
                    }`}
                  >
                    <UserCircle2 className="h-4 w-4 opacity-80" />
                    Sign in
                    <ArrowRight className="h-4 w-4 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthScreen('guest')}
                    className={`group flex flex-1 items-center justify-center gap-2 rounded-xl border px-4 py-3.5 text-sm font-semibold transition-all ${
                      authScreen === 'guest'
                        ? loginIsLight
                          ? 'border-[#05924a] bg-[#05924a] text-white shadow-lg shadow-[#05924a]/20'
                          : 'border-[#05924a]/50 bg-[#05924a]/18 text-white shadow-lg shadow-[#05924a]/15'
                        : loginIsLight
                          ? 'border-slate-200 bg-white text-slate-700 hover:border-[#05924a]/45 hover:bg-emerald-50'
                          : 'border-slate-600/50 bg-slate-900/50 text-slate-300 hover:border-[#05924a]/40 hover:bg-[#05924a]/10'
                    }`}
                  >
                    <Send className="h-4 w-4 opacity-80" />
                    Anonymous feedback
                    <ArrowRight className="h-4 w-4 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
                  </button>
                </div>
              </div>
            </section>

            <aside className="flex min-h-[420px] flex-col lg:min-h-0">
              {authScreen === 'guest' ? (
                  <div
                    className={`h-full rounded-3xl border p-1 backdrop-blur-sm ${
                      loginIsLight
                        ? 'border-[#05924a]/30 bg-white/95 shadow-[0_24px_60px_-24px_rgba(5,146,74,0.18)]'
                        : 'border-white/[0.08] bg-slate-900/90 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.75)]'
                    }`}
                  >
                  <div
                    className={`h-full rounded-[1.35rem] border p-5 sm:p-6 ${
                      loginIsLight ? 'border-emerald-100/80 bg-gradient-to-b from-white to-emerald-50/30' : 'border-white/[0.05] bg-slate-900/70'
                    }`}
                  >
                    <SubmitPanel
                      mode={submitMode}
                      setMode={setSubmitMode}
                      text={feedbackText}
                      setText={setFeedbackText}
                      audioFile={audioFile}
                      setAudioFile={setAudioFile}
                      onSubmit={createPublicFeedback}
                      isSubmitting={isSubmitting}
                      sourceId={sourceId}
                      setSourceId={setSourceId}
                      departmentId={departmentId}
                      setDepartmentId={setDepartmentId}
                      courseCode={courseCode}
                      setCourseCode={setCourseCode}
                      sources={formMeta.sources}
                      departments={formMeta.departments}
                    />
                  </div>
                </div>
              ) : authScreen === 'login' ? (
                <motion.form
                  layout
                  onSubmit={handleLogin}
                  aria-busy={isLoginSubmitting}
                  className={`relative flex h-full flex-col overflow-hidden rounded-3xl border p-8 ${
                    loginIsLight
                      ? 'border-[#0970b8]/25 bg-white/95 shadow-[0_24px_60px_-28px_rgba(9,112,184,0.2)]'
                      : 'border-white/[0.08] bg-slate-900/90 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.75)]'
                  }`}
                >
                  <motion.div
                    animate={{ opacity: isLoginSubmitting ? 0.88 : 1 }}
                    transition={{ duration: 0.25 }}
                    className="flex min-h-0 flex-1 flex-col"
                  >
                    <div className="mb-6">
                      <p
                        className={`text-xs font-semibold uppercase tracking-wider ${loginIsLight ? 'text-[#0970b8]' : 'text-white'}`}
                      >
                        Secure access
                      </p>
                      <h2 className={`mt-1 text-2xl font-bold ${loginIsLight ? 'text-slate-900' : 'text-white'}`}>Sign in</h2>
                      <p className={`mt-2 text-sm ${loginIsLight ? 'text-slate-600' : 'text-slate-400'}`}>
                        Use your campus credentials to open dashboards and admin tools.
                      </p>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label
                          className={`mb-1.5 block text-xs font-medium ${loginIsLight ? 'text-slate-700' : 'text-slate-400'}`}
                        >
                          Email
                        </label>
                        <input
                          className={`w-full rounded-xl border px-4 py-3 outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60 ${
                            loginIsLight
                              ? 'border-slate-200 bg-white text-slate-900 shadow-sm ring-[#0970b8]/20 placeholder:text-slate-400 focus:border-[#0970b8] focus:ring-[#0970b8]/25'
                              : 'border-slate-700/80 bg-slate-950/80 text-slate-100 ring-[#0970b8]/30 placeholder:text-slate-600 focus:border-[#0970b8]/55'
                          }`}
                          placeholder="you@university.edu"
                          value={loginForm.email}
                          disabled={isLoginSubmitting}
                          autoComplete="username"
                          onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                        />
                      </div>
                      <div>
                        <label
                          className={`mb-1.5 block text-xs font-medium ${loginIsLight ? 'text-slate-700' : 'text-slate-400'}`}
                        >
                          Password
                        </label>
                        <input
                          className={`w-full rounded-xl border px-4 py-3 outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60 ${
                            loginIsLight
                              ? 'border-slate-200 bg-white text-slate-900 shadow-sm ring-[#0970b8]/20 placeholder:text-slate-400 focus:border-[#0970b8] focus:ring-[#0970b8]/25'
                              : 'border-slate-700/80 bg-slate-950/80 text-slate-100 ring-[#0970b8]/30 placeholder:text-slate-600 focus:border-[#0970b8]/55'
                          }`}
                          placeholder="••••••••"
                          type="password"
                          value={loginForm.password}
                          disabled={isLoginSubmitting}
                          autoComplete="current-password"
                          onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                        />
                      </div>
                      {error && <p className="text-sm text-red-500">{error}</p>}
                    </div>
                    <button
                      type="submit"
                      disabled={isLoginSubmitting}
                      className="group relative mt-8 w-full overflow-hidden rounded-xl bg-gradient-to-r from-[#0970b8] to-[#05924a] py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#0970b8]/25 transition hover:brightness-110 disabled:cursor-wait disabled:hover:brightness-100"
                    >
                      <span className="relative inline-flex items-center justify-center gap-2">
                        {isLoginSubmitting ? (
                          <>
                            <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                            Signing you in…
                          </>
                        ) : (
                          <>
                            Continue to app
                            <ArrowRight className="h-4 w-4 opacity-80 transition group-hover:translate-x-0.5" />
                          </>
                        )}
                      </span>
                    </button>
                    <AnimatePresence>
                      {isLoginSubmitting && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <p className={`mt-3 text-center text-xs ${loginIsLight ? 'text-slate-500' : 'text-slate-500'}`}>
                            <span className="inline-flex items-center gap-2">
                              <span className="inline-flex h-1.5 w-1.5 animate-pulse rounded-full bg-[#0970b8]" />
                              Verifying credentials and loading your workspace…
                            </span>
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </motion.form>
              ) : (
                <div
                  className={`flex h-full flex-col items-center justify-center rounded-3xl border border-dashed px-8 py-16 text-center ${
                    loginIsLight
                      ? 'border-[#0970b8]/30 bg-white/80 shadow-[0_20px_50px_-24px_rgba(9,112,184,0.15)]'
                      : 'border-white/15 bg-white/[0.02]'
                  }`}
                >
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#0970b8]/20 bg-gradient-to-br from-[#0970b8]/20 to-[#05924a]/15">
                    <Compass className={`h-8 w-8 ${loginIsLight ? 'text-[#0970b8]' : 'text-white'}`} />
                  </div>
                  <p className={`text-lg font-semibold ${loginIsLight ? 'text-slate-800' : 'text-slate-200'}`}>Pick a path to begin</p>
                  <p className={`mt-2 max-w-xs text-sm leading-relaxed ${loginIsLight ? 'text-slate-600' : 'text-slate-500'}`}>
                    Use <span className={loginIsLight ? 'font-medium text-[#0970b8]' : 'text-slate-400'}>Sign in</span> for your account, or{' '}
                    <span className={loginIsLight ? 'font-medium text-[#05924a]' : 'text-slate-400'}>Anonymous feedback</span> to submit without logging in.
                  </p>
                </div>
              )}
            </aside>
          </div>

          <AppFooter />
        </div>
      </div>
    )
  }

  return (
    <div className="brand-canvas flex min-h-screen flex-col bg-[#090a0e] text-white">
      <div className="flex flex-1 flex-col p-3 sm:p-4 md:p-6">
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
        <div className="mx-auto w-full max-w-[1440px] flex-1 space-y-3 sm:space-y-4">
        {/* <div className="flex flex-col gap-2 rounded-xl border border-slate-800 bg-[#101116] px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:px-4 sm:py-3">
          <div className="min-w-0 text-xs text-slate-300 sm:text-sm inline-flex flex-wrap items-center gap-x-2 gap-y-1">
            <img src={APP_LOGO} alt={`${APP_NAME} logo`} className="h-7 w-7 shrink-0 rounded-lg border border-slate-700 bg-slate-900 p-1 sm:h-8 sm:w-8" />
            <span className="font-semibold text-white">{APP_NAME}</span>
            <span className="hidden text-slate-500 sm:inline">|</span>
            <span className="min-w-0 truncate font-semibold text-white">{me.name}</span>
            <span className="hidden max-w-[min(100%,20rem)] truncate text-slate-400 lg:inline">
              ({me.roles.map((r) => r.name).join(', ')})
            </span>
          </div>
        </div> */}

        <div className="brand-top-bar flex flex-col gap-3 border-b border-slate-800 pb-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="w-full min-w-0 overflow-x-auto [-webkit-overflow-scrolling:touch] pb-0.5 sm:overflow-visible sm:pb-0">
            <div className="brand-tab-list flex w-max gap-2 sm:flex-wrap sm:w-auto">
              {visibleTabs.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => handleTabNavigate(tab)}
                  className={`brand-nav-tab shrink-0 rounded-lg border px-2.5 py-1.5 text-xs transition sm:px-3 sm:text-sm ${activeTab === tab ? 'border-amber-400/40 bg-amber-500/10 text-amber-200' : 'border-slate-700 bg-[#14151b] text-slate-300'}`}
                >
                  <span className="inline-flex items-center gap-1.5 sm:gap-2">
                    {tabMeta[tab]?.icon ? React.createElement(tabMeta[tab].icon, { className: 'h-3.5 w-3.5 sm:h-4 sm:w-4' }) : null}
                    {tabMeta[tab]?.label || tab.replace('_', ' ')}
                  </span>
                </button>
              ))}
            </div>
          </div>
          <div ref={profileRef} className="relative flex shrink-0 justify-end">
            <div className="flex items-center gap-2">
              <ThemeSwitcher />
              <button className="rounded-xl border border-slate-700 bg-slate-900 px-2.5 py-2 hover:bg-slate-800 sm:px-3" onClick={() => setProfileOpen((v) => !v)}>
                <span className="inline-flex max-w-[10rem] items-center gap-2 sm:max-w-none">
                  <UserCircle2 className="h-5 w-5 shrink-0 text-violet-300" />
                  <span className="truncate text-sm">{me.name}</span>
                </span>
              </button>
            </div>
            {profileOpen && (
              <div className="profile-menu absolute right-0 z-20 mt-2 w-44 rounded-xl border border-slate-700 bg-slate-900 p-1 shadow-xl">
                <button
                  type="button"
                  className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-200 hover:bg-slate-800"
                  onClick={() => {
                    setProfileModalOpen(true)
                    setProfileOpen(false)
                  }}
                >
                  View Profile
                </button>
                <button
                  type="button"
                  className="inline-flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-200 hover:bg-slate-800"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4" /> Logout
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,320px)_1fr]">
          {isDashboardAggregatesLoading && !dashboardAggregates ? (
            <div className="brand-panel-sidebar rounded-2xl border border-slate-800 bg-[#101116] p-6 min-h-[260px]">
              <PageLoader label="Loading aggregate insights..." />
            </div>
          ) : (
            <AggregateInsightsSidebar dashboard={dashboard} aggregates={dashboardAggregates} recentRows={recentRows} onNavigateToBoard={goToFeedbackBoard} />
          )}
          <div className="brand-panel-main min-w-0 rounded-xl p-1 sm:p-2 lg:min-h-0">
            {activeTab === 'dashboard' && (
              isDashboardLoading && !dashboard ? (
                <div className="rounded-2xl border border-slate-800 bg-[#101116] p-6 min-h-[300px]">
                  <PageLoader label="Loading dashboard..." />
                </div>
              ) : (
                <DashboardHome
                  dashboard={dashboard}
                  aggregates={dashboardAggregates}
                  permissions={me.permissions || []}
                  recentRows={recentRows}
                  isRecentLoading={isRecentLoading}
                  hasMoreRecent={recentRows.length < recentTotal}
                  onLoadMoreRecent={loadMoreRecent}
                  isRecentLoadingMore={isRecentLoadingMore}
                  canUpdate={me.permissions.includes('feedback.update')}
                  canViewAnalysis={me.permissions.includes('feedback.analysis.view') || me.permissions.includes('system.superadmin')}
                  canViewCost={me.permissions.includes('ai.cost.view')}
                  onNavigateToBoard={goToFeedbackBoard}
                  onViewAnalysis={(row) => {
                    if (!row) return
                    setAnalysisModalRow(row)
                  }}
                  onMark={updateFeedback}
                />
              )
            )}

            {activeTab === 'submit' && (
              <SubmitPanel
                mode={submitMode}
                setMode={setSubmitMode}
                text={feedbackText}
                setText={setFeedbackText}
                audioFile={audioFile}
                setAudioFile={setAudioFile}
                onSubmit={createFeedback}
                isSubmitting={isSubmitting}
                sourceId={sourceId}
                setSourceId={setSourceId}
                departmentId={departmentId}
                setDepartmentId={setDepartmentId}
                courseCode={courseCode}
                setCourseCode={setCourseCode}
                sources={formMeta.sources}
                departments={formMeta.departments}
              />
            )}

            {(activeTab === 'my_feedback' || activeTab === 'feedback_board') && (
              isFeedbackLoading ? (
                <div className="rounded-2xl border border-slate-800 bg-[#101116] p-6 min-h-[260px]">
                  <PageLoader label="Loading feedback..." />
                </div>
              ) : (
                <FeedbackBoard
                  rows={feedbackRows}
                  pagination={pagination}
                  onPageSizeChange={handleFeedbackPageSizeChange}
                  filters={filters}
                  setFilters={setFilters}
                  onResetFilters={resetFeedbackFilters}
                  formMeta={formMeta}
                  isPaging={isFeedbackPaging}
                  onPrev={() => loadFeedback(pagination.page - 1, { soft: true })}
                  onNext={() => loadFeedback(pagination.page + 1, { soft: true })}
                  canUpdate={me.permissions.includes('feedback.update')}
                  canViewCost={me.permissions.includes('ai.cost.view')}
                  canViewAnalysis={me.permissions.includes('feedback.analysis.view') || me.permissions.includes('system.superadmin')}
                  permissions={me.permissions || []}
                  onMark={updateFeedback}
                  hideDetails={activeTab === 'my_feedback'}
                />
              )
            )}

            {activeTab === 'admin' && (
              isAdminLoading && adminUsers.length === 0 && roles.length === 0 && permissions.length === 0 ? (
                <div className="rounded-2xl border border-slate-800 bg-[#101116] p-6 min-h-[260px]">
                  <PageLoader label="Loading admin data..." />
                </div>
              ) : (
                <AdminPanel
                  roles={roles}
                  permissions={permissions}
                  users={adminUsers}
                  pager={adminPager}
                  onSearchUsers={(search) => loadAdmin(1, search)}
                  onPageUsers={(page) => loadAdmin(page, adminPager.search)}
                  onPageSizeUsers={(size) => loadAdmin(1, adminPager.search, size)}
                  onCreateUser={createUser}
                  onUpdateUser={updateUser}
                  onCreateRole={saveRole}
                  onUpdateRole={updateRole}
                  onDeleteRole={deleteRole}
                  onCreatePermission={savePermission}
                  onDeleteUser={deleteUser}
                  onNotify={notify}
                />
              )
            )}
          </div>
        </div>
        </div>
      </div>
      <AppFooter />
      <FeedbackAnalysisModal
        open={!!analysisModalRow}
        row={analysisModalRow}
        permissions={me.permissions || []}
        onClose={() => setAnalysisModalRow(null)}
      />
      <Modal
        open={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        title="Profile"
        panelClassName="max-w-md"
      >
        <div className="space-y-2 text-sm">
          <p><span className="text-slate-400">Name:</span> {me.name}</p>
          <p><span className="text-slate-400">Email:</span> {me.email}</p>
          <p><span className="text-slate-400">Roles:</span> {me.roles.map((r) => r.name).join(', ')}</p>
        </div>
      </Modal>
    </div>
  )
}

export default App

function SessionGateLoader() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="flex flex-col items-center gap-8 px-6"
    >
      <div className="relative">
        <motion.div
          className="absolute -inset-6 rounded-full bg-violet-500/25 blur-2xl"
          animate={{ opacity: [0.35, 0.65, 0.35], scale: [1, 1.08, 1] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="relative flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-2xl border border-violet-500/35 bg-[#12131a] shadow-[0_0_40px_-8px_rgba(139,92,246,0.45)]">
          <Loader2 className="h-9 w-9 animate-spin text-violet-300" />
        </div>
      </div>
      <div className="max-w-sm text-center">
        <motion.p
          className="text-base font-semibold text-slate-100"
          animate={{ opacity: [0.75, 1, 0.75] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        >
          Loading your workspace…
        </motion.p>
        <p className="mt-2 text-sm text-slate-500">Verifying your session and preparing the app</p>
      </div>
      <div className="flex items-center gap-2" aria-hidden>
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="h-2 w-2 rounded-full bg-violet-400"
            animate={{ opacity: [0.25, 1, 0.25], y: [0, -6, 0] }}
            transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.12, ease: 'easeInOut' }}
          />
        ))}
      </div>
    </motion.div>
  )
}

function PageLoader({ label = 'Loading...' }) {
  return (
    <div className="flex min-h-[180px] items-center justify-center">
      <div className="inline-flex items-center gap-2 text-sm text-slate-300">
        <Loader2 className="h-4 w-4 animate-spin text-violet-300" />
        <span>{label}</span>
      </div>
    </div>
  )
}
