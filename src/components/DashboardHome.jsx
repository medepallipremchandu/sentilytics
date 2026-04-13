import React, { useEffect, useRef } from 'react'
import {
  AlertCircle,
  BarChart3,
  ChevronRight,
  Clock3,
  LayoutDashboard,
  Mic2,
  PieChart as PieChartIcon,
  Sparkles,
  Type,
  Zap,
} from 'lucide-react'
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { motion } from 'framer-motion'
import { useTheme } from './ThemeSwitcher'
import { APP_LOGO } from '../lib/branding'

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.02 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 380, damping: 28 } },
}

function KpiCard({ title, value, color = 'violet', icon = null, onClick }) {
  const interactive = typeof onClick === 'function'
  const colorMap = {
    violet: 'from-violet-500/25 via-violet-950/40 to-slate-950/80',
    emerald: 'from-emerald-500/20 via-emerald-950/35 to-slate-950/80',
    amber: 'from-amber-500/20 via-amber-950/35 to-slate-950/80',
    red: 'from-red-500/20 via-red-950/35 to-slate-950/80',
    blue: 'from-sky-500/20 via-sky-950/35 to-slate-950/80',
  }
  const iconColor = {
    violet: 'text-violet-300',
    emerald: 'text-emerald-300',
    amber: 'text-amber-300',
    red: 'text-red-300',
    blue: 'text-sky-300',
  }
  return (
    <motion.div
      variants={itemVariants}
      whileHover={interactive ? { y: -2, transition: { duration: 0.18 } } : undefined}
      whileTap={interactive ? { scale: 0.98 } : undefined}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={interactive ? onClick : undefined}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onClick()
              }
            }
          : undefined
      }
      className={`group relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br ${colorMap[color]} p-2.5 shadow-sm ${
        interactive
          ? 'cursor-pointer ring-0 transition-shadow hover:shadow-md hover:ring-1 hover:ring-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/40'
          : ''
      }`}
    >
      {interactive ? (
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.04] to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      ) : null}
      <div className="relative flex items-start justify-between gap-2">
        <span className="text-[10px] font-medium uppercase tracking-wide text-slate-400">{title}</span>
        {icon ? (
          <span className={`rounded-md border border-white/10 bg-slate-900/30 p-1 ${iconColor[color] || 'text-slate-300'}`}>
            {React.cloneElement(icon, { className: 'h-3.5 w-3.5' })}
          </span>
        ) : null}
      </div>
      <p className="relative mt-1 text-lg font-semibold tabular-nums tracking-tight text-white">{value}</p>
    </motion.div>
  )
}

