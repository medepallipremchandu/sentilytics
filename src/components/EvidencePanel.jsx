import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Eye, ShieldCheck, CheckCircle, Lightbulb } from 'lucide-react'
import { GLOSSARY, rowHint } from '../lib/analysisGlossary'
import InfoTip from './common/InfoTip'
import SentimentScoreBar from './SentimentScoreBar'

const TEAL = '#20c997'

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

function fmt(v) {
  if (v === null || v === undefined || v === '') return '—'
  if (typeof v === 'number' && Number.isFinite(v)) return String(v)
  return String(v)
}

const PRIVACY_MARKERS = ['[REDACTED]', '[EMAIL]', '[PHONE]', '[NAME]']

/**
 * Server sends transcript_privacy on feedback rows; live /analyze responses may omit it — derive from text.
 */
function deriveTranscriptPrivacy(transcript, apiMeta) {
  const t = String(transcript || '')
  let total = 0
  PRIVACY_MARKERS.forEach((m) => {
    total += t.split(m).length - 1
  })
  const types = []
  if (t.includes('[EMAIL]')) types.push('email')
  if (t.includes('[PHONE]')) types.push('phone')
  if (t.includes('[REDACTED]')) types.push('salutation_or_placeholder')
  if (t.includes('[NAME]')) types.push('capitalized_name_pattern')
  const fromText = {
    identifiers_visible_as_masked: total > 0,
    approx_masking_tokens: total,
    masking_token_types: types,
  }
  if (apiMeta && typeof apiMeta === 'object') {
    return {
      ...fromText,
      viewer_received_unredacted_transcript:
        typeof apiMeta.viewer_received_unredacted_transcript === 'boolean'
          ? apiMeta.viewer_received_unredacted_transcript
          : total === 0,
      explanation:
        apiMeta.explanation ||
        'Privacy masking may appear when text is stored or when your role limits access to raw identifiers.',
    }
  }
  return {
    ...fromText,
    viewer_received_unredacted_transcript: total === 0,
    explanation:
      'Privacy masking may appear when text is stored or when your role limits access to raw identifiers.',
  }
}

/** Prefer gpt_usage on analysis; else usage bundle from API (legacy rows). */
function mergeGptUsage(usage, analysis) {
  const a = analysis?.gpt_usage
  if (a && typeof a === 'object') {
    const pt = Number(a.prompt_tokens)
    const ct = Number(a.completion_tokens)
    const tt = Number(a.total_tokens)
    if (tt > 0 || pt > 0 || ct > 0) {
      return { prompt_tokens: pt || 0, completion_tokens: ct || 0, total_tokens: tt || pt + ct }
    }
  }
  if (usage && typeof usage === 'object') {
    const pt = Number(usage.gpt_prompt_tokens)
    const ct = Number(usage.gpt_completion_tokens)
    const tt = Number(usage.gpt_total_tokens)
    if (tt > 0 || pt > 0 || ct > 0) {
      return { prompt_tokens: pt || 0, completion_tokens: ct || 0, total_tokens: tt || pt + ct }
    }
  }
  return null
}

const SectionLabel = ({ children, hint }) => (
  <p className="text-[11px] font-semibold tracking-wider text-gray-500 uppercase mb-2 flex items-center gap-1">
    {children}
    {hint ? <InfoTip text={hint} /> : null}
  </p>
)

const IoCol = ({ title, rows }) => (
  <div className="min-w-0">
    <p className="text-[10px] font-semibold tracking-wider text-gray-500 uppercase mb-2">{title}</p>
    <dl className="space-y-2 text-sm">
      {rows.map(({ k, v }) => {
        const hint = rowHint(k)
        return (
          <div key={k}>
            <dt className="text-gray-500 text-xs mb-0.5 flex items-start gap-1">
              <span className="min-w-0 flex-1">{k}</span>
              {hint ? <InfoTip text={hint} /> : null}
            </dt>
            <dd className="text-gray-200 break-words">{fmt(v)}</dd>
          </div>
        )
      })}
    </dl>
  </div>
)

