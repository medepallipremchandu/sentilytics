import React, { useMemo, useState } from 'react'
import { Activity, BarChart3, FileText, Shield, Users, Waves } from 'lucide-react'
import { API_URL } from '../../lib/api'
import { TAB_HINTS } from '../../lib/analysisGlossary'
import InfoTip from '../common/InfoTip'
import Modal from '../common/Modal'
import AnalysisPanel from '../AnalysisPanel'
import AudioPanel from '../AudioPanel'
import EvidencePanel from '../EvidencePanel'
import SpeakersPanel from '../SpeakersPanel'
import TranscriptView from '../TranscriptView'
import UsageStats from '../UsageStats'

const TABS = [
  { id: 'analysis', label: 'Analysis', icon: BarChart3 },
  { id: 'evidence', label: 'Evidence', icon: Shield },
  { id: 'speakers', label: 'Speakers', icon: Users },
  { id: 'audio', label: 'Audio Signal', icon: Waves },
  { id: 'transcript', label: 'Transcript', icon: FileText },
  { id: 'usage', label: 'Usage', icon: Activity },
]

export default function FeedbackAnalysisModal({ open, onClose, row, permissions = [] }) {
  const [tab, setTab] = useState('analysis')
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
    return TABS.filter((t) => out.includes(t.id))
  }, [audio, canViewAnalysis, canViewTranscript, canViewUsage])

  if (!row) return null

  return (
    <Modal
      open={open}
      onClose={onClose}
      title=""
      showHeader={false}
      panelClassName="max-w-[min(1400px,100%)]"
      bodyClassName="overflow-y-auto"
    >
      {!analysisBundle ? (
        <div className="rounded-xl border border-slate-700 p-4 text-sm text-slate-300">No analysis data found for this feedback.</div>
      ) : (
        <div className="space-y-3">
          <div className="glass-effect rounded-xl p-3 grid grid-cols-2 md:grid-cols-5 gap-2">
            <Metric label="Sentiment" value={analysis?.overall_sentiment || row.sentiment || 'neutral'} />
            <Metric label="Emotion" value={analysis?.dominant_emotion || '—'} />
            <Metric label="Confidence" value={analysis?.confidence_score != null ? `${Math.round(analysis.confidence_score * 100)}%` : '—'} />
            <Metric label="Conflict" value={analysis?.conflict_detected ? 'Detected' : 'None'} />
            <Metric label="Negativity" value={analysis?.negativity_detected ? 'Detected' : 'None'} />
          </div>

          <div
            className="glass-effect flex gap-1 overflow-x-auto overflow-y-visible rounded-xl p-1 [scrollbar-gutter:stable]"
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
                className={`flex cursor-pointer items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
                  tab === id ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white' : 'text-gray-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="flex items-center gap-1">
                  {label}
                  {TAB_HINTS[id] ? <InfoTip text={TAB_HINTS[id]} /> : null}
                </span>
              </div>
            ))}
          </div>

          <div>
            {tab === 'analysis' && canViewAnalysis && (
              <AnalysisPanel
                analysis={analysis}
                transcript={transcript || ''}
                meta={analysisMeta}
                hasAudio={!!audio}
              />
            )}
            {tab === 'evidence' && canViewAnalysis && (
              <EvidencePanel
                analysis={analysis}
                transcript={transcript || ''}
                audio={audio}
                hasAudio={!!audio}
                usage={usage}
                transcriptPrivacy={transcriptPrivacy}
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
                audioDownloadFilename={row?.audio_file || `feedback-${row?.id}.audio`}
                segmentInsights={analysis?.segment_insights}
                analysis={analysis}
              />
            )}
            {tab === 'transcript' && canViewTranscript && <TranscriptView transcript={transcript} />}
            {tab === 'usage' && canViewUsage && <UsageStats usage={usage} hasAudio={!!audio} />}
          </div>
        </div>
      )}
    </Modal>
  )
}

function Metric({ label, value }) {
  return (
    <div className="text-center">
      <p className="text-[11px] text-gray-500 mb-1">{label}</p>
      <p className="text-sm font-semibold capitalize">{value}</p>
    </div>
  )
}