function Pill({ label, tone }) {
  const toneMap = {
    soon: 'bg-sky-500/15 border-sky-400/25 text-sky-200',
    inprogress: 'bg-amber-500/15 border-amber-400/25 text-amber-200',
    completed: 'bg-emerald-500/15 border-emerald-400/25 text-emerald-200',
    high: 'bg-red-500/15 border-red-400/25 text-red-200',
    text: 'bg-cyan-500/15 border-cyan-400/25 text-cyan-200',
    audio: 'bg-indigo-500/15 border-indigo-400/25 text-indigo-200',
    neutral: 'bg-slate-500/15 border-slate-400/25 text-slate-200',
  }
  return (
    <span className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${toneMap[tone] || toneMap.neutral}`}>
      {label}
    </span>
  )
}

function ChartCard({ title, icon, children, className = '' }) {
  return (
    <motion.div
      variants={itemVariants}
      className={`relative overflow-hidden rounded-xl border border-white/10 bg-slate-900/90 p-2.5 shadow-sm backdrop-blur-sm ${className}`}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          {icon ? <span className="text-slate-400">{icon}</span> : null}
          {title}
        </p>
      </div>
      {children}
    </motion.div>
  )
}

function formatDateTime(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString()
}

function shorten(s, n = 140) {
  if (!s) return ''
  return s.length > n ? `${s.slice(0, n)}...` : s
}

const STATUS_PIE_MAP = { Completed: 'completed', 'In Progress': 'inprogress', Soon: 'soon' }
const SENTIMENT_PIE_MAP = { Positive: 'positive', Neutral: 'neutral', Negative: 'negative', Mixed: 'mixed' }

function SentimentStrip({ sentimentCounts, total }) {
  const order = [
    { key: 'positive', label: '+', color: 'bg-emerald-400' },
    { key: 'neutral', label: '○', color: 'bg-amber-400' },
    { key: 'negative', label: '−', color: 'bg-rose-400' },
    { key: 'mixed', label: '±', color: 'bg-amber-400' },
  ]
  return (
    <motion.div variants={itemVariants} className="rounded-xl border border-white/10 bg-slate-900/70 p-2.5">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          <Sparkles className="h-3 w-3 text-amber-400/80" />
          Sentiment mix
        </span>
        <span className="text-[10px] tabular-nums text-slate-500">{total} rows</span>
      </div>
      <div className="flex h-1.5 overflow-hidden rounded-full bg-slate-800">
        {order.map(({ key, color }) => {
          const n = sentimentCounts[key] || 0
          const pct = total ? (n / total) * 100 : 0
          return pct > 0 ? (
            <motion.div
              key={key}
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
              className={color}
              title={`${key}: ${n}`}
            />
          ) : null
        })}
      </div>
      <div className="mt-2 grid grid-cols-4 gap-1 text-center">
        {order.map(({ key, label }) => {
          const n = sentimentCounts[key] || 0
          const pct = total ? Math.round((n / total) * 100) : 0
          return (
            <div key={key} className="rounded-md border border-white/10 bg-slate-900/30 px-1 py-1">
              <div className="text-[9px] font-medium uppercase text-slate-500">{label}</div>
              <div className="text-[11px] font-semibold tabular-nums text-slate-200">
                {n}
                <span className="text-slate-500"> ·{pct}%</span>
              </div>
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}

function ActionChip({ icon, label, onClick }) {
  return (
    <motion.button
      type="button"
      variants={itemVariants}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="inline-flex min-w-0 flex-1 items-center justify-between gap-2 rounded-lg border border-white/10 bg-slate-900/30 px-2.5 py-2 text-left text-[11px] font-medium text-slate-200 transition-colors hover:border-amber-400/25 hover:bg-amber-500/5"
    >
      <span className="inline-flex min-w-0 items-center gap-2">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-white/10 bg-slate-900/70 text-amber-300/90">
          {icon}
        </span>
        <span className="truncate">{label}</span>
      </span>
      <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-500" />
    </motion.button>
  )
}

export default function DashboardHome({
  dashboard,
  aggregates,
  permissions = [],
  recentRows = [],
  isRecentLoading,
  hasMoreRecent,
  onLoadMoreRecent,
  isRecentLoadingMore,
  canUpdate,
  canViewAnalysis,
  canViewCost,
  onNavigateToBoard,
  onViewAnalysis,
  onMark,
}) {
  if (!dashboard) return null

  const { mode } = useTheme()
  const isLight = mode === 'light'

  const tooltipBase = {
    borderRadius: 8,
    fontSize: 11,
  }
  const tooltipContentStyle = isLight
    ? { ...tooltipBase, background: '#ffffff', border: '1px solid rgba(15,23,42,0.12)' }
    : { ...tooltipBase, background: '#12131a', border: '1px solid rgba(255,255,255,0.08)' }
  const tooltipLabelStyle = {
    color: isLight ? '#0f172a' : '#e2e8f0',
    fontSize: 11,
  }
  const tooltipItemStyle = {
    color: isLight ? '#0f172a' : '#e2e8f0',
    fontSize: 11,
  }

  const sentimentCounts =
    aggregates?.sentiment_counts ||
    recentRows.reduce((acc, row) => {
      const k = (row.sentiment || 'neutral').toLowerCase()
      acc[k] = (acc[k] || 0) + 1
      return acc
    }, {})

  const recentListRows = recentRows
  const totalRows = aggregates?.total_rows ?? recentRows.length

  const sentimentPie = [
    { name: 'Positive', value: sentimentCounts.positive || 0, color: '#34d399' },
    { name: 'Neutral', value: sentimentCounts.neutral || 0, color: '#f59e0b' },
    { name: 'Negative', value: sentimentCounts.negative || 0, color: '#fb7185' },
    { name: 'Mixed', value: sentimentCounts.mixed || 0, color: '#fbbf24' },
  ]

  const topTopics = aggregates?.top_topics?.length
    ? aggregates.top_topics.map((t) => t.topic)
    : Object.entries(
        recentRows.reduce((acc, row) => {
          const t =
            row?.analysis?.analysis?.primary_topic ||
            row?.analysis?.analysis?.primary_topic ||
            row?.intent ||
            'General'
          acc[t] = (acc[t] || 0) + 1
          return acc
        }, {})
      )
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([t]) => t)

  const canViewCostSafe = canViewCost || permissions.includes('system.superadmin')
  const statusPie = [
    { name: 'Completed', value: dashboard.completed || 0, color: '#34d399' },
    { name: 'In Progress', value: dashboard.inprogress || 0, color: '#f59e0b' },
    { name: 'Soon', value: dashboard.soon || 0, color: '#38bdf8' },
  ]
  const sourceBar = [
    { name: 'Text', value: dashboard.text_feedback || 0, color: '#22c55e' },
    { name: 'Audio', value: dashboard.audio_feedback || 0, color: '#8b5cf6' },
  ]
  const costPie = canViewCostSafe
    ? [
        { name: 'Whisper', value: Number(dashboard.whisper_cost_usd || 0), color: '#f59e0b' },
        { name: 'GPT', value: Number(dashboard.gpt_cost_usd || 0), color: '#3b82f6' },
      ]
    : []

  const chartH = 168

  const loadMoreSentinelRef = useRef(null)
  useEffect(() => {
    if (!onLoadMoreRecent) return
    if (!hasMoreRecent) return
    const el = loadMoreSentinelRef.current
    if (!el) return

    const obs = new IntersectionObserver(
      (entries) => {
        const first = entries[0]
        if (!first?.isIntersecting) return
        if (isRecentLoadingMore) return
        onLoadMoreRecent()
      },
      { root: null, rootMargin: '220px', threshold: 0.01 }
    )

    obs.observe(el)
    return () => obs.disconnect()
  }, [onLoadMoreRecent, hasMoreRecent, isRecentLoadingMore])

  return (
    <motion.div
      className="brand-dashboard-home space-y-2.5"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {/* Brand + context */}
      <motion.div
        variants={itemVariants}
        className="relative overflow-hidden rounded-xl border border-white/10 bg-slate-900/90 p-2.5"
      >
        <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-violet-500/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-6 left-1/3 h-16 w-16 rounded-full bg-amber-500/10 blur-xl" />
        <div className="relative flex flex-wrap items-center justify-between gap-2">
          <div className="inline-flex min-w-0 items-center gap-2.5">
            <motion.div
              className="relative shrink-0"
              animate={{ rotate: [0, 0] }}
              whileHover={{ scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 400, damping: 22 }}
            >
              <img src={APP_LOGO} alt="" className="h-9 w-9 rounded-lg border border-white/10 bg-black/30 p-1 shadow-inner" />
              <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5 items-center justify-center rounded-full border border-[#0c0d12] bg-emerald-400">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-200" />
              </span>
            </motion.div>
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2">
                <h2 className="truncate text-sm font-semibold text-white">Overview</h2>
                <span className="hidden rounded-md border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide text-slate-400 sm:inline">
                  Live
                </span>
              </div>
              <p className="truncate text-[11px] text-slate-500">
                {dashboard.total_feedback} submissions · resolve {dashboard.resolve_rate}%
              </p>
            </div>
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-slate-900/30 px-2 py-1 text-[10px] text-slate-400">
            <LayoutDashboard className="h-3.5 w-3.5 text-violet-300/90" />
            <span className="hidden sm:inline">Dense view · charts use full dataset</span>
            <span className="sm:hidden">Dense</span>
          </div>
        </div>
      </motion.div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        <KpiCard
          title="Total"
          value={dashboard.total_feedback}
          color="violet"
          icon={<BarChart3 />}
          onClick={() => onNavigateToBoard?.({})}
        />
        <KpiCard
          title="Done"
          value={dashboard.completed}
          color="emerald"
          icon={<Zap />}
          onClick={() => onNavigateToBoard?.({ status: 'completed' })}
        />
        <KpiCard
          title="Active"
          value={dashboard.inprogress}
          color="amber"
          icon={<Clock3 />}
          onClick={() => onNavigateToBoard?.({ status: 'inprogress' })}
        />
        <KpiCard
          title="Urgent"
          value={dashboard.high_priority}
          color="red"
          icon={<AlertCircle />}
          onClick={() => onNavigateToBoard?.({ priority: 'high' })}
        />
        <KpiCard title="Resolve" value={`${dashboard.resolve_rate}%`} color="blue" icon={<PieChartIcon />} />
      </div>

      <div className="grid gap-2 lg:grid-cols-[minmax(0,1fr)_220px]">
        <SentimentStrip sentimentCounts={sentimentCounts} total={totalRows} />
        <motion.div
          variants={itemVariants}
          className="flex flex-col justify-center rounded-xl border border-white/10 bg-slate-900/70 px-3 py-2"
        >
          <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">Sources</p>
          <div className="mt-1 flex items-center justify-between gap-2 text-[11px] text-slate-300">
            <span className="inline-flex items-center gap-1.5">
              <Type className="h-3.5 w-3.5 text-emerald-400/90" />
              Text <strong className="tabular-nums text-white">{dashboard.text_feedback ?? 0}</strong>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Mic2 className="h-3.5 w-3.5 text-violet-400/90" />
              Audio <strong className="tabular-nums text-white">{dashboard.audio_feedback ?? 0}</strong>
            </span>
          </div>
        </motion.div>
      </div>

      {/* Charts row 1 */}
      <div className="grid gap-2 lg:grid-cols-3">
        <ChartCard title="Status" icon={<PieChartIcon className="h-3 w-3" />}>
          <ResponsiveContainer width="100%" height={chartH}>
            <PieChart>
              <Pie data={statusPie} dataKey="value" nameKey="name" innerRadius={38} outerRadius={62} paddingAngle={2}>
                {statusPie.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={entry.color}
                    stroke="rgba(15,17,24,0.9)"
                    strokeWidth={1}
                    cursor={onNavigateToBoard ? 'pointer' : 'default'}
                    onClick={() => {
                      const status = STATUS_PIE_MAP[entry.name]
                      if (status && onNavigateToBoard) onNavigateToBoard({ status })
                    }}
                  />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipContentStyle} labelStyle={tooltipLabelStyle} itemStyle={tooltipItemStyle} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Channel" icon={<BarChart3 className="h-3 w-3" />}>
          <ResponsiveContainer width="100%" height={chartH}>
            <BarChart data={sourceBar} barSize={28} margin={{ top: 4, right: 8, left: 6, bottom: 0 }}>
              <XAxis
                dataKey="name"
                tick={{ fontSize: 10, fill: isLight ? 'rgba(71,85,105,0.95)' : 'rgba(148,163,184,0.85)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: isLight ? 'rgba(71,85,105,0.95)' : 'rgba(148,163,184,0.75)' }}
                axisLine={false}
                tickLine={false}
                width={38}
                tickMargin={6}
              />
              <Tooltip contentStyle={tooltipContentStyle} labelStyle={tooltipLabelStyle} itemStyle={tooltipItemStyle} />
              <Bar dataKey="value" radius={[5, 5, 0, 0]}>
                {sourceBar.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={entry.color}
                    cursor={onNavigateToBoard ? 'pointer' : 'default'}
                    onClick={() => {
                      if (!onNavigateToBoard) return
                      onNavigateToBoard({ input_type: entry.name === 'Text' ? 'text' : 'audio' })
                    }}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {canViewCostSafe ? (
          <ChartCard title="AI cost" icon={<Zap className="h-3 w-3" />}>
            <ResponsiveContainer width="100%" height={chartH}>
              <PieChart>
                <Pie data={costPie} dataKey="value" nameKey="name" innerRadius={38} outerRadius={62} paddingAngle={2}>
                  {costPie.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} stroke="rgba(15,17,24,0.9)" strokeWidth={1} cursor="default" />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipContentStyle} labelStyle={tooltipLabelStyle} itemStyle={tooltipItemStyle} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-1 text-[10px] tabular-nums text-slate-400">
              Total ${Number(dashboard.total_ai_cost_usd || 0).toFixed(4)}
            </div>
          </ChartCard>
        ) : (
          <ChartCard title="Access" icon={<Sparkles className="h-3 w-3" />}>
            <p className="py-6 text-center text-[11px] leading-relaxed text-slate-400">
              AI cost charts are hidden for your role.
            </p>
          </ChartCard>
        )}
      </div>

      {/* Charts row 2 + actions */}
      <div className="grid gap-2 lg:grid-cols-3">
        <ChartCard title="Sentiment" icon={<Sparkles className="h-3 w-3" />}>
          <ResponsiveContainer width="100%" height={chartH}>
            <PieChart>
              <Pie
                data={sentimentPie.filter((x) => x.value > 0)}
                dataKey="value"
                nameKey="name"
                innerRadius={38}
                outerRadius={62}
                paddingAngle={2}
              >
                {sentimentPie
                  .filter((x) => x.value > 0)
                  .map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={entry.color}
                      stroke="rgba(15,17,24,0.9)"
                      strokeWidth={1}
                      cursor={onNavigateToBoard ? 'pointer' : 'default'}
                      onClick={() => {
                        const sentiment = SENTIMENT_PIE_MAP[entry.name]
                        if (sentiment && onNavigateToBoard) onNavigateToBoard({ sentiment })
                      }}
                    />
                  ))}
              </Pie>
              <Tooltip contentStyle={tooltipContentStyle} labelStyle={tooltipLabelStyle} itemStyle={tooltipItemStyle} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Topics" icon={<BarChart3 className="h-3 w-3" />} className="lg:col-span-1">
          <div className="flex max-h-[168px] flex-wrap content-start gap-1.5 overflow-y-auto pr-0.5 [scrollbar-width:thin]">
            {topTopics.length === 0 ? (
              <span className="text-[11px] text-slate-500">No topics yet.</span>
            ) : (
              topTopics.map((t, i) => (
                <motion.button
                  key={t}
                  type="button"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.03 }}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="rounded-md border border-white/10 bg-slate-900/30 px-2 py-0.5 text-[10px] font-medium text-slate-200 hover:border-amber-400/30 hover:bg-amber-500/5"
                  onClick={() => onNavigateToBoard?.({ search: t })}
                >
                  {t}
                </motion.button>
              ))
            )}
          </div>
        </ChartCard>

        <ChartCard title="Shortcuts" icon={<LayoutDashboard className="h-3 w-3" />}>
          <div className="flex flex-col gap-1.5">
            <ActionChip
              icon={<img src={APP_LOGO} alt="" className="h-4 w-4 opacity-90" />}
              label="All feedback"
              onClick={() => onNavigateToBoard?.({})}
            />
            <ActionChip icon={<AlertCircle className="h-4 w-4 text-red-300" />} label="High priority" onClick={() => onNavigateToBoard?.({ priority: 'high' })} />
            <ActionChip icon={<Mic2 className="h-4 w-4 text-violet-300" />} label="Audio only" onClick={() => onNavigateToBoard?.({ input_type: 'audio' })} />
          </div>
        </ChartCard>
      </div>

      {/* Recent */}
      <motion.div variants={itemVariants} className="overflow-hidden rounded-xl border border-white/10 bg-slate-900/90">
        <div className="flex items-center justify-between gap-2 border-b border-white/10 px-2.5 py-2">
          <div className="inline-flex items-center gap-2">
            <img src={APP_LOGO} alt="" className="h-6 w-6 rounded-md border border-white/10 bg-black/30 p-0.5" />
            <div>
              <p className="text-[11px] font-semibold text-slate-200">Latest activity</p>
              <p className="text-[10px] text-slate-500">Newest {recentListRows.length} of {totalRows || '—'}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {permissions.includes('feedback.update') ? (
              <Pill label="Can resolve" tone="neutral" />
            ) : (
              <Pill label="Read-only" tone="neutral" />
            )}
          </div>
        </div>

        {recentRows.length === 0 ? (
          isRecentLoading ? (
            <div className="px-3 py-8 text-center text-[11px] text-slate-500">Loading latest activity…</div>
          ) : (
            <div className="px-3 py-8 text-center text-[11px] text-slate-500">No feedback yet.</div>
          )
        ) : (
          <>
            <div className="divide-y divide-white/[0.05]">
            {recentListRows.map((row, idx) => {
              const statusTone =
                row.status === 'completed' ? 'completed' : row.status === 'inprogress' ? 'inprogress' : 'soon'
              const sourceTone = row.input_type === 'audio' ? 'audio' : 'text'
              const primaryTopic = row?.analysis?.analysis?.primary_topic || row.intent || 'General'
              const secondaryTopic = row?.analysis?.analysis?.secondary_topic || ''
              const topLine = `${primaryTopic}${secondaryTopic ? ` · ${secondaryTopic}` : ''}`

              return (
                <motion.div
                  key={row.id}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.04, duration: 0.2 }}
                  className="group flex flex-col gap-2 px-2.5 py-2 transition-colors hover:bg-white/[0.03] sm:flex-row sm:items-start sm:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-[9px] uppercase tracking-wide text-slate-500">
                      {formatDateTime(row.created_at)}
                      {row.submitter_name ? <span className="normal-case text-slate-400"> · {row.submitter_name}</span> : null}
                    </p>
                    <p className="mt-0.5 line-clamp-1 text-[12px] font-semibold text-white">
                      {shorten(row.title || topLine, 72) || topLine}
                    </p>
                    <p className="line-clamp-2 text-[11px] leading-snug text-slate-400">{shorten(row.message, 120) || '—'}</p>
                  </div>

                  <div className="flex shrink-0 flex-col items-stretch gap-1.5 sm:items-end">
                    <div className="flex flex-wrap justify-end gap-1">
                      <Pill
                        label={row.status === 'inprogress' ? 'In Progress' : row.status === 'completed' ? 'Completed' : 'Soon'}
                        tone={statusTone}
                      />
                      <Pill label={row.input_type === 'audio' ? 'Audio' : 'Text'} tone={sourceTone} />
                      {canViewCostSafe ? (
                        <Pill label={`$${Number(row.total_cost_usd || 0).toFixed(2)}`} tone="neutral" />
                      ) : null}
                    </div>
                    <div className="flex flex-wrap justify-end gap-1">
                      {canViewAnalysis ? (
                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          className="rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3 py-2 text-xs text-white"
                          onClick={() => onViewAnalysis(row)}
                        >
                          Analysis
                        </motion.button>
                      ) : null}
                      {canUpdate ? (
                        <>
                          <motion.button
                            type="button"
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            className="rounded-lg border border-amber-500/40 bg-amber-700 hover:bg-amber-600 px-3 py-2 text-xs text-white"
                            onClick={() => onMark(row.id, 'inprogress')}
                          >
                            Mark In Progress
                          </motion.button>
                          <motion.button
                            type="button"
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            className="rounded-lg border border-emerald-500/40 bg-emerald-700 hover:bg-emerald-600 px-3 py-2 text-xs text-white"
                            onClick={() => onMark(row.id, 'completed')}
                          >
                            Mark Completed
                          </motion.button>
                        </>
                      ) : null}
                    </div>
                  </div>
                </motion.div>
              )
            })}
            </div>
            {isRecentLoadingMore ? (
              <div className="px-3 py-2 text-[11px] text-slate-500">Loading more…</div>
            ) : null}
            {hasMoreRecent ? <div ref={loadMoreSentinelRef} className="h-1" /> : null}
          </>
        )}
      </motion.div>
    </motion.div>
  )
}
