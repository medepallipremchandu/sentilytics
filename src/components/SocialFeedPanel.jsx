import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle, Download, Loader2, Rss, ShieldCheck } from 'lucide-react'
import { apiFetch } from '../lib/api'
import { useTheme } from './ThemeSwitcher'

function connectionTone(ok, isDark) {
  if (ok) return isDark ? 'text-emerald-400' : 'text-emerald-700'
  return isDark ? 'text-amber-400/95' : 'text-amber-700'
}

const CONSENT_TERMS =
  'I understand this feature retrieves posts from third-party APIs (Reddit, Bluesky, and/or Facebook Graph where configured) for demonstration or research workflows, and I am responsible for complying with applicable terms, privacy law, and institutional ethics requirements.'

function downloadCsv(rows, filename) {
  if (!rows?.length) return
  const keys = Object.keys(rows[0])
  const esc = (v) => {
    const s = v == null ? '' : String(v)
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
    return s
  }
  const lines = [keys.join(','), ...rows.map((r) => keys.map((k) => esc(r[k])).join(','))]
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
  URL.revokeObjectURL(a.href)
}

function downloadExcel(rows, filename) {
  if (!rows?.length) return
  const keys = Object.keys(rows[0])
  const escapeHtml = (value) =>
    String(value == null ? '' : value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;')
  const header = keys.map((k) => `<th>${escapeHtml(k)}</th>`).join('')
  const body = rows
    .map((r) => `<tr>${keys.map((k) => `<td>${escapeHtml(r[k])}</td>`).join('')}</tr>`)
    .join('')
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8" /></head><body><table><thead><tr>${header}</tr></thead><tbody>${body}</tbody></table></body></html>`
  const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
  URL.revokeObjectURL(a.href)
}

export default function SocialFeedPanel({ token, notify, formMeta, permissions, onImportDone }) {
  const { mode } = useTheme()
  const isDark = mode === 'dark'
  const canImport = permissions.includes('feedback.create')
  const [status, setStatus] = useState(null)
  const [loadingStatus, setLoadingStatus] = useState(true)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [platformReddit, setPlatformReddit] = useState(false)
  const [platformBluesky, setPlatformBluesky] = useState(false)
  const [platformFacebook, setPlatformFacebook] = useState(false)
  const defaultsAppliedRef = useRef(false)
  const [keywordsCsv, setKeywordsCsv] = useState('')
  const [includeRedditComments, setIncludeRedditComments] = useState(false)
  const [limitPerSub, setLimitPerSub] = useState(25)
  const [consentA, setConsentA] = useState(false)
  const [consentB, setConsentB] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [importing, setImporting] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [rows, setRows] = useState([])
  const [warnings, setWarnings] = useState([])
  const [selected, setSelected] = useState(() => new Set())
  const [aiSelected, setAiSelected] = useState(() => new Set())
  const [sourceId, setSourceId] = useState('')
  const [departmentId, setDepartmentId] = useState('')

  const loadStatus = useCallback(async (opts = {}) => {
    setLoadingStatus(true)
    try {
      const q = opts.refresh ? '?refresh=1' : ''
      const s = await apiFetch(`/integrations/social/status${q}`, { token })
      setStatus(s)
    } catch (e) {
      setStatus(null)
      notify('error', e.message || 'Could not load integration status.')
    } finally {
      setLoadingStatus(false)
    }
  }, [token, notify])

  useEffect(() => {
    defaultsAppliedRef.current = false
  }, [token])

  useEffect(() => {
    loadStatus()
  }, [loadStatus])

  useEffect(() => {
    if (loadingStatus || !status || defaultsAppliedRef.current) return
    defaultsAppliedRef.current = true
    setPlatformReddit(Boolean(status.reddit_connected))
    setPlatformBluesky(Boolean(status.bluesky_connected))
    setPlatformFacebook(Boolean(status.facebook_connected))
  }, [loadingStatus, status])

  useEffect(() => {
    if (status && !status.reddit_oauth_connected) {
      setIncludeRedditComments(false)
    }
  }, [status?.reddit_oauth_connected])

  const consentFetchOk = consentA && consentB

  const tc = useMemo(() => {
    if (isDark) {
      return {
        card: 'rounded-2xl border border-slate-800 bg-[#101116] shadow-[0_0_0_1px_rgba(255,255,255,0.03)]',
        cardHead: 'border-b border-slate-800 px-6 py-4',
        title: 'inline-flex items-center gap-2 text-lg font-semibold text-slate-100',
        rss: 'h-5 w-5 text-[#5eb0e8]',
        lead: 'mt-1 text-xs text-slate-400',
        body: 'space-y-4 p-6',
        alert: 'rounded-xl border border-amber-500/35 bg-amber-950/20 p-3 text-xs text-amber-100/95',
        alertIcon: 'h-4 w-4 shrink-0 text-amber-400/90',
        alertStrong: 'font-medium text-amber-50',
        statusPanel: 'rounded-lg border border-slate-700/80 bg-slate-950/45 px-3 py-2.5 text-xs text-slate-300',
        statusLoading: 'inline-flex items-center gap-2 text-slate-400',
        spin: 'h-3.5 w-3.5 animate-spin text-[#5eb0e8]',
        statusLine: 'flex flex-wrap gap-x-4 gap-y-1 text-slate-300',
        sep: 'text-slate-500',
        hint: 'text-[11px] leading-snug text-slate-500',
        code: 'rounded bg-slate-800/90 px-0.5 font-mono text-[11px] text-slate-200',
        recheck: 'shrink-0 rounded-md border border-slate-600 bg-slate-800/90 px-2 py-1 text-[11px] font-medium text-slate-200 shadow-sm transition hover:border-slate-500 hover:bg-slate-700/90 disabled:opacity-50',
        label: 'mb-1 block text-xs font-medium text-slate-400',
        input:
          'w-full rounded-lg border border-slate-700/80 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 shadow-inner focus:border-[#0970b8]/50 focus:outline-none focus:ring-1 focus:ring-[#0970b8]/30',
        numInput:
          'w-28 rounded-lg border border-slate-700/80 bg-slate-950/60 px-2 py-1.5 text-sm text-slate-100 shadow-inner focus:border-[#0970b8]/50 focus:outline-none focus:ring-1 focus:ring-[#0970b8]/30',
        textarea:
          'min-h-[4.5rem] w-full rounded-lg border border-slate-700/80 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 shadow-inner placeholder:text-slate-500 focus:border-[#0970b8]/50 focus:outline-none focus:ring-1 focus:ring-[#0970b8]/30',
        fieldHint: 'mt-1 text-[11px] text-slate-500',
        sectionTitle: 'mb-2 text-xs font-medium text-slate-400',
        checkLabel: 'inline-flex cursor-pointer items-center gap-2 text-sm text-slate-200 hover:text-slate-100',
        checkBorder: 'rounded border-slate-600',
        consentBox: 'space-y-2 rounded-xl border border-slate-700/80 bg-slate-950/45 p-3',
        consentHeading: 'text-xs font-semibold uppercase tracking-wide text-slate-500',
        consentRow: 'flex cursor-pointer gap-2 text-xs text-slate-300',
        fetchBtn:
          'inline-flex items-center gap-2 rounded-lg border border-[#0970b8]/45 bg-[#0970b8]/15 px-4 py-2 text-sm font-medium text-slate-100 shadow-sm transition hover:border-[#0970b8]/55 hover:bg-[#0970b8]/28 disabled:opacity-50',
        warnBox: 'rounded-xl border border-amber-500/35 bg-amber-950/20 p-3 text-xs text-amber-100/95',
        warnTitle: 'font-medium text-amber-50',
        warnList: 'mt-1 list-inside list-disc text-amber-100/85 marker:text-amber-500/80',
        previewCard: 'rounded-2xl border border-slate-800 bg-[#101116] shadow-[0_0_0_1px_rgba(255,255,255,0.03)]',
        previewHead: 'flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 px-4 py-3',
        previewTitle: 'text-sm font-medium text-slate-200',
        toolBtn:
          'inline-flex items-center gap-1 rounded-lg border border-slate-600/90 bg-slate-800/50 px-2 py-1 text-xs text-slate-200 transition hover:border-slate-500 hover:bg-slate-800',
        toolBtnPlain: 'rounded-lg border border-slate-600/90 bg-slate-800/50 px-2 py-1 text-xs text-slate-200 transition hover:border-slate-500 hover:bg-slate-800',
        importPanel: 'mb-4 grid gap-3 rounded-xl border border-slate-700/70 bg-slate-950/35 p-3 md:grid-cols-2',
        importLabel: 'mb-1 block text-xs text-slate-500',
        select:
          'fb-select w-full rounded-lg border border-slate-700/80 bg-slate-950/60 px-2 py-2 text-sm text-slate-100 shadow-inner focus:border-[#0970b8]/50 focus:outline-none focus:ring-1 focus:ring-[#0970b8]/30 [&>option]:bg-[#1a1b24] [&>option]:text-slate-100',
        aiRow: 'flex cursor-pointer items-center gap-2 text-xs text-slate-300 md:col-span-2 hover:text-slate-200',
        tableOuter: 'max-h-[min(520px,55vh)] overflow-auto rounded-lg border border-slate-800/90 bg-slate-950/20',
        table: 'min-w-[980px] w-full border-collapse text-left text-xs text-slate-200',
        thead: 'sticky top-0 z-10 border-b border-slate-700/80 bg-[#0c0d12]/95 backdrop-blur supports-[backdrop-filter]:bg-[#0c0d12]/90',
        trHead: 'border-b border-slate-700/80 text-slate-400',
        tbody: 'bg-[#101116]/80',
        tr: 'border-b border-slate-800/60 align-top transition hover:bg-slate-800/25',
        contentCell: 'p-2 max-w-[280px] whitespace-pre-wrap break-words text-slate-300',
        titleInCell: 'font-medium text-slate-200',
        tsCell: 'p-2 whitespace-nowrap text-slate-400',
        link: 'font-medium text-[#5eb0e8] underline decoration-[#5eb0e8]/40 underline-offset-2 transition hover:text-[#7ec4f0]',
        importBtn:
          'rounded-lg border border-[#05924a]/45 bg-[#05924a]/12 px-4 py-2 text-sm font-medium text-emerald-50 shadow-sm transition hover:border-[#05924a]/55 hover:bg-[#05924a]/22 disabled:opacity-50',
        denied: 'text-xs text-amber-400/90',
      }
    }
    return {
      card: 'rounded-2xl border border-slate-200 bg-white shadow-sm',
      cardHead:
        'border-b border-slate-200 px-6 py-4 bg-gradient-to-r from-emerald-50/90 via-white to-sky-50/85',
      title: 'inline-flex items-center gap-2 text-lg font-semibold text-slate-900',
      rss: 'h-5 w-5 text-[#0970b8]',
      lead: 'mt-1 text-xs text-slate-600',
      body: 'space-y-4 p-6',
      alert: 'rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-950',
      alertIcon: 'h-4 w-4 shrink-0 text-amber-600',
      alertStrong: 'font-medium text-amber-900',
      statusPanel: 'rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-700',
      statusLoading: 'inline-flex items-center gap-2 text-slate-600',
      spin: 'h-3.5 w-3.5 animate-spin text-[#0970b8]',
      statusLine: 'flex flex-wrap gap-x-4 gap-y-1 text-slate-700',
      sep: 'text-slate-500',
      hint: 'text-[11px] leading-snug text-slate-600',
      code: 'rounded bg-slate-200/90 px-0.5 font-mono text-[11px] text-slate-800',
      recheck:
        'shrink-0 rounded-md border border-slate-300 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50',
      label: 'mb-1 block text-xs font-medium text-slate-600',
      input:
        'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-[#0970b8] focus:outline-none focus:ring-2 focus:ring-[#0970b8]/25',
      numInput:
        'w-28 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 shadow-sm focus:border-[#0970b8] focus:outline-none focus:ring-2 focus:ring-[#0970b8]/25',
      textarea:
        'min-h-[4.5rem] w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-[#0970b8] focus:outline-none focus:ring-2 focus:ring-[#0970b8]/25',
      fieldHint: 'mt-1 text-[11px] text-slate-500',
      sectionTitle: 'mb-2 text-xs font-medium text-slate-600',
      checkLabel: 'inline-flex cursor-pointer items-center gap-2 text-sm text-slate-700 hover:text-slate-900',
      checkBorder: 'rounded border-slate-400',
      consentBox: 'space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3',
      consentHeading: 'text-xs font-semibold uppercase tracking-wide text-slate-500',
      consentRow: 'flex cursor-pointer gap-2 text-xs text-slate-700',
      fetchBtn:
        'inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#0970b8] to-[#05924a] px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:brightness-105 disabled:opacity-50 disabled:hover:brightness-100',
      warnBox: 'rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-950',
      warnTitle: 'font-medium text-amber-900',
      warnList: 'mt-1 list-inside list-disc text-amber-900/90 marker:text-amber-600',
      previewCard: 'rounded-2xl border border-slate-200 bg-white shadow-sm',
      previewHead: 'flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50/80 px-4 py-3',
      previewTitle: 'text-sm font-medium text-slate-800',
      toolBtn:
        'inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-50',
      toolBtnPlain: 'rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-50',
      importPanel: 'mb-4 grid gap-3 rounded-xl border border-slate-200 bg-slate-50/90 p-3 md:grid-cols-2',
      importLabel: 'mb-1 block text-xs text-slate-600',
      select:
        'fb-select w-full rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm text-slate-900 shadow-sm focus:border-[#0970b8] focus:outline-none focus:ring-2 focus:ring-[#0970b8]/25',
      aiRow: 'flex cursor-pointer items-center gap-2 text-xs text-slate-700 md:col-span-2 hover:text-slate-900',
      tableOuter: 'max-h-[min(520px,55vh)] overflow-auto rounded-lg border border-slate-200 bg-white',
      table: 'min-w-[980px] w-full border-collapse text-left text-xs text-slate-800',
      thead: 'sticky top-0 z-10 border-b border-slate-200 bg-slate-100',
      trHead: 'border-b border-slate-200 text-slate-600',
      tbody: 'bg-white',
      tr: 'border-b border-slate-100 align-top transition hover:bg-sky-50/40',
      contentCell: 'p-2 max-w-[280px] whitespace-pre-wrap break-words text-slate-700',
      titleInCell: 'font-medium text-slate-900',
      tsCell: 'p-2 whitespace-nowrap text-slate-500',
      link: 'font-medium text-[#0970b8] underline decoration-[#0970b8]/35 underline-offset-2 transition hover:text-[#075a94]',
      importBtn:
        'rounded-lg border border-[#05924a]/50 bg-[#05924a] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#047d3f] disabled:opacity-50',
      denied: 'text-xs text-amber-800',
    }
  }, [isDark])

  const platforms = useMemo(() => {
    const p = []
    if (platformReddit) p.push('reddit')
    if (platformBluesky) p.push('bluesky')
    if (platformFacebook) p.push('facebook')
    return p
  }, [platformReddit, platformBluesky, platformFacebook])

  const toggleRow = (key) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const clearSelection = () => {
    setSelected(new Set())
    setAiSelected(new Set())
  }

  const toggleAllImport = (checked) => {
    if (checked) {
      setSelected(new Set(rows.map((r) => r.import_key)))
      return
    }
    setSelected(new Set())
  }

  const toggleAllAi = (checked) => {
    if (!checked) {
      setAiSelected(new Set())
      return
    }
    setAiSelected(new Set(rows.map((r) => r.import_key)))
  }

  const toggleAiRow = (importKey) => {
    setAiSelected((prev) => {
      const next = new Set(prev)
      if (next.has(importKey)) next.delete(importKey)
      else next.add(importKey)
      return next
    })
  }

  const onToggleReddit = (checked) => {
    setPlatformReddit(checked)
    if (!checked) setIncludeRedditComments(false)
  }

  const onToggleBluesky = (checked) => {
    setPlatformBluesky(checked)
  }

  const onToggleFacebook = (checked) => {
    setPlatformFacebook(checked)
  }

  const handlePreview = async (e) => {
    e.preventDefault()
    if (!startDate || !endDate) {
      notify('warning', 'Choose a start and end date.')
      return
    }
    if (!consentFetchOk) {
      notify('warning', 'Confirm both consent checkboxes before fetching.')
      return
    }
    if (!platforms.length) {
      notify('warning', 'Select at least one platform.')
      return
    }
    const kwRaw = (keywordsCsv || '').trim()
    if (!kwRaw) {
      notify('warning', 'Enter at least one keyword (comma-separated), e.g. unimelb, assignment stress.')
      return
    }

    const filteredPlatforms = [...platforms]
    setFetching(true)
    setRows([])
    setWarnings([])
    clearSelection()
    try {
      const data = await apiFetch('/integrations/social/preview', {
        method: 'POST',
        token,
        body: JSON.stringify({
          start_date: startDate,
          end_date: endDate,
          platforms: filteredPlatforms,
          keywords: kwRaw,
          include_reddit_comments: includeRedditComments,
          limit_per_subreddit: Number(limitPerSub),
          consent_fetch_public_data: true,
        }),
      })
      setRows(data.rows || [])
      setWarnings(data.warnings || [])
      notify('success', `Preview ready (${data.count || 0} rows).`)
    } catch (err) {
      notify('error', err.message || 'Preview failed.')
    } finally {
      setFetching(false)
    }
  }

  const selectedItems = useMemo(
    () => rows.filter((r) => selected.has(r.import_key)),
    [rows, selected],
  )
  const aiItems = useMemo(
    () => rows.filter((r) => aiSelected.has(r.import_key)),
    [rows, aiSelected],
  )
  const allRowsSelected = rows.length > 0 && selected.size === rows.length
  const someRowsSelected = selected.size > 0 && !allRowsSelected
  const allAiRowsSelected = rows.length > 0 && aiSelected.size === rows.length
  const someAiRowsSelected = aiSelected.size > 0 && !allAiRowsSelected

  const handleImportOnly = async () => {
    if (!canImport) {
      notify('error', 'Your role needs permission to submit feedback to import rows.')
      return
    }
    if (!selectedItems.length) {
      notify('warning', 'Select at least one row to import.')
      return
    }
    setImporting(true)
    try {
      await apiFetch('/integrations/social/import', {
        method: 'POST',
        token,
        body: JSON.stringify({
          items: selectedItems.map((r) => ({
            import_key: r.import_key,
            platform: r.platform,
            post_id: r.post_id,
            channel: r.channel,
            university_matched: r.university_matched,
            post_type: r.post_type,
            title: r.title,
            content: r.content,
            timestamp_utc: r.timestamp_utc,
            url: r.url,
            author: r.author ?? '',
            run_ai_analysis: false,
          })),
          source_id: sourceId ? Number(sourceId) : null,
          department_id: departmentId ? Number(departmentId) : null,
        }),
      })
      notify('success', `Imported ${selectedItems.length} item(s) as feedback.`)
      setSelected(new Set())
      onImportDone?.()
    } catch (err) {
      notify('error', err.message || 'Import failed.')
    } finally {
      setImporting(false)
    }
  }

  const handleAnalyzeOnly = async () => {
    if (!canImport) {
      notify('error', 'Your role needs permission to submit feedback to run AI analysis.')
      return
    }
    if (!aiItems.length) {
      notify('warning', 'Select at least one row in the AI column to analyze.')
      return
    }
    setAnalyzing(true)
    try {
      await apiFetch('/integrations/social/import', {
        method: 'POST',
        token,
        body: JSON.stringify({
          items: aiItems.map((r) => ({
            import_key: r.import_key,
            platform: r.platform,
            post_id: r.post_id,
            channel: r.channel,
            university_matched: r.university_matched,
            post_type: r.post_type,
            title: r.title,
            content: r.content,
            timestamp_utc: r.timestamp_utc,
            url: r.url,
            author: r.author ?? '',
            run_ai_analysis: true,
          })),
          source_id: sourceId ? Number(sourceId) : null,
          department_id: departmentId ? Number(departmentId) : null,
        }),
      })
      notify('success', `Analyzed ${aiItems.length} item(s) with Azure AI and imported as feedback.`)
      setAiSelected(new Set())
      onImportDone?.()
    } catch (err) {
      notify('error', err.message || 'AI analysis import failed.')
    } finally {
      setAnalyzing(false)
    }
  }

  return (
    <div className="brand-social-feed space-y-4">
      <div className={tc.card}>
        <div className={tc.cardHead}>
          <h2 className={tc.title}>
            <Rss className={tc.rss} aria-hidden />
            Social feed demo
          </h2>
          <p className={tc.lead}>
            Preview Reddit, Bluesky, and optional Facebook Page posts using your comma-separated keywords. Import selected rows into feedback; optionally enable <span className="font-medium">AI</span> per row for Azure sentiment (quota per analyzed row).
          </p>
        </div>

        <div className={tc.body}>
          <div className={tc.alert}>
            <div className="flex gap-2">
              <AlertTriangle className={tc.alertIcon} aria-hidden />
              <p>
                This tab is only visible with the <span className={tc.alertStrong}>Social feed demo</span> permission. Fetching calls third-party public APIs from the
                server. Importing requires <span className={tc.alertStrong}>Submit Feedback</span>. Use ethics review and data minimisation appropriate to your institution.
              </p>
            </div>
          </div>

          <div className={tc.statusPanel}>
            {loadingStatus ? (
              <span className={tc.statusLoading}>
                <Loader2 className={tc.spin} /> Checking integration status…
              </span>
            ) : (
              <div className="space-y-1.5">
                <div className={tc.statusLine}>
                  <span>
                    Bluesky:{' '}
                    <span className={`font-medium ${connectionTone(Boolean(status?.bluesky_connected), isDark)}`}>
                      {status?.bluesky_connected ? 'Connected' : 'Not connected'}
                    </span>
                  </span>
                  <span>
                    Reddit:{' '}
                    <span className={`font-medium ${connectionTone(Boolean(status?.reddit_search_connected), isDark)}`}>
                      {status?.reddit_search_connected ? 'Connected' : 'Not connected'}
                    </span>
                  </span>
                  <span>
                    Facebook:{' '}
                    <span className={`font-medium ${connectionTone(Boolean(status?.facebook_connected), isDark)}`}>
                      {status?.facebook_connected ? 'Connected' : 'Not connected'}
                    </span>
                  </span>
                </div>
                <p className={tc.hint}>
                  Preview tries selected platforms directly; if any provider is unavailable, warnings will appear in the results.
                </p>
              </div>
            )}
          </div>

          <form onSubmit={handlePreview} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className={tc.label}>Start date</label>
                <input type="date" className={tc.input} value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
              </div>
              <div>
                <label className={tc.label}>End date</label>
                <input type="date" className={tc.input} value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
              </div>
            </div>

            <div>
              <label className={tc.label}>Keywords (comma-separated)</label>
              <textarea
                className={tc.textarea}
                placeholder="e.g. unimelb, assignment deadline, mental health"
                value={keywordsCsv}
                onChange={(e) => setKeywordsCsv(e.target.value)}
                required
              />
              <p className={tc.fieldHint}>Used for Reddit/Bluesky search and to filter Facebook Page post text (when Facebook is connected).</p>
            </div>

            <div>
              <p className={tc.sectionTitle}>Platforms</p>
              <div className="flex flex-wrap gap-3">
                <label className={tc.checkLabel}>
                  <input type="checkbox" checked={platformReddit} onChange={(e) => onToggleReddit(e.target.checked)} className={`${tc.checkBorder} accent-[#0970b8] focus:ring-[#0970b8]/40`} />
                  Reddit
                </label>
                <label className={tc.checkLabel}>
                  <input type="checkbox" checked={platformBluesky} onChange={(e) => onToggleBluesky(e.target.checked)} className={`${tc.checkBorder} accent-[#0970b8] focus:ring-[#0970b8]/40`} />
                  Bluesky
                </label>
                <label className={tc.checkLabel}>
                  <input type="checkbox" checked={platformFacebook} onChange={(e) => onToggleFacebook(e.target.checked)} className={`${tc.checkBorder} accent-[#0970b8] focus:ring-[#0970b8]/40`} />
                  Facebook (Page only)
                </label>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <div>
                <label className={tc.label}>Limit per keyword / Page fetch</label>
                <input type="number" min={5} max={100} className={tc.numInput} value={limitPerSub} onChange={(e) => setLimitPerSub(e.target.value)} />
              </div>
            </div>

            <div className={tc.consentBox}>
              <p className={tc.consentHeading}>Consent (required to fetch)</p>
              <label className={tc.consentRow}>
                <input type="checkbox" checked={consentA} onChange={(e) => setConsentA(e.target.checked)} className={`mt-0.5 ${tc.checkBorder} accent-[#0970b8] focus:ring-[#0970b8]/40`} />
                <span>{CONSENT_TERMS}</span>
              </label>
              <label className={tc.consentRow}>
                <input type="checkbox" checked={consentB} onChange={(e) => setConsentB(e.target.checked)} className={`mt-0.5 ${tc.checkBorder} accent-[#0970b8] focus:ring-[#0970b8]/40`} />
                <span className="inline-flex items-start gap-1">
                  <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#05924a]" aria-hidden />I authorise this application (server-side) to call the selected third-party APIs with the parameters above.
                </span>
              </label>
            </div>

            <button type="submit" disabled={fetching || !consentFetchOk} className={tc.fetchBtn}>
              {fetching ? <Loader2 className={`h-4 w-4 animate-spin ${isDark ? 'text-slate-200' : 'text-white'}`} /> : null}
              {fetching ? 'Fetching…' : 'Fetch preview'}
            </button>
          </form>
        </div>
      </div>

      {warnings.length > 0 && (
        <div className={tc.warnBox}>
          <p className={tc.warnTitle}>Warnings</p>
          <ul className={tc.warnList}>
            {warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {rows.length > 0 && (
        <div className={tc.previewCard}>
          <div className={tc.previewHead}>
            <p className={tc.previewTitle}>Preview ({rows.length} rows)</p>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => downloadCsv(rows, `social_preview_${startDate}_${endDate}.csv`)} className={tc.toolBtn}>
                <Download className="h-3.5 w-3.5 opacity-90" /> CSV
              </button>
              <button type="button" onClick={() => downloadExcel(rows, `social_preview_${startDate}_${endDate}.xls`)} className={tc.toolBtn}>
                <Download className="h-3.5 w-3.5 opacity-90" /> Excel
              </button>
            </div>
          </div>

          <div className="p-4">
            <div className={tc.importPanel}>
              <div>
                <label className={tc.importLabel}>Source (optional, on import)</label>
                <select className={tc.select} value={sourceId} onChange={(e) => setSourceId(e.target.value)}>
                  <option value="">—</option>
                  {(formMeta?.sources || []).map((s) => (
                    <option key={s.id} value={String(s.id)}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={tc.importLabel}>Department (optional)</label>
                <select className={tc.select} value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>
                  <option value="">—</option>
                  {(formMeta?.departments || []).map((d) => (
                    <option key={d.id} value={String(d.id)}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
              <p className={`${tc.hint} max-w-none md:col-span-2`}>
                <span className="font-semibold text-[#05924a]">Azure AI:</span> import and AI selections are independent. Use the <span className="font-semibold">AI</span> column to analyze only chosen rows (quota per checked row).
              </p>
            </div>

            <div className={tc.tableOuter}>
              <table className={tc.table}>
                <thead className={tc.thead}>
                  <tr className={tc.trHead}>
                    <th className="p-2 w-10 text-center font-medium" title="Select rows to import">
                      <input
                        type="checkbox"
                        checked={allRowsSelected}
                        ref={(el) => {
                          if (el) el.indeterminate = someRowsSelected
                        }}
                        onChange={(e) => toggleAllImport(e.target.checked)}
                        className={`${tc.checkBorder} accent-[#0970b8] focus:ring-[#0970b8]/40`}
                      />
                    </th>
                    <th className="p-2 w-10 text-center font-medium" title="Run Azure sentiment on this row after import">
                      <div className="inline-flex items-center gap-1">
                        <input
                          type="checkbox"
                          checked={allAiRowsSelected}
                          ref={(el) => {
                            if (el) el.indeterminate = someAiRowsSelected
                          }}
                          onChange={(e) => toggleAllAi(e.target.checked)}
                          className={`${tc.checkBorder} accent-[#05924a] focus:ring-[#05924a]/35`}
                        />
                        <span>AI</span>
                      </div>
                    </th>
                    <th className="p-2 font-medium">Platform</th>
                    <th className="p-2 font-medium">Channel</th>
                    <th className="p-2 font-medium">Type</th>
                    <th className="p-2 font-medium">University</th>
                    <th className="p-2 font-medium">Author</th>
                    <th className="p-2 font-medium">Content</th>
                    <th className="p-2 font-medium">When (UTC)</th>
                    <th className="p-2 font-medium">Score</th>
                    <th className="p-2 font-medium">Link</th>
                  </tr>
                </thead>
                <tbody className={tc.tbody}>
                  {rows.map((r) => (
                    <tr key={r.import_key} className={tc.tr}>
                      <td className="p-2">
                        <input type="checkbox" checked={selected.has(r.import_key)} onChange={() => toggleRow(r.import_key)} className={`${tc.checkBorder} accent-[#0970b8] focus:ring-[#0970b8]/40`} />
                      </td>
                      <td className="p-2 text-center">
                        <input
                          type="checkbox"
                          checked={aiSelected.has(r.import_key)}
                          onChange={() => toggleAiRow(r.import_key)}
                          className={`${tc.checkBorder} accent-[#05924a] focus:ring-[#05924a]/35`}
                          title="Run Azure sentiment on this row (uses quota)"
                        />
                      </td>
                      <td className="p-2 whitespace-nowrap">{r.platform}</td>
                      <td className="p-2">{r.channel}</td>
                      <td className="p-2 whitespace-nowrap">{r.post_type}</td>
                      <td className="p-2 max-w-[140px]">{r.university_matched}</td>
                      <td className="p-2 max-w-[100px] truncate" title={r.author}>
                        {r.author}
                      </td>
                      <td className={tc.contentCell}>
                        {r.title ? <span className={tc.titleInCell}>{r.title}: </span> : null}
                        {(r.content || '').slice(0, 400)}
                        {(r.content || '').length > 400 ? '…' : ''}
                      </td>
                      <td className={tc.tsCell}>{r.timestamp_utc?.slice(0, 19)}</td>
                      <td className="p-2">{r.score}</td>
                      <td className="p-2 max-w-[120px] truncate">
                        {r.url ? (
                          <a href={r.url} target="_blank" rel="noreferrer" className={tc.link}>
                            open
                          </a>
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button type="button" disabled={importing || analyzing || !canImport || selected.size === 0} onClick={handleImportOnly} className={tc.importBtn}>
                {importing ? <Loader2 className="inline h-4 w-4 animate-spin text-white" /> : null}
                Import {selected.size} selected as feedback
              </button>
              {aiSelected.size > 0 ? (
                <button type="button" disabled={analyzing || importing || !canImport} onClick={handleAnalyzeOnly} className={tc.importBtn}>
                  {analyzing ? <Loader2 className="inline h-4 w-4 animate-spin text-white" /> : null}
                  Analyze {aiSelected.size} selected with AI
                </button>
              ) : null}
              {!canImport ? <span className={tc.denied}>Submit Feedback permission required to import.</span> : null}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