function StageRow({ id, icon: Icon, iconClass, title, titleHint, summary, open, onToggle, children }) {
  const toggle = () => onToggle(id)
  return (
    <div className="rounded-lg border border-slate-700/90 bg-slate-900/90 overflow-hidden">
      <div
        role="button"
        tabIndex={0}
        onClick={toggle}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            toggle()
          }
        }}
        className="w-full flex cursor-pointer items-start gap-3 p-4 text-left hover:bg-white/[0.03] transition-colors"
      >
        <Icon className={cx('w-5 h-5 shrink-0 mt-0.5', iconClass)} />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-white flex flex-wrap items-center gap-1">
            {title}
            {titleHint ? <InfoTip text={titleHint} /> : null}
          </p>
          <p className="text-sm text-gray-500 mt-0.5 leading-relaxed">{summary}</p>
        </div>
        <ChevronDown className={cx('w-5 h-5 text-gray-500 shrink-0 transition-transform mt-0.5', open && '-rotate-180')} />
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-slate-700/90"
          >
            <div className="p-4 grid md:grid-cols-2 gap-6 bg-slate-900/30">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/**
 * @param {object} props
 * @param {object} props.analysis
 * @param {string} [props.transcript]
 * @param {object|null} [props.audio]
 * @param {boolean} [props.hasAudio]
 * @param {object|null} [props.usage] — bundle usage (gpt_* tokens); merged with analysis.gpt_usage
 * @param {object|null} [props.transcriptPrivacy] — from API `transcript_privacy` on analysis bundle
 */
