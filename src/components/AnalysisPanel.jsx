import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, CheckCircle, ChevronDown, Lightbulb, Tag, XCircle } from 'lucide-react'
import { GLOSSARY } from '../lib/analysisGlossary'
import { BRAND_BLUE, BRAND_GREEN } from '../lib/branding'
import InfoTip from './common/InfoTip'

const cx = (...parts) => parts.filter(Boolean).join(' ')

function wordCount(text) {
  if (!text || !String(text).trim()) return 0
  return String(text).trim().split(/\s+/).length
}

function lengthLabel(wc) {
  if (wc < 40) return 'short'
  if (wc < 120) return 'medium'
  return 'long'
}

function normList(arr) {
  if (!arr?.length) return []
  return arr.map((s) => String(s).trim().toLowerCase()).filter(Boolean)
}

/** If both lists carry the same strings, show only one block. */
function sameMultiset(a, b) {
  const na = [...new Set(normList(a))].sort().join('\0')
  const nb = [...new Set(normList(b))].sort().join('\0')
  return na.length > 0 && na === nb
}

function confidencePillClass(label) {
  if (!label) return 'bg-white/10 text-gray-300 border-white/15'
  const l = label.toLowerCase()
  if (l.includes('high')) return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/35'
  if (l.includes('moderate')) return 'bg-amber-500/15 text-amber-200 border-amber-500/35'
  return 'bg-white/10 text-gray-300 border-white/20'
}

const SectionLabel = ({ children, hint }) => (
  <p className="text-[11px] font-semibold tracking-wider text-gray-500 uppercase mb-2 flex items-center gap-1">
    {children}
    {hint ? <InfoTip text={hint} /> : null}
  </p>
)

const InnerBox = ({ children, className = '' }) => (
  <div
    className={cx(
      'analysis-original-feedback rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-sm text-gray-200 leading-relaxed max-h-[min(500px,50vh)] overflow-y-auto overscroll-contain',
      className,
    )}
  >
    {children}
  </div>
)

const LIST_TITLE_HINT = {
  'Negativity sources': GLOSSARY.negativitySources,
  'Negative statements': GLOSSARY.negativeStatements,
  'Positive statements': GLOSSARY.positiveStatements,
  'Action items': GLOSSARY.actionItems,
  'Unresolved issues': GLOSSARY.unresolvedIssues,
}

