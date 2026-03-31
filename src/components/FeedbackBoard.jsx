import React, { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Activity, BarChart3, ChevronDown, ChevronUp, FileText, LayoutGrid, List, Loader2, RotateCcw, Search, Shield, Users, Waves, X } from 'lucide-react'
import AnalysisPanel from './AnalysisPanel'
import AudioPanel from './AudioPanel'
import EvidencePanel from './EvidencePanel'
import SpeakersPanel from './SpeakersPanel'
import TranscriptView from './TranscriptView'
import UsageStats from './UsageStats'
import { API_URL } from '../lib/api'
import { TAB_HINTS } from '../lib/analysisGlossary'
import InfoTip from './common/InfoTip'

/** Text field + clear + search trigger. Applies search on button/Enter; clearing applied search via X or by backspacing to empty updates filters and reloads. */
function FilterSearchBox({
  value,
  appliedFilter = '',
  onDraftChange,
  onSubmit,
  onClear,
  placeholder,
  label,
  className = '',
}) {
  const trimmed = value.trim()
  const showClear = trimmed.length > 0
  const appliedTrimmed = (appliedFilter || '').trim()

  const handleChange = (e) => {
    const v = e.target.value
    // Backspace/delete until empty after a search was applied → clear filter and reload (same as X)
    if (v.trim() === '' && appliedTrimmed !== '') {
      onClear()
      return
    }
    onDraftChange(v)
  }

  return (
    <div
      className={`flex h-8 min-h-8 min-w-0 items-stretch overflow-hidden rounded-lg border border-slate-600/90 bg-slate-900/30 shadow-inner shadow-black/20 ${className}`}
    >
      {label ? (
        <span className="flex shrink-0 items-center border-r border-slate-700/80 bg-slate-900/40 px-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
          {label}
        </span>
      ) : null}
      <input
        type="text"
        inputMode="search"
        autoComplete="off"
        className="min-w-0 flex-1 bg-transparent px-2 py-1 text-xs text-slate-200 outline-none placeholder:text-slate-600"
        value={value}
        onChange={handleChange}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            onSubmit()
          }
        }}
        placeholder={placeholder}
      />
      {showClear ? (
        <button
          type="button"
          className="shrink-0 px-1.5 text-slate-500 transition hover:bg-slate-800/80 hover:text-slate-200"
          aria-label="Clear"
          onClick={onClear}
        >
          <X className="h-3.5 w-3.5" strokeWidth={2.25} />
        </button>
      ) : null}
      <span className="w-px shrink-0 self-stretch bg-slate-700/80" aria-hidden />
      <button
        type="button"
        className="shrink-0 bg-slate-700/45 px-2.5 text-slate-300 transition hover:bg-slate-600/55 hover:text-white"
        aria-label="Search"
        title="Search"
        onClick={onSubmit}
      >
        <Search className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50]