const EvidencePanel = ({
  analysis,
  transcript = '',
  audio = null,
  hasAudio = false,
  usage = null,
  transcriptPrivacy: transcriptPrivacyProp = null,
  compact = false,
}) => {
  const [howOpen, setHowOpen] = useState(true)
  const [openStage, setOpenStage] = useState(() => new Set())

  const toggleStage = (id) => {
    setOpenStage((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  if (!analysis) return null

  const ling = analysis.linguistics || {}
  const hasTranscriptText = !!(transcript && String(transcript).trim())
  const wc = hasTranscriptText ? wordCount(transcript) : (ling.word_count ?? 0)
  const chars = hasTranscriptText ? String(transcript).length : (ling.character_count ?? 0)
  const len = lengthLabel(wc)
  const multimodal = !!hasAudio && !!audio

  const keyPhrases = analysis.key_phrases_detected || []
  const matchedTerms = keyPhrases.length ? keyPhrases.join(', ') : '—'

  const negWords = ling.negation_words?.length ? ling.negation_words.join(', ') : '—'
  const intWords = ling.intensifier_words?.length ? ling.intensifier_words.join(', ') : '—'
  const dimWords = ling.diminisher_words?.length ? ling.diminisher_words.join(', ') : '—'

  const gptUsage = mergeGptUsage(usage, analysis)
  const tokenInputRows = gptUsage
    ? [
        { k: 'LLM input (prompt) tokens', v: gptUsage.prompt_tokens },
        { k: 'LLM output (completion) tokens', v: gptUsage.completion_tokens },
        { k: 'LLM total tokens', v: gptUsage.total_tokens },
      ]
    : []

  const tp = deriveTranscriptPrivacy(transcript, transcriptPrivacyProp)
  const masked = tp.identifiers_visible_as_masked
  const anonymizationSummary = masked
    ? `The transcript shown here includes ${tp.approx_masking_tokens} privacy placeholder(s) ([REDACTED], [NAME], etc.). That masking is applied when feedback is stored and/or when your account cannot view raw identifiers — it is separate from the LLM analysis step.`
    : tp.viewer_received_unredacted
      ? 'The transcript text shown to you has no privacy placeholders. Where permitted, the app serves unredacted source text.'
      : 'No privacy placeholders appear in the transcript string for this view.'

  const anonymizationStageSummary = masked
    ? 'Privacy masking appears in the transcript served to this viewer (see placeholders in Original feedback).'
    : 'No privacy placeholders in the transcript text shown for this view.'

  const replacementTypesLabel =
    tp.masking_token_types?.length > 0 ? tp.masking_token_types.map((x) => x.replace(/_/g, ' ')).join(', ') : '—'

  const perceptionSummary = multimodal
    ? 'The text was tokenized and audio features were combined for multimodal reasoning.'
    : 'The text was tokenized and structural features were extracted to prepare for analysis.'

  const sentimentSummary =
    analysis.signal_count != null && analysis.sentiment_score != null
      ? `${analysis.signal_count} sentiment signal(s) were considered. The score was ${analysis.sentiment_score >= 0 ? '+' : ''}${analysis.sentiment_score.toFixed(3)}.`
      : 'Sentiment signals were evaluated from the transcript (and audio cues when present).'

  const topicSummary = 'Topics were inferred from the model using the transcript and optional audio context.'

  const insightSummary =
    'A plain-language summary and recommended action were produced from sentiment, confidence, conflict/negativity flags, and topics.'

  const badgeMultimodal = multimodal ? (
    <span className="px-2 py-0.5 rounded-full text-xs font-medium border border-teal-500/50 text-teal-300 bg-teal-500/10">Multimodal</span>
  ) : (
    <span className="px-2 py-0.5 rounded-full text-xs font-medium border border-white/15 text-gray-300 bg-white/5">Text-only</span>
  )

  const badgeAnalysis = (
    <span className="px-2 py-0.5 rounded-full text-xs font-medium border border-white/20 text-gray-300 bg-white/5">Full analysis</span>
  )

  return (
    <div className={compact ? 'min-w-0 max-w-none space-y-4 text-[13px] leading-snug' : 'max-w-4xl space-y-5'}>
      {/* How this was decided */}
      <div className="rounded-xl border border-white/10 bg-slate-900/90 overflow-hidden">
        <div
          role="button"
          tabIndex={0}
          onClick={() => setHowOpen((o) => !o)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              setHowOpen((o) => !o)
            }
          }}
          className="flex w-full cursor-pointer flex-wrap items-center gap-2 p-4 text-left hover:bg-white/[0.03] sm:flex-nowrap sm:gap-3"
        >
          <ShieldCheck className="h-6 w-6 shrink-0" style={{ color: TEAL }} />
          <span className="inline-flex min-w-0 flex-1 items-center gap-1 font-bold text-white">
            How this was decided
            <InfoTip text={GLOSSARY.howThisWasDecided} />
          </span>
          <span className="inline-flex shrink-0 items-center gap-1">
            {badgeMultimodal}
            <InfoTip text={multimodal ? GLOSSARY.multimodal : GLOSSARY.textOnly} />
          </span>
          <span className="inline-flex shrink-0 items-center gap-1">
            {badgeAnalysis}
            <InfoTip text={GLOSSARY.fullAnalysis} />
          </span>
          <ChevronDown className={cx('h-5 w-5 shrink-0 text-gray-500 transition-transform', howOpen && '-rotate-180')} />
        </div>

        <AnimatePresence initial={false}>
          {howOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-white/10"
            >
              <div className="p-5 space-y-6">
                {analysis.decision_chain?.length > 0 && (
                  <div>
                    <SectionLabel hint={GLOSSARY.decisionChain}>Decision chain</SectionLabel>
                    <ol className="space-y-2 list-decimal list-inside text-sm text-gray-300 leading-relaxed">
                      {analysis.decision_chain.map((step, i) => (
                        <li key={i} className="pl-1 marker:text-gray-500">
                          {step}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                <div>
                  <SectionLabel hint={GLOSSARY.anonymization}>Anonymization</SectionLabel>
                  <p className="text-sm text-gray-400 mb-2 leading-relaxed">{anonymizationSummary}</p>
                  <div className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm space-y-1">
                    <div>
                      <span className="text-gray-500">Masking visible in transcript:</span>{' '}
                      <span className={masked ? 'text-amber-200/90' : 'text-emerald-300'}>
                        {masked ? `yes (${tp.approx_masking_tokens} token(s))` : 'no'}
                      </span>
                    </div>
                    {masked ? (
                      <p className="text-xs text-gray-500 pt-1">{tp.explanation}</p>
                    ) : null}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Processing stages — Routing omitted */}
      <div>
        <SectionLabel hint={GLOSSARY.processingStages}>Processing stages</SectionLabel>
        <p className="text-xs text-gray-600 mb-3 inline-flex flex-wrap items-center gap-1">
          Pipeline steps shown in order. Routing is not used in this product build.
          <InfoTip text={GLOSSARY.routingNote} />
        </p>
        <div className="space-y-2">
          <StageRow
            id="anonymization"
            icon={ShieldCheck}
            iconClass="text-teal-400"
            title="Anonymization"
            titleHint={GLOSSARY.anonymization}
            summary={anonymizationStageSummary}
            open={openStage.has('anonymization')}
            onToggle={toggleStage}
          >
            <IoCol
              title="Inputs"
              rows={[
                { k: 'Original character count', v: chars },
                { k: 'Source', v: multimodal ? 'Audio + transcript' : 'Transcript' },
                {
                  k: 'Viewer sees unredacted source',
                  v: tp.viewer_received_unredacted ? 'Yes (where original was stored and permitted)' : 'No — masked or pre-redacted text',
                },
              ]}
            />
            <IoCol
              title="Outputs"
              rows={[
                {
                  k: 'Text shows privacy placeholders',
                  v: masked ? `Yes (${tp.approx_masking_tokens} token(s))` : 'No',
                },
                {
                  k: 'Approx. masking tokens in view',
                  v: tp.approx_masking_tokens ?? 0,
                },
                {
                  k: 'Placeholder categories',
                  v: replacementTypesLabel,
                },
                {
                  k: 'Notes',
                  v:
                    'This reflects storage/role-based masking, not a separate step inside the LLM. Analysis may have run on raw or redacted text depending on ingest settings.',
                },
              ]}
            />
          </StageRow>

          <StageRow
            id="perception"
            icon={Eye}
            iconClass="text-sky-400"
            title="Perception"
            titleHint={GLOSSARY.perception}
            summary={perceptionSummary}
            open={openStage.has('perception')}
            onToggle={toggleStage}
          >
            <IoCol
              title="Inputs"
              rows={[
                { k: 'Word count', v: wc },
                { k: 'Text length', v: len },
                { k: 'Character count', v: chars },
                ...(multimodal
                  ? [
                      { k: 'Audio duration (approx.)', v: audio?.total_duration != null ? `${Number(audio.total_duration).toFixed(1)} s` : '—' },
                      { k: 'Speech rate (wps)', v: audio?.speech_rate ?? '—' },
                      { k: 'Silence ratio', v: audio?.silence_ratio != null ? Number(audio.silence_ratio).toFixed(2) : '—' },
                      { k: 'Rule-based tone label', v: audio?.tone_label ?? '—' },
                      {
                        k: 'Tone confidence (rule-based)',
                        v: audio?.tone_confidence != null ? Number(audio.tone_confidence).toFixed(2) : '—',
                      },
                      { k: 'Pause count (audio)', v: audio?.pause_count ?? '—' },
                      {
                        k: 'Avg pause duration (s)',
                        v: audio?.avg_pause_duration_sec != null ? Number(audio.avg_pause_duration_sec).toFixed(2) : '—',
                      },
                    ]
                  : []),
              ]}
            />
            <IoCol
              title="Outputs"
              rows={[
                // {
                //   k: 'Linguistics source',
                //   v:
                //     ling.source === 'heuristic_fallback'
                //       ? 'Heuristic fallback (when the model omits a block)'
                //       : ling.source === 'gpt'
                //         ? 'Large language model (same run as sentiment)'
                //         : 'Legacy row (unspecified)',
                // },
                { k: 'Negation words (surface forms)', v: negWords },
                {
                  k: 'Negation token count',
                  v: ling.negations_found ?? 0,
                },
                {
                  k: 'Diminisher words',
                  v: dimWords,
                },
                { k: 'Diminisher token count', v: ling.diminishers_found ?? 0 },
                { k: 'Intensifier words', v: intWords },
                { k: 'Intensifier token count', v: ling.intensifiers_found ?? 0 },
              ]}
            />
            <div className="md:col-span-2 grid grid-cols-2 gap-6 border-t border-white/10 pt-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Sarcasm</p>
                <p className={`text-lg font-semibold ${analysis.sarcasm_detected ? 'text-amber-300' : 'text-emerald-400'}`}>
                  {analysis.sarcasm_detected ? 'Detected' : 'None'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Hesitation</p>
                <p className={`text-lg font-semibold ${analysis.hesitation_detected ? 'text-amber-300' : 'text-emerald-400'}`}>
                  {analysis.hesitation_detected ? 'Detected' : 'None'}
                </p>
              </div>
            </div>
            <p className="md:col-span-2 text-[11px] text-gray-500 leading-relaxed">
              <span className="text-gray-400">Note:</span> Negation and diminisher counts describe{' '}
              <span className="text-gray-300">linguistic cues</span> in the text (e.g. &quot;not&quot;, &quot;somewhat&quot;). They are not the same
              as &quot;negative sentiment&quot; or toxicity — those appear under Sentiment analysis and elsewhere.
            </p>
          </StageRow>

          <StageRow
            id="sentiment"
            icon={CheckCircle}
            iconClass="text-emerald-400"
            title="Sentiment analysis"
            titleHint={GLOSSARY.sentimentAnalysis}
            summary={sentimentSummary}
            open={openStage.has('sentiment')}
            onToggle={toggleStage}
          >
            <div className="md:col-span-2 border-b border-white/10 pb-4 mb-1">
              <SentimentScoreBar score={analysis.sentiment_score} label="Sentiment score" />
            </div>
            <IoCol
              title="Inputs"
              rows={[
                { k: 'Analysis mode', v: multimodal ? 'Multimodal (text + audio features)' : 'Text' },
                { k: 'Tokens examined (words)', v: wc },
                { k: 'Tone alignment', v: analysis.tone_alignment ?? '—' },
                ...tokenInputRows,
              ]}
            />
            <IoCol
              title="Outputs"
              rows={[
                { k: 'Dominant emotion (model)', v: analysis.dominant_emotion ?? '—' },
                { k: 'Overall tone (model)', v: analysis.overall_tone ?? '—' },
                { k: 'Direction', v: analysis.overall_sentiment },
                { k: 'Confidence label', v: analysis.confidence_label },
                { k: 'Confidence score', v: analysis.confidence_score != null ? analysis.confidence_score.toFixed(3) : '—' },
                { k: 'Signal count', v: analysis.signal_count ?? '—' },
                { k: 'Key phrases detected', v: keyPhrases.length ? keyPhrases.join('; ') : '—' },
              ]}
            />
          </StageRow>

          <StageRow
            id="topic"
            icon={CheckCircle}
            iconClass="text-violet-400"
            title="Topic classification"
            titleHint={GLOSSARY.topicClassification}
            summary={topicSummary}
            open={openStage.has('topic')}
            onToggle={toggleStage}
          >
            <IoCol
              title="Inputs"
              rows={[
                {
                  k: 'Topic lexicon',
                  v: analysis.topic_lexicon || 'standard',
                },
              ]}
            />
            <IoCol
              title="Outputs"
              rows={[
                { k: 'Matched terms / phrases', v: matchedTerms },
                { k: 'Primary topic', v: analysis.primary_topic || '—' },
                { k: 'Secondary topic', v: analysis.secondary_topic ?? '—' },
                { k: 'Key topics (list)', v: analysis.key_topics?.length ? analysis.key_topics.join('; ') : '—' },
              ]}
            />
          </StageRow>

          <StageRow
            id="insight"
            icon={Lightbulb}
            iconClass="text-amber-400"
            title="Insight generation"
            titleHint={GLOSSARY.insightGeneration}
            summary={insightSummary}
            open={openStage.has('insight')}
            onToggle={toggleStage}
          >
            <IoCol
              title="Inputs"
              rows={[
                { k: 'Primary topic', v: analysis.primary_topic || '—' },
                { k: 'Sentiment', v: analysis.overall_sentiment },
                { k: 'Confidence', v: analysis.confidence_label },
                { k: 'Conflict detected', v: analysis.conflict_detected ? 'Yes' : 'No' },
                { k: 'Negativity detected', v: analysis.negativity_detected ? 'Yes' : 'No' },
              ]}
            />
            <IoCol
              title="Outputs"
              rows={[
                { k: 'Evidence count', v: analysis.supporting_evidence?.length ?? 0 },
                { k: 'Insight summary', v: analysis.summary || '—' },
                { k: 'Confidence label', v: analysis.confidence_label || '—' },
                { k: 'Recommended action', v: analysis.recommended_action || '—' },
              ]}
            />
          </StageRow>
        </div>
      </div>
    </div>
  )
}

export default EvidencePanel
