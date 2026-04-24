import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Download, Loader2, Rss, ShieldCheck } from 'lucide-react'
import { apiFetch } from '../lib/api'

const CONSENT_TERMS =
  'I understand this feature retrieves only public posts from third-party services for demonstration or research workflows, and I am responsible for complying with applicable terms, privacy law, and institutional ethics requirements.'

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
  const canImport = permissions.includes('feedback.create')
  const [status, setStatus] = useState(null)
  const [loadingStatus, setLoadingStatus] = useState(true)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [platformReddit, setPlatformReddit] = useState(true)
  const [platformBluesky, setPlatformBluesky] = useState(true)
  const [includeRedditComments, setIncludeRedditComments] = useState(false)
  const [limitPerSub, setLimitPerSub] = useState(25)
  const [consentA, setConsentA] = useState(false)
  const [consentB, setConsentB] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [importing, setImporting] = useState(false)
  const [rows, setRows] = useState([])
  const [warnings, setWarnings] = useState([])
  const [selected, setSelected] = useState(() => new Set())
  const [sourceId, setSourceId] = useState('')
  const [departmentId, setDepartmentId] = useState('')
  const [runAiAnalysis, setRunAiAnalysis] = useState(false)

  const loadStatus = useCallback(async () => {
    setLoadingStatus(true)
    try {
      const s = await apiFetch('/integrations/social/status', { token })
      setStatus(s)
    } catch (e) {
      setStatus(null)
      notify('error', e.message || 'Could not load integration status.')
    } finally {
      setLoadingStatus(false)
    }
  }, [token, notify])

  useEffect(() => {
    loadStatus()
  }, [loadStatus])

  const consentFetchOk = consentA && consentB

  const platforms = useMemo(() => {
    const p = []
    if (platformReddit) p.push('reddit')
    if (platformBluesky) p.push('bluesky')
    return p
  }, [platformReddit, platformBluesky])

  const toggleRow = (key) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const selectAllVisible = () => {
    setSelected(new Set(rows.map((r) => r.import_key)))
  }

  const clearSelection = () => setSelected(new Set())

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
    const effectivePlatforms = [...platforms]
    if (effectivePlatforms.includes('reddit') && !status?.reddit_connected) {
      if (effectivePlatforms.length === 1) {
        notify('warning', 'Reddit is not connected yet. Configure Reddit OAuth first, or select Bluesky.')
        return
      }
      notify('warning', 'Reddit is not connected; continuing with available platform(s) only.')
    }
    const filteredPlatforms = effectivePlatforms.filter((p) => !(p === 'reddit' && !status?.reddit_connected))
    if (!filteredPlatforms.length) {
      notify('warning', 'No connected platform selected. Please configure Reddit or use Bluesky.')
      return
    }
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

  const handleImport = async () => {
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
          })),
          run_ai_analysis: runAiAnalysis,
          source_id: sourceId ? Number(sourceId) : null,
          department_id: departmentId ? Number(departmentId) : null,
        }),
      })
      notify('success', `Imported ${selectedItems.length} item(s) as feedback.`)
      clearSelection()
      onImportDone?.()
    } catch (err) {
      notify('error', err.message || 'Import failed.')
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
        <div className="border-b border-slate-800 px-6 py-4">
          <h2 className="inline-flex items-center gap-2 text-lg font-semibold text-slate-100">
            <Rss className="h-5 w-5 text-cyan-300" aria-hidden />
            Social feed demo
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            Permission-gated preview of public Reddit and Bluesky posts. Import pushes selected rows into the same feedback pipeline as manual submit (optional AI analysis per row).
          </p>
        </div>

        <div className="space-y-4 p-6">
          <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
            <div className="flex gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-700" aria-hidden />
              <p>
                This tab is only visible with the <span className="font-medium">Social feed demo</span> permission. Fetching calls third-party public APIs from the
                server. Importing requires <span className="font-medium">Submit Feedback</span>. Use ethics review and data minimisation appropriate to your institution.
              </p>
            </div>
          </div>

          <details className="rounded-xl border border-slate-300 bg-slate-100 p-3 text-sm text-slate-800">
            <summary className="cursor-pointer font-medium text-slate-900">Server configuration (admin / deploy)</summary>
            <ul className="mt-2 list-inside list-disc space-y-1.5 text-xs text-slate-700">
              <li>
                <span className="font-medium text-slate-900">Bluesky</span>: no API keys required; uses the public{' '}
                <code className="rounded bg-slate-200 px-1 text-slate-900">public.api.bsky.app</code> search endpoint.
              </li>
              <li>
                <span className="font-medium text-slate-900">Reddit — submissions (no login)</span>: set{' '}
                <code className="rounded bg-slate-200 px-1 text-slate-900">REDDIT_USER_AGENT</code> to a descriptive string (Reddit requires a non-generic User-Agent).
              </li>
              <li>
                <span className="font-medium text-slate-900">Reddit — comments</span>: create a &quot;script&quot; app at{' '}
                <a className="text-cyan-400 underline" href="https://www.reddit.com/prefs/apps" target="_blank" rel="noreferrer">
                  reddit.com/prefs/apps
                </a>
                , then set <code className="rounded bg-slate-200 px-1 text-slate-900">REDDIT_CLIENT_ID</code> and{' '}
                <code className="rounded bg-slate-200 px-1 text-slate-900">REDDIT_CLIENT_SECRET</code> on the server. Install Python deps with{' '}
                <code className="rounded bg-slate-200 px-1 text-slate-900">pip install -r requirements.txt</code> (includes <code className="rounded bg-slate-200 px-1 text-slate-900">praw</code>).
              </li>
              <li>
                <span className="font-medium text-slate-900">Database</span>: run migrations so permission <code className="rounded bg-slate-200 px-1 text-slate-900">social_feed.demo</code> exists, then assign it to the appropriate role in Admin → Roles.
              </li>
            </ul>
          </details>

          <div className="rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-xs text-slate-700">
            {loadingStatus ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Checking integration status…
              </span>
            ) : (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                <span>
                  Bluesky:{' '}
                  <span className="text-emerald-300">{status?.bluesky_available ? 'available' : 'unavailable'}</span>
                </span>
                <span>
                  Reddit:{' '}
                  <span className={status?.reddit_connected ? 'text-emerald-300' : 'text-amber-300'}>
                    {status?.reddit_connected ? 'connected' : 'not connected (configure OAuth)'}
                  </span>
                </span>
              </div>
            )}
          </div>

          <form onSubmit={handlePreview} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-300">Start date</label>
                <input
                  type="date"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/40 px-3 py-2 text-sm text-slate-100"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-300">End date</label>
                <input
                  type="date"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/40 px-3 py-2 text-sm text-slate-100"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-medium text-slate-300">Platforms</p>
              <div className="flex flex-wrap gap-3">
                <label className="inline-flex items-center gap-2 text-sm text-slate-200">
                  <input type="checkbox" checked={platformReddit} onChange={(e) => setPlatformReddit(e.target.checked)} />
                  Reddit
                </label>
                <label className="inline-flex items-center gap-2 text-sm text-slate-200">
                  <input type="checkbox" checked={platformBluesky} onChange={(e) => setPlatformBluesky(e.target.checked)} />
                  Bluesky
                </label>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-300">Limit per subreddit / keyword</label>
                <input
                  type="number"
                  min={5}
                  max={100}
                  className="w-28 rounded-lg border border-slate-700 bg-slate-900/40 px-2 py-1.5 text-sm text-slate-100"
                  value={limitPerSub}
                  onChange={(e) => setLimitPerSub(e.target.value)}
                />
              </div>
              <label className="inline-flex items-center gap-2 text-sm text-slate-200">
                <input
                  type="checkbox"
                  checked={includeRedditComments}
                  onChange={(e) => setIncludeRedditComments(e.target.checked)}
                  disabled={!platformReddit}
                />
                Include Reddit comments (requires OAuth + praw)
              </label>
            </div>

            <div className="space-y-2 rounded-xl border border-slate-300 bg-slate-100 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-700">Consent (required to fetch)</p>
              <label className="flex cursor-pointer gap-2 text-xs text-slate-800">
                <input type="checkbox" checked={consentA} onChange={(e) => setConsentA(e.target.checked)} />
                <span>{CONSENT_TERMS}</span>
              </label>
              <label className="flex cursor-pointer gap-2 text-xs text-slate-800">
                <input type="checkbox" checked={consentB} onChange={(e) => setConsentB(e.target.checked)} />
                <span className="inline-flex items-start gap-1">
                  <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400/90" aria-hidden />I authorise this application (server-side) to call public Reddit / Bluesky APIs with the parameters above.
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={fetching || !consentFetchOk}
              className="inline-flex items-center gap-2 rounded-lg border border-cyan-500/40 bg-cyan-500/15 px-4 py-2 text-sm font-medium text-cyan-100 transition hover:bg-cyan-500/25 disabled:opacity-50"
            >
              {fetching ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {fetching ? 'Fetching…' : 'Fetch preview'}
            </button>
          </form>
        </div>
      </div>

      {warnings.length > 0 && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
          <p className="font-medium text-amber-900">Warnings</p>
          <ul className="mt-1 list-inside list-disc text-amber-800">
            {warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {rows.length > 0 && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 px-4 py-3">
            <p className="text-sm font-medium text-slate-200">Preview ({rows.length} rows)</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => downloadCsv(rows, `social_preview_${startDate}_${endDate}.csv`)}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-600 px-2 py-1 text-xs text-slate-200 hover:bg-slate-800"
              >
                <Download className="h-3.5 w-3.5" /> CSV
              </button>
              <button
                type="button"
                onClick={() => downloadExcel(rows, `social_preview_${startDate}_${endDate}.xls`)}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-600 px-2 py-1 text-xs text-slate-200 hover:bg-slate-800"
              >
                <Download className="h-3.5 w-3.5" /> Excel
              </button>
              <button type="button" onClick={selectAllVisible} className="rounded-lg border border-slate-600 px-2 py-1 text-xs text-slate-200 hover:bg-slate-800">
                Select all
              </button>
              <button type="button" onClick={clearSelection} className="rounded-lg border border-slate-600 px-2 py-1 text-xs text-slate-200 hover:bg-slate-800">
                Clear selection
              </button>
            </div>
          </div>

          <div className="p-4">
            <div className="mb-4 grid gap-3 rounded-xl border border-slate-800 bg-slate-950/40 p-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs text-slate-400">Source (optional, on import)</label>
                <select
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/40 px-2 py-2 text-sm text-slate-100 [&>option]:bg-white [&>option]:text-slate-900"
                  value={sourceId}
                  onChange={(e) => setSourceId(e.target.value)}
                >
                  <option value="">—</option>
                  {(formMeta?.sources || []).map((s) => (
                    <option key={s.id} value={String(s.id)}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-400">Department (optional)</label>
                <select
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/40 px-2 py-2 text-sm text-slate-100 [&>option]:bg-white [&>option]:text-slate-900"
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                >
                  <option value="">—</option>
                  {(formMeta?.departments || []).map((d) => (
                    <option key={d.id} value={String(d.id)}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
              <label className="flex items-center gap-2 text-xs text-slate-300 md:col-span-2">
                <input type="checkbox" checked={runAiAnalysis} onChange={(e) => setRunAiAnalysis(e.target.checked)} />
                Run full AI sentiment pipeline on each imported row (uses Azure OpenAI quota; slower)
              </label>
            </div>

            <div className="max-h-[min(520px,55vh)] overflow-auto rounded-lg border border-slate-800">
              <table className="min-w-[920px] w-full border-collapse text-left text-xs text-slate-200">
                <thead className="sticky top-0 z-10 bg-slate-950/95 backdrop-blur">
                  <tr className="border-b border-slate-700">
                    <th className="p-2 w-10"> </th>
                    <th className="p-2">Platform</th>
                    <th className="p-2">Channel</th>
                    <th className="p-2">Type</th>
                    <th className="p-2">University</th>
                    <th className="p-2">Author</th>
                    <th className="p-2">Content</th>
                    <th className="p-2">When (UTC)</th>
                    <th className="p-2">Score</th>
                    <th className="p-2">Link</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.import_key} className="border-b border-slate-800/80 align-top hover:bg-slate-800/30">
                      <td className="p-2">
                        <input type="checkbox" checked={selected.has(r.import_key)} onChange={() => toggleRow(r.import_key)} />
                      </td>
                      <td className="p-2 whitespace-nowrap">{r.platform}</td>
                      <td className="p-2">{r.channel}</td>
                      <td className="p-2 whitespace-nowrap">{r.post_type}</td>
                      <td className="p-2 max-w-[140px]">{r.university_matched}</td>
                      <td className="p-2 max-w-[100px] truncate" title={r.author}>
                        {r.author}
                      </td>
                      <td className="p-2 max-w-[280px] whitespace-pre-wrap break-words text-slate-300">
                        {r.title ? <span className="font-medium text-slate-200">{r.title}: </span> : null}
                        {(r.content || '').slice(0, 400)}
                        {(r.content || '').length > 400 ? '…' : ''}
                      </td>
                      <td className="p-2 whitespace-nowrap text-slate-400">{r.timestamp_utc?.slice(0, 19)}</td>
                      <td className="p-2">{r.score}</td>
                      <td className="p-2 max-w-[120px] truncate">
                        {r.url ? (
                          <a href={r.url} target="_blank" rel="noreferrer" className="text-cyan-400 underline">
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
              <button
                type="button"
                disabled={importing || !canImport || selected.size === 0}
                onClick={handleImport}
                className="rounded-lg border border-emerald-500/40 bg-emerald-500/15 px-4 py-2 text-sm font-medium text-emerald-100 hover:bg-emerald-500/25 disabled:opacity-50"
              >
                {importing ? <Loader2 className="inline h-4 w-4 animate-spin" /> : null}
                Import {selected.size} selected as feedback
              </button>
              {!canImport ? <span className="text-xs text-amber-200/90">Submit Feedback permission required to import.</span> : null}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