export default function FeedbackBoard({
  rows,
  pagination,
  isPaging = false,
  onPageSizeChange,
  filters,
  setFilters,
  onResetFilters,
  formMeta = { sources: [], departments: [] },
  onPrev,
  onNext,
  canUpdate,
  canViewCost,
  canViewAnalysis,
  permissions = [],
  onMark,
  hideDetails = false,
}) {
  const [expandedRowId, setExpandedRowId] = useState(null)
  const [analysisTab, setAnalysisTab] = useState('analysis')
  const [layoutView, setLayoutView] = useState('list')
  const [draftSearch, setDraftSearch] = useState(() => filters.search || '')
  const [draftCourseCode, setDraftCourseCode] = useState(() => filters.course_code || '')

  useEffect(() => {
    setDraftSearch(filters.search || '')
  }, [filters.search])

  useEffect(() => {
    setDraftCourseCode(filters.course_code || '')
  }, [filters.course_code])
  const sourceMap = useMemo(() => Object.fromEntries((formMeta.sources || []).map((s) => [String(s.id), s.name])), [formMeta.sources])
  const departmentMap = useMemo(() => Object.fromEntries((formMeta.departments || []).map((d) => [String(d.id), d.name])), [formMeta.departments])
  const sentimentOptions = useMemo(() => {
    const seen = new Set()
    for (const row of rows || []) {
      const key = (row?.sentiment || '').toString().trim().toLowerCase()
      if (key) seen.add(key)
    }
    if (filters.sentiment) seen.add(filters.sentiment.toLowerCase())
    const preferred = ['positive', 'neutral', 'negative', 'mixed']
    return Array.from(seen).sort((a, b) => {
      const ai = preferred.indexOf(a)
      const bi = preferred.indexOf(b)
      if (ai !== -1 && bi !== -1) return ai - bi
      if (ai !== -1) return -1
      if (bi !== -1) return 1
      return a.localeCompare(b)
    })
  }, [rows, filters.sentiment])

  const hasActiveFilters = useMemo(() => {
    const f = filters || {}
    return ['search', 'status', 'sentiment', 'input_type', 'source_id', 'department_id', 'course_code', 'priority'].some((k) => String(f[k] ?? '').trim() !== '')
  }, [filters])

  const selectCls =
    'fb-select h-8 max-w-[9.5rem] min-w-[6.5rem] shrink-0 rounded-md border border-slate-700/90 bg-slate-900/30 px-2 py-0 text-xs text-slate-200 outline-none'

  const totalPages = Math.max(1, Math.ceil((pagination.total || 0) / Math.max(1, pagination.page_size || 1)))

  const pageSizeSelectOptions = useMemo(() => {
    const base = [...PAGE_SIZE_OPTIONS]
    const ps = Number(pagination.page_size)
    if (ps && !base.includes(ps)) base.push(ps)
    return base.sort((a, b) => a - b)
  }, [pagination.page_size])

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-2 sm:p-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-stretch">
          <div className="grid min-w-0 flex-1 grid-cols-1 gap-2 sm:grid-cols-2">
            <FilterSearchBox
              className="min-w-0 w-full"
              value={draftSearch}
              appliedFilter={filters.search || ''}
              onDraftChange={setDraftSearch}
              placeholder="Search feedback…"
              onSubmit={() => setFilters({ ...filters, search: draftSearch.trim() })}
              onClear={() => {
                setDraftSearch('')
                setFilters({ ...filters, search: '' })
              }}
            />
            <FilterSearchBox
              className="min-w-0 w-full"
              label="Course"
              value={draftCourseCode}
              appliedFilter={filters.course_code || ''}
              onDraftChange={setDraftCourseCode}
              placeholder="Code"
              onSubmit={() => setFilters({ ...filters, course_code: draftCourseCode.trim() })}
              onClear={() => {
                setDraftCourseCode('')
                setFilters({ ...filters, course_code: '' })
              }}
            />
          </div>
          <button
            type="button"
            onClick={() => onResetFilters?.()}
            disabled={!hasActiveFilters}
            title="Clear all filters"
            className="inline-flex h-8 w-full shrink-0 items-center justify-center gap-1 rounded-md border border-slate-600/80 bg-slate-800/50 px-2.5 text-xs text-slate-200 hover:bg-slate-700/60 disabled:cursor-not-allowed disabled:opacity-40 sm:h-auto sm:w-auto sm:self-center"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </button>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-1.5 gap-y-2 border-t border-slate-800/80 pt-2">
          <select className={selectCls} value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
            <option value="">Status</option>
            <option value="soon">Soon</option>
            <option value="inprogress">In progress</option>
            <option value="completed">Completed</option>
          </select>
          <select className={selectCls} value={filters.sentiment} onChange={(e) => setFilters({ ...filters, sentiment: e.target.value })}>
            <option value="">Sentiment</option>
            {sentimentOptions.map((sentiment) => (
              <option key={sentiment} value={sentiment}>
                {toTitleCase(sentiment)}
              </option>
            ))}
          </select>
          <select className={selectCls} value={filters.input_type} onChange={(e) => setFilters({ ...filters, input_type: e.target.value })}>
            <option value="">Type</option>
            <option value="audio">Audio</option>
            <option value="text">Text</option>
          </select>
          <select className={selectCls} value={filters.priority || ''} onChange={(e) => setFilters({ ...filters, priority: e.target.value })}>
            <option value="">Priority</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <select className={`${selectCls} max-w-[11rem] min-w-[7rem]`} value={filters.source_id} onChange={(e) => setFilters({ ...filters, source_id: e.target.value })}>
            <option value="">Source</option>
            {(formMeta.sources || []).map((s) => (
              <option key={s.id} value={String(s.id)}>
                {s.name}
              </option>
            ))}
          </select>
          <select className={`${selectCls} max-w-[11rem] min-w-[7rem]`} value={filters.department_id} onChange={(e) => setFilters({ ...filters, department_id: e.target.value })}>
            <option value="">Department</option>
            {(formMeta.departments || []).map((d) => (
              <option key={d.id} value={String(d.id)}>
                {d.name}
              </option>
            ))}
          </select>
          <div
            className="inline-flex h-8 w-full shrink-0 overflow-hidden rounded-lg border border-slate-700/90 sm:ml-auto sm:w-auto"
            role="group"
            aria-label="Layout"
          >
            <button
              type="button"
              onClick={() => setLayoutView('list')}
              className={`flex flex-1 items-center justify-center gap-1.5 px-2.5 text-xs sm:flex-initial sm:px-3 ${layoutView === 'list' ? 'bg-slate-700/50 text-white' : 'text-slate-400 hover:bg-slate-800/60'}`}
              title="List view"
            >
              <List className="h-3.5 w-3.5" />
              List
            </button>
            <button
              type="button"
              onClick={() => setLayoutView('grid')}
              className={`flex flex-1 items-center justify-center gap-1.5 border-l border-slate-700/80 px-2.5 text-xs sm:flex-initial sm:px-3 ${layoutView === 'grid' ? 'bg-slate-700/50 text-white' : 'text-slate-400 hover:bg-slate-800/60'}`}
              title="Grid view"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              Grid
            </button>
          </div>
        </div>
      </div>

      <div className="relative min-h-[120px]">
        {isPaging ? (
          <div
            className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-black/30 backdrop-blur-[1px]"
            aria-busy="true"
            aria-label="Loading page"
          >
            <Loader2 className="h-8 w-8 animate-spin text-amber-400/90" />
          </div>
        ) : null}
        <div
          className={
            layoutView === 'grid'
              ? 'grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-3'
              : 'grid grid-cols-1 gap-3'
          }
        >
        {rows.map((row) => (
          <motion.div
            key={row.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className={`rounded-xl border border-slate-800 bg-slate-900/50 p-2.5 sm:p-3 ${layoutView === 'grid' ? 'flex h-full min-h-0 min-w-0 flex-col' : ''}`}
          >
            <div className={`min-w-0 space-y-2 ${layoutView === 'grid' ? 'flex min-h-0 flex-1 flex-col' : ''}`}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className={`min-w-0 ${layoutView === 'grid' ? 'max-w-full' : 'min-w-0 sm:min-w-[200px]'}`}>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold">{row.title}</h3>
                  </div>
                  <div className="mt-1.5 text-xs text-slate-400 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <span className="uppercase tracking-wide">{formatDateTime(row.created_at)}</span>
                    {row.submitter_name ? (
                      <span className="normal-case tracking-normal text-slate-300">
                        · Submitted by <span className="font-medium text-slate-200">{row.submitter_name}</span>
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 justify-end">
                  <SentimentPill value={row.sentiment || 'neutral'} />
                  <StatusPill value={row.status} />
                  <InputTypePill value={row.input_type} />
                  {canViewCost && (
                    <span className="rounded-full border border-slate-700 bg-slate-900/60 px-3 py-1 text-xs text-slate-200">
                      AI Cost: ${Number(row.total_cost_usd || 0).toFixed(4)}
                    </span>
                  )}
                </div>
              </div>

              {!hideDetails && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                  <Meta label="Primary Topic" value={getPrimaryTopic(row)} />
                  <Meta label="Secondary Topic" value={getSecondaryTopic(row)} />
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <MetaPill label="Source" value={sourceMap[String(row.source_id)] || 'Not specified'} />
                <MetaPill label="Department" value={departmentMap[String(row.department_id)] || 'Not specified'} />
                {row.course_code ? <MetaPill label="Course" value={row.course_code} /> : null}
              </div>

              <div className={`flex flex-wrap items-end justify-between gap-3 ${layoutView === 'grid' ? 'mt-auto' : ''}`}>
                {!hideDetails && (
                  <p
                    className={`min-w-0 flex-1 text-xs leading-relaxed text-slate-300 ${layoutView === 'grid' ? 'line-clamp-2 min-h-0 sm:line-clamp-3' : 'min-w-[min(100%,170px)]'}`}
                  >
                    {truncate(row.message, layoutView === 'grid' ? 320 : 220) || '—'}
                  </p>
                )}
                <div className="flex flex-wrap gap-2 justify-end">
                  {canViewAnalysis && row.analysis && (
                    <button
                  className="rounded-md border border-slate-700 bg-slate-800 hover:bg-slate-700 px-2 py-1 text-[11px] text-white"
                      onClick={() => {
                        if (expandedRowId === row.id) {
                          setExpandedRowId(null)
                        } else {
                          setExpandedRowId(row.id)
                          setAnalysisTab('analysis')
                        }
                      }}
                      title={expandedRowId === row.id ? 'Collapse analysis' : 'Expand analysis'}
                    >
                      <span className="inline-flex items-center gap-1.5">
                        {expandedRowId === row.id ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                        Analysis
                      </span>
                    </button>
                  )}

                  {canUpdate && (
                    <>
                      <button
                        className="rounded-md border border-amber-500/40 bg-amber-700 hover:bg-amber-600 px-2 py-1 text-[11px] text-white"
                        onClick={() => onMark(row.id, 'inprogress')}
                      >
                        Mark In Progress
                      </button>
                      <button
                        className="rounded-md border border-emerald-500/40 bg-emerald-700 hover:bg-emerald-600 px-2 py-1 text-[11px] text-white"
                        onClick={() => onMark(row.id, 'completed')}
                      >
                        Mark Completed
                      </button>
                    </>
                  )}
                </div>
              </div>

              {expandedRowId === row.id && canViewAnalysis && row.analysis && (
                <InlineAnalysisPanel
                  row={row}
                  tab={analysisTab}
                  setTab={setAnalysisTab}
                  permissions={permissions}
                  compact={layoutView === 'grid'}
                />
              )}
            </div>
          </motion.div>
        ))}
        </div>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-300">
          Total: {pagination.total}
          {pagination.total > 0 ? (
            <span className="text-slate-500">
              {' '}
              · Page {pagination.page} of {totalPages}
            </span>
          ) : null}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-end">
          <div className="flex items-center gap-1.5">
            <label htmlFor="fb-page-size" className="whitespace-nowrap text-xs text-slate-500">
              Per page
            </label>
            <select
              id="fb-page-size"
              className="fb-select h-8 min-w-[3.25rem] rounded-md border border-slate-700/90 bg-slate-900/30 px-2 text-xs text-slate-200 outline-none"
              value={pagination.page_size}
              onChange={(e) => onPageSizeChange?.(Number(e.target.value))}
            >
              {pageSizeSelectOptions.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            disabled={pagination.page <= 1}
            className="rounded-lg bg-slate-800 px-3 py-2 text-sm text-slate-200 disabled:opacity-40"
            onClick={onPrev}
          >
            Prev
          </button>
          <button
            type="button"
            disabled={pagination.page >= totalPages || pagination.total === 0}
            className="rounded-lg bg-slate-800 px-3 py-2 text-sm text-slate-200 disabled:opacity-40"
            onClick={onNext}
          >
            Next
          </button>
        </div>
      </div>
      </div>
    </div>
  )
}

const INLINE_TABS = [
  { id: 'analysis', label: 'Analysis', icon: BarChart3 },
  { id: 'evidence', label: 'Evidence', icon: Shield },
  { id: 'speakers', label: 'Speakers', icon: Users },
  { id: 'audio', label: 'Audio Signal', icon: Waves },
  { id: 'transcript', label: 'Transcript', icon: FileText },
  { id: 'usage', label: 'Usage', icon: Activity },
]

function InlineAnalysisPanel({ row, permissions, tab, setTab, compact = false }) {
  const analysisBundle = row?.analysis || null
  const analysis = analysisBundle?.analysis || null
  const transcriptPrivacy = analysisBundle?.transcript_privacy ?? null
  const audio = analysisBundle?.audio || null
  const transcript =
    String(analysisBundle?.transcript ?? '').trim() || String(row?.message ?? '').trim() || ''
  const usage = analysisBundle?.usage || null
  const analysisMeta = {
    sourceLabel: audio ? 'Voice analysis' : 'Text analysis',
    analyzedAt: row?.created_at
      ? new Date(row.created_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
      : undefined,
  }
  const canViewAnalysis = permissions.includes('feedback.analysis.view') || permissions.includes('system.superadmin')
  const canViewTranscript = permissions.includes('feedback.transcript.original.view') || permissions.includes('system.superadmin') || canViewAnalysis
  const canViewUsage = permissions.includes('ai.cost.view') || permissions.includes('system.superadmin')
  const canDownloadAudio =
    permissions.includes('feedback.audio.download') || permissions.includes('system.superadmin')

  const visibleTabs = useMemo(() => {
    const out = []
    if (canViewAnalysis) out.push('analysis', 'evidence', 'speakers')
    if (canViewAnalysis && audio) out.push('audio')
    if (canViewTranscript) out.push('transcript')
    if (canViewUsage) out.push('usage')
    return INLINE_TABS.filter((t) => out.includes(t.id))
  }, [audio, canViewAnalysis, canViewTranscript, canViewUsage])

  if (!analysisBundle) {
    return <div className="rounded-xl border border-slate-700 p-4 text-sm text-slate-300">No analysis data found for this feedback.</div>
  }

  return (
    <div
      className={`mt-2 min-w-0 rounded-xl border border-slate-700 bg-slate-900/30 space-y-3 ${compact ? 'p-2 sm:p-3' : 'p-3'}`}
    >
      <div
        className={
          compact
            ? 'glass-effect grid grid-cols-1 gap-1.5 rounded-xl p-2 sm:grid-cols-2'
            : 'glass-effect grid grid-cols-2 gap-2 rounded-xl p-3 md:grid-cols-5'
        }
      >
        <Metric compact={compact} label="Sentiment" value={analysis?.overall_sentiment || row.sentiment || 'neutral'} />
        <Metric compact={compact} label="Emotion" value={analysis?.dominant_emotion || '—'} />
        <Metric compact={compact} label="Confidence" value={analysis?.confidence_score != null ? `${Math.round(analysis.confidence_score * 100)}%` : '—'} />
        <Metric compact={compact} label="Conflict" value={analysis?.conflict_detected ? 'Detected' : 'None'} />
        <Metric compact={compact} label="Negativity" value={analysis?.negativity_detected ? 'Detected' : 'None'} />
      </div>

      <div
        className={`glass-effect rounded-xl p-1 [scrollbar-gutter:stable] ${
          compact ? 'flex min-w-0 flex-wrap gap-1.5' : 'flex gap-1 overflow-x-auto overflow-y-visible'
        }`}
        role="tablist"
        aria-label="Analysis sections"
      >
        {visibleTabs.map(({ id, label, icon: Icon }) => (
          <div
            key={id}
            role="tab"
            aria-selected={tab === id}
            tabIndex={tab === id ? 0 : -1}
            onClick={() => setTab(id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                setTab(id)
              }
            }}
            className={`flex shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-2 text-xs font-medium transition-all sm:gap-2 sm:px-3 ${
              tab === id ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white' : 'text-gray-400 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" />
            <span className="flex min-w-0 items-center gap-1">
              {label}
              {TAB_HINTS[id] ? <InfoTip text={TAB_HINTS[id]} /> : null}
            </span>
          </div>
        ))}
      </div>

      <div className="min-w-0 overflow-x-auto">
        {tab === 'analysis' && canViewAnalysis && (
          <AnalysisPanel
            analysis={analysis}
            transcript={transcript}
            meta={analysisMeta}
            hasAudio={!!audio}
            compact={compact}
          />
        )}
        {tab === 'evidence' && canViewAnalysis && (
          <EvidencePanel
            analysis={analysis}
            transcript={transcript}
            audio={audio}
            hasAudio={!!audio}
            usage={usage}
            transcriptPrivacy={transcriptPrivacy}
            compact={compact}
          />
        )}
        {tab === 'speakers' && canViewAnalysis && <SpeakersPanel analysis={analysis} />}
        {tab === 'audio' && canViewAnalysis && audio && (
          <AudioPanel
            audio={audio}
            audioFile={null}
            audioUrl={row?.has_audio_blob ? `${API_URL}/feedback/${row.id}/audio` : null}
            audioDownloadUrl={
              row?.has_audio_blob && canDownloadAudio ? `${API_URL}/feedback/${row.id}/audio/download` : null
            }
            audioDownloadFilename={row?.audio_file || `feedback-${row.id}.audio`}
            segmentInsights={analysis?.segment_insights}
            analysis={analysis}
          />
        )}
        {tab === 'transcript' && canViewTranscript && <TranscriptView transcript={transcript} />}
        {tab === 'usage' && canViewUsage && <UsageStats usage={usage} hasAudio={!!audio} />}
      </div>
    </div>
  )
}

function Metric({ label, value, compact = false }) {
  if (compact) {
    return (
      <div className="flex min-w-0 items-start justify-between gap-3 rounded-lg border border-white/10 bg-slate-900/30 px-2.5 py-2 sm:px-3">
        <p className="shrink-0 text-[10px] font-medium uppercase tracking-wide text-gray-500">{label}</p>
        <p className="min-w-0 break-words text-right text-xs font-semibold capitalize leading-snug text-white">{value}</p>
      </div>
    )
  }
  return (
    <div className="text-center">
      <p className="mb-1 text-[11px] text-gray-500">{label}</p>
      <p className="text-sm font-semibold capitalize">{value}</p>
    </div>
  )
}

function MetaPill({ label, value }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-slate-700 bg-slate-900/40 px-2 py-0.5 text-[11px] text-slate-300">
      <span className="text-slate-400">{label}:</span>
      <span className="text-slate-200">{value}</span>
    </span>
  )
}

function Meta({ label, value }) {
  return (
    <div className="rounded-md bg-slate-900/45 border border-slate-700 px-2 py-1.5">
      <p className="text-[10px] uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-0.5 text-[12px] text-slate-200 leading-snug line-clamp-2">{value || '—'}</p>
    </div>
  )
}

function formatDateTime(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString()
}

function getPrimaryTopic(row) {
  return row?.analysis?.analysis?.primary_topic || row?.intent || 'General'
}

function getSecondaryTopic(row) {
  return row?.analysis?.analysis?.secondary_topic || '—'
}

function truncate(text, n) {
  if (!text) return ''
  return text.length > n ? `${text.slice(0, n)}...` : text
}

function toTitleCase(value) {
  return value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function StatusPill({ value }) {
  const map = {
    completed: 'bg-emerald-500/15 border-emerald-400/25 text-emerald-200',
    inprogress: 'bg-amber-500/15 border-amber-400/25 text-amber-200',
    soon: 'bg-sky-500/15 border-sky-400/25 text-sky-200',
  }
  return (
    <span className={`px-2.5 py-1 rounded-full border text-xs uppercase tracking-wide ${map[value] || 'bg-slate-500/10 border-slate-400/20 text-slate-200'}`}>
      {value === 'inprogress' ? 'In Progress' : value === 'completed' ? 'Completed' : 'Soon'}
    </span>
  )
}

function InputTypePill({ value }) {
  const map = {
    audio: 'bg-indigo-500/15 border-indigo-400/25 text-indigo-200',
    text: 'bg-cyan-500/15 border-cyan-400/25 text-cyan-200',
  }
  return (
    <span className={`px-2.5 py-1 rounded-full border text-xs uppercase ${map[value] || 'bg-slate-500/10 border-slate-400/20 text-slate-200'}`}>
      {value === 'audio' ? 'Audio' : 'Text'}
    </span>
  )
}

function SentimentPill({ value }) {
  const map = {
    positive: 'bg-emerald-500/15 border-emerald-400/25 text-emerald-200',
    negative: 'bg-red-500/15 border-red-400/25 text-red-200',
    neutral: 'bg-slate-500/10 border-slate-400/20 text-slate-200',
    mixed: 'bg-yellow-500/15 border-yellow-400/25 text-yellow-200',
  }
  const v = (value || 'neutral').toLowerCase()
  return (
    <span className={`px-2.5 py-1 rounded-full border text-xs uppercase ${map[v] || map.neutral}`}>
      {v}
    </span>
  )
}