const ListBlock = ({ title, icon: Icon, tone, items, emptyText = 'None', compact = false }) => {
  const pad = compact ? 'p-3 sm:p-4' : 'p-5'
  const border =
    tone === 'red'
      ? 'border-red-500/20 bg-red-500/5'
      : tone === 'green'
        ? 'border-emerald-500/20 bg-emerald-500/5'
        : tone === 'purple'
          ? 'border-violet-500/20 bg-violet-500/5'
          : 'border-white/10 bg-white/[0.03]'
  const iconColor =
    tone === 'red' ? 'text-red-400' : tone === 'green' ? 'text-emerald-400' : tone === 'purple' ? 'text-violet-400' : 'text-gray-400'
  return (
    <div className={cx('rounded-xl border', pad, border)}>
      <div className="flex items-center gap-2 mb-3">
        <Icon className={cx('w-5 h-5', iconColor)} />
        <h3 className="font-semibold text-white flex items-center gap-1">
          {title}
          {LIST_TITLE_HINT[title] ? <InfoTip text={LIST_TITLE_HINT[title]} /> : null}
        </h3>
        <span className="ml-auto text-xs text-gray-500">{items?.length ?? 0}</span>
      </div>
      {items && items.length > 0 ? (
        <ul className="space-y-2">
          {items.map((item, i) => (
            <li key={i} className="text-sm text-gray-300 leading-relaxed pl-3 border-l-2 border-white/10">
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-gray-500">{emptyText}</p>
      )}
    </div>
  )
}

const InsightCard = ({ analysis, transcript, sourceLine, hasAudio, compact = false }) => {
  const [open, setOpen] = useState(true)
  const title =
    analysis.summary?.trim() ||
    [analysis.primary_topic, analysis.overall_sentiment].filter(Boolean).join(' · ') ||
    'Analysis summary'

  const headPad = compact ? 'p-3 sm:p-4' : 'p-5'
  const bodyPad = compact ? 'px-3 pb-4 sm:px-4' : 'px-5 pb-5'

  return (
    <div className="analysis-brand-surface rounded-xl border border-white/10 bg-slate-900/90 overflow-hidden">
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setOpen((o) => !o)
          }
        }}
        className={cx('flex w-full cursor-pointer items-start gap-2 text-left transition-colors hover:bg-white/[0.03] sm:gap-3', headPad)}
      >
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1">
            <span className={cx('px-2.5 py-0.5 rounded-full text-xs font-medium border', confidencePillClass(analysis.confidence_label))}>
              {analysis.confidence_label || 'Unknown confidence'}
            </span>
            <InfoTip text={GLOSSARY.confidenceLabel} />
          </span>
          {analysis.primary_topic ? (
            <span className="inline-flex items-center gap-1">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border border-white/15 bg-white/5 text-gray-200">
                <Tag className="w-3.5 h-3.5 opacity-70" />
                {analysis.primary_topic}
              </span>
              <InfoTip text={GLOSSARY.primaryTopic} />
            </span>
          ) : null}
        </div>
        <ChevronDown className={cx('h-5 w-5 shrink-0 text-gray-500 transition-transform', open && '-rotate-180')} />
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className={cx('space-y-4 border-t border-white/5 sm:space-y-5', bodyPad, compact && 'space-y-3')}>
              <div className="min-w-0">
                <h2
                  className={cx(
                    'font-bold leading-snug text-white',
                    compact ? 'text-base sm:text-lg' : 'text-lg',
                  )}
                >
                  {title}
                </h2>
                <p className={cx('mt-1 text-gray-500', compact ? 'text-xs' : 'text-sm')}>{sourceLine}</p>
              </div>

              <div>
                <SectionLabel hint={GLOSSARY.originalFeedback}>Original feedback</SectionLabel>
                <InnerBox>
                  {transcript?.trim() ? transcript : <span className="text-gray-500">No transcript text.</span>}
                </InnerBox>
              </div>

              {analysis.supporting_evidence?.length > 0 && (
                <div>
                  <SectionLabel hint={GLOSSARY.supportingEvidence}>Supporting evidence</SectionLabel>
                  <ul className="space-y-2">
                    {analysis.supporting_evidence.map((line, i) => (
                      <li key={i} className="flex gap-2 text-sm text-gray-300">
                        <span className="text-gray-600 shrink-0 font-mono">&gt;</span>
                        <span className="leading-relaxed">{line}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {analysis.recommended_action ? (
                <div className="rounded-lg border border-teal-500/25 bg-teal-500/5 px-4 py-3 flex gap-3">
                  <span className="text-lg leading-none mt-0.5" style={{ color: BRAND_GREEN }}>
                    →
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-white mb-1 flex items-center gap-1">
                      Recommended action
                      <InfoTip text={GLOSSARY.recommendedAction} />
                    </p>
                    <p className="text-sm text-gray-300 leading-relaxed">{analysis.recommended_action}</p>
                  </div>
                </div>
              ) : null}

              {analysis.secondary_topic ? (
                <p className="text-sm text-gray-500">
                  Secondary area detected: <span className="text-gray-300">{analysis.secondary_topic}</span>
                </p>
              ) : null}

              <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 pt-2 border-t border-white/5">
                <span className="text-xs text-gray-500 inline-flex items-center gap-1">
                  How this was decided
                  <InfoTip text={GLOSSARY.howThisWasDecided} />
                </span>
                <span className="inline-flex items-center gap-1">
                  <span
                    className="px-2 py-0.5 rounded-full text-[10px] font-medium border bg-emerald-500/10 text-emerald-800 border-emerald-600/30"
                    style={{ borderColor: `${BRAND_GREEN}55` }}
                  >
                    {hasAudio ? 'Multimodal' : 'Text-only'}
                  </span>
                  <InfoTip text={hasAudio ? GLOSSARY.multimodal : GLOSSARY.textOnly} />
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-medium border border-white/15 text-gray-400 bg-white/5">Full analysis</span>
                  <InfoTip text={GLOSSARY.fullAnalysis} />
                </span>
                <span className="text-xs text-gray-600 ml-auto w-full sm:w-auto sm:ml-auto">
                  Open the Evidence tab for the decision chain and stage details.
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const MetricStrip = ({ analysis }) => (
  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
    {[
      { k: 'Sentiment', v: analysis?.overall_sentiment || '—' },
      { k: 'Emotion', v: analysis?.dominant_emotion || '—' },
      { k: 'Confidence', v: analysis?.confidence_score != null ? `${Math.round(analysis.confidence_score * 100)}%` : '—' },
      { k: 'Conflict', v: analysis?.conflict_detected ? 'Detected' : 'None' },
      { k: 'Negativity', v: analysis?.negativity_detected ? 'Detected' : 'None' },
    ].map((row) => (
      <div key={row.k} className="rounded-lg border border-white/10 bg-slate-900/30 px-3 py-2.5">
        <p className="text-[10px] uppercase tracking-wide text-gray-500 mb-0.5">{row.k}</p>
        <p className="text-sm font-semibold text-white capitalize">{row.v}</p>
      </div>
    ))}
  </div>
)

const SegmentInsightsBlock = ({ segment_insights, compact = false }) => {
  const [open, setOpen] = useState(false)
  if (!segment_insights?.length) return null
  const headPad = compact ? 'p-3 sm:p-4' : 'p-5'
  return (
    <div className="analysis-brand-surface rounded-xl border border-white/10 bg-slate-900/90 overflow-hidden">
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setOpen((o) => !o)
          }
        }}
        className={cx('flex w-full cursor-pointer items-center justify-between gap-3 text-left hover:bg-white/[0.03]', headPad)}
      >
        <div>
          <SectionLabel hint={GLOSSARY.segmentTimeline}>Segment timeline</SectionLabel>
          <p className="mt-1 text-xs text-gray-500">Per-segment audio timeline (cross-validated with statements where applicable).</p>
        </div>
        <ChevronDown className={cx('h-5 w-5 shrink-0 text-gray-500 transition-transform', open && '-rotate-180')} />
      </div>
      {open && (
      <div className={cx('overflow-x-auto border-t border-white/5', compact ? 'px-3 pb-3 sm:px-4 sm:pb-4' : 'px-5 pb-5')}>
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="text-gray-500 text-xs uppercase border-b border-white/10">
              <th className="py-2 pr-3">#</th>
              <th className="py-2 pr-3">Time</th>
              <th className="py-2 pr-3">Sentiment</th>
              <th className="py-2 pr-3">Flags</th>
              <th className="py-2">Key moment</th>
            </tr>
          </thead>
          <tbody>
            {segment_insights.map((s, i) => (
              <tr key={i} className="border-b border-white/5 text-gray-300">
                <td className="py-2 pr-3 font-mono text-xs">{s.segment_index ?? i}</td>
                <td className="py-2 pr-3 text-xs whitespace-nowrap">
                  {s.start_sec != null && s.end_sec != null ? `${Number(s.start_sec).toFixed(1)}s – ${Number(s.end_sec).toFixed(1)}s` : '—'}
                </td>
                <td className="py-2 pr-3 capitalize">{s.sentiment_label || '—'}</td>
                <td className="py-2 pr-3 text-xs">
                  {[s.tone_shift && 'tone shift', s.negativity_spike && 'negativity spike'].filter(Boolean).join(', ') || '—'}
                </td>
                <td className="py-2 text-gray-400">{s.key_moment || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}
    </div>
  )
}

/**
 * @param {object} props
 * @param {object} props.analysis
 * @param {string} [props.transcript]
 * @param {{ sourceLabel?: string, analyzedAt?: string }} [props.meta]
 * @param {boolean} [props.hasAudio]
 */
const AnalysisPanel = ({ analysis, transcript = '', meta, hasAudio = false, compact = false }) => {
  if (!analysis) return null

  const wc = wordCount(transcript)
  const sourceLine = [meta?.sourceLabel || 'Voice analysis', meta?.analyzedAt].filter(Boolean).join(' · ') || 'Analysis output'
  const dedupeNegSources = sameMultiset(analysis.negativity_sources, analysis.negative_statements)
  const pc = compact ? 'p-3 sm:p-4' : 'p-5'

  return (
    <div
      className={cx(
        'analysis-panel',
        compact ? 'min-w-0 max-w-none space-y-3 text-[13px] leading-snug' : 'max-w-4xl space-y-5',
      )}
    >
      {/* <MetricStrip analysis={analysis} /> */}

      {/* <div className="rounded-xl border border-white/10 bg-slate-900/90 p-5">
        <SentimentScoreBar score={analysis.sentiment_score} label="Sentiment score" />
      </div> */}

      <InsightCard
        analysis={analysis}
        transcript={transcript}
        sourceLine={sourceLine}
        hasAudio={hasAudio}
        compact={compact}
      />

      <div className={cx('analysis-brand-surface rounded-xl border border-white/10 bg-slate-900/90', pc)}>
        <SectionLabel hint={GLOSSARY.signalAndTone}>Signal & tone</SectionLabel>
        <div
          className={
            compact
              ? 'grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6'
              : 'grid grid-cols-2 gap-6 sm:gap-8'
          }
        >
          <div>
            <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
              Overall tone
              <InfoTip text={GLOSSARY.overallTone} />
            </p>
            <p className="font-medium text-white capitalize">{analysis.overall_tone || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
              Tone alignment
              <InfoTip text={GLOSSARY.toneAlignment} />
            </p>
            <p className={cx('font-medium capitalize', analysis.tone_alignment === 'misaligned' ? 'text-amber-300' : 'text-gray-200')}>
              {analysis.tone_alignment || '—'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
              Sarcasm
              <InfoTip text={GLOSSARY.sarcasmDetected} />
            </p>
            <p className={cx('font-semibold', compact ? 'text-base' : 'text-lg', analysis.sarcasm_detected ? 'text-amber-300' : 'text-emerald-400')}>
              {analysis.sarcasm_detected ? 'Detected' : 'None'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
              Hesitation
              <InfoTip text={GLOSSARY.hesitationDetected} />
            </p>
            <p className={cx('font-semibold', compact ? 'text-base' : 'text-lg', analysis.hesitation_detected ? 'text-amber-300' : 'text-emerald-400')}>
              {analysis.hesitation_detected ? 'Detected' : 'None'}
            </p>
          </div>
        </div>
        <p className="text-xs text-gray-600 mt-3">
          Text stats for this run: {wc} words · {lengthLabel(wc)} length
        </p>
      </div>

      {analysis.key_phrases_detected?.length > 0 && (
        <div className={cx('analysis-brand-surface rounded-xl border border-white/10 bg-slate-900/90', pc)}>
          <div className="flex items-center gap-2 mb-3">
            <Tag className="w-5 h-5 shrink-0" style={{ color: BRAND_GREEN }} />
            <h3 className="font-semibold text-white flex items-center gap-1">
              Key phrases
              <InfoTip text={GLOSSARY.keyPhrases} />
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {analysis.key_phrases_detected.map((p, i) => (
              <span
                key={i}
                className="key-phrase-pill px-2.5 py-1 rounded-md text-xs font-mono border font-medium bg-white text-slate-800 shadow-sm"
                style={{
                  borderColor: `${BRAND_GREEN}55`,
                  background: `linear-gradient(180deg, #ffffff 0%, rgba(5, 146, 74, 0.08) 100%)`,
                  color: '#064e3b',
                }}
              >
                &quot;{p}&quot;
              </span>
            ))}
          </div>
        </div>
      )}

      {!dedupeNegSources && (
        <ListBlock compact={compact} title="Negativity sources" icon={AlertTriangle} tone="red" items={analysis.negativity_sources} />
      )}
      <ListBlock compact={compact} title="Negative statements" icon={XCircle} tone="red" items={analysis.negative_statements} />
      <ListBlock compact={compact} title="Positive statements" icon={CheckCircle} tone="green" items={analysis.positive_statements} />

      {analysis.key_topics?.length > 0 && (
        <div className={cx('analysis-brand-surface rounded-xl border border-white/10 bg-slate-900/90', pc)}>
          <div className="flex items-center gap-2 mb-3">
            <Tag className="w-5 h-5 shrink-0" style={{ color: BRAND_BLUE }} />
            <h3 className="font-semibold text-white flex items-center gap-1">
              Key topics
              <InfoTip text={GLOSSARY.keyTopics} />
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {analysis.key_topics.map((t, i) => (
              <span
                key={i}
                className="px-3 py-1 rounded-full text-sm border font-medium shadow-sm"
                style={{
                  borderColor: `${BRAND_BLUE}50`,
                  background: `linear-gradient(180deg, #ffffff 0%, rgba(9, 112, 184, 0.1) 100%)`,
                  color: '#0c4a6e',
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      )}

      <ListBlock compact={compact} title="Action items" icon={Lightbulb} tone="purple" items={analysis.action_items} />
      <ListBlock compact={compact} title="Unresolved issues" icon={AlertTriangle} tone="purple" items={analysis.unresolved_issues} />

      <SegmentInsightsBlock segment_insights={analysis.segment_insights} compact={compact} />
    </div>
  )
}

export default AnalysisPanel
