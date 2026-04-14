import React from 'react'
import { AlertTriangle, BarChart3, Lightbulb, ListOrdered } from 'lucide-react'
import { APP_LOGO } from '../lib/branding'

export default function AggregateInsightsSidebar({ dashboard, aggregates, recentRows = [], onNavigateToBoard }) {
  const sentimentCounts = aggregates?.sentiment_counts || {}
  /** Always show the four main buckets (including 0%) so e.g. Negative is visible even when the dataset has none. */
  const preferred = ['positive', 'neutral', 'negative', 'mixed']
  const extraSentimentKeys = Object.keys(sentimentCounts)
    .filter((k) => !preferred.includes(k))
    .sort((a, b) => a.localeCompare(b))
  const orderedSentimentKeys = [...preferred, ...extraSentimentKeys]

  const totalRecent = aggregates?.total_rows ?? recentRows.length

  const primaryTopic = aggregates?.primary_topic || 'general feedback trends'
  const mixedLikeCount =
    (sentimentCounts.mixed || 0) +
    (sentimentCounts.neutral || 0) +
    (sentimentCounts.inconclusive || 0)
  const mixedLikePct = totalRecent === 0 ? 0 : Math.round((mixedLikeCount / totalRecent) * 100)
  const keyTakeaway =
    totalRecent > 0
      ? `${mixedLikePct}% of responses are inconclusive or mixed, with ${primaryTopic} as the primary area of focus.`
      : 'No submissions yet. Key trends will appear automatically as responses are received.'

  const topTopicsPairs = (aggregates?.top_topics || [])
    .slice(0, 3)
    .map((t) => [t.topic, t.count])

  return (
    <aside className="brand-panel-sidebar rounded-xl border border-white/10 bg-slate-900/90 p-3 text-slate-200 shadow-sm backdrop-blur-sm">
      <div className="flex items-start gap-2.5">
        <img src={APP_LOGO} alt="" className="mt-0.5 h-8 w-8 shrink-0 rounded-lg border border-white/10 bg-black/30 p-1" />
        <div className="min-w-0">
          <h3 className="text-sm font-semibold inline-flex items-center gap-1.5">
            <BarChart3 className="h-3.5 w-3.5 text-violet-300/90" />
            Aggregate Insights
          </h3>
          <p className="mt-0.5 text-[10px] text-slate-500">All submissions · same data as charts</p>
        </div>
      </div>

      <div className="mt-3 rounded-lg border border-white/10 bg-slate-900/30 p-2.5">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 inline-flex items-center gap-1.5">
          <Lightbulb className="h-3 w-3 text-amber-400/80" />
          Key takeaway
        </p>
        <p className="mt-1.5 text-[12px] leading-snug text-slate-300">
          {keyTakeaway}
        </p>
      </div>

      <div className="mt-3">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 inline-flex items-center gap-1.5">
          <BarChart3 className="h-3 w-3" />
          Response breakdown
        </p>
        <div className="mt-1.5 space-y-1.5">
          {orderedSentimentKeys.map((label) => {
            const count = sentimentCounts[label] || 0
            const pct = totalRecent === 0 ? 0 : Math.round((count / totalRecent) * 100)
            return (
              <div key={label} className="space-y-1">
                <button
                  type="button"
                  className="w-full text-left space-y-1 rounded-md outline-none transition-colors hover:bg-white/[0.04] active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-amber-400/40 px-0.5 -mx-0.5 py-0.5"
                  onClick={() => onNavigateToBoard?.({ sentiment: label })}
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="capitalize text-slate-300">{label}</span>
                    <span className="tabular-nums text-slate-500">{count} ({pct}%)</span>
                  </div>
                  <div className="h-1 rounded-full bg-slate-800/90">
                    <div className={`h-1 rounded-full ${sentimentBarColor(label)}`} style={{ width: `${pct}%` }} />
                  </div>
                </button>
              </div>
            )
          })}
        </div>
      </div>

      <div className="mt-3">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 inline-flex items-center gap-1.5">
          <ListOrdered className="h-3 w-3" />
          Top topics
        </p>
        <ol className="mt-1.5 space-y-0.5 text-[12px]">
          {topTopicsPairs.length ? topTopicsPairs.map(([topic, count], idx) => (
            <li key={topic}>
              <button
                type="button"
                className="flex w-full items-center justify-between rounded-md text-left text-slate-300 outline-none transition-colors hover:bg-white/[0.04] active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-amber-400/40 px-1 -mx-1 py-0.5"
                onClick={() => onNavigateToBoard?.({ search: topic })}
              >
                <span className="min-w-0 truncate">{idx + 1}. {topic}</span>
                <span className="shrink-0 pl-2 text-[10px] tabular-nums text-slate-500">{count}</span>
              </button>
            </li>
          )) : <li className="text-slate-500">No topics yet</li>}
        </ol>
        <div className="mt-3 rounded-lg border border-amber-500/20 bg-amber-500/5 p-2 text-[10px] leading-relaxed text-slate-400">
          <p className="inline-flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-300/80" />
            <span>
              Insights are generated automatically and are intended to support — not replace — human judgment. Flagged entries require manual review before action.
            </span>
          </p>
        </div>
      </div>
    </aside>
  )
}

function sentimentBarColor(label) {
  const value = (label || '').toLowerCase()
  if (value === 'positive') return 'bg-emerald-400'
  if (value === 'negative') return 'bg-rose-400'
  if (value === 'neutral') return 'bg-amber-400'
  if (value === 'mixed') return 'bg-amber-400'
  return 'bg-slate-400'
}
