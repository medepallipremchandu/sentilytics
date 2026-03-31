import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, CheckCircle, FileText, Waves, Users, BarChart3, Activity, Shield } from 'lucide-react'
import { TAB_HINTS } from '../lib/analysisGlossary'
import InfoTip from './common/InfoTip'
import TranscriptView from './TranscriptView'
import AudioPanel from './AudioPanel'
import AnalysisPanel from './AnalysisPanel'
import SpeakersPanel from './SpeakersPanel'
import UsageStats from './UsageStats'
import EvidencePanel from './EvidencePanel'

const TABS = [
  { id: 'analysis',  label: 'Analysis',    icon: BarChart3 },
  { id: 'evidence',  label: 'Evidence',    icon: Shield },
  { id: 'speakers',  label: 'Speakers',    icon: Users },
  { id: 'audio',     label: 'Audio Signal', icon: Waves },
  { id: 'transcript', label: 'Transcript', icon: FileText },
  { id: 'usage',     label: 'Usage',       icon: Activity },
]

const sentimentColor = (s) => ({
  positive: 'text-green-400', negative: 'text-red-400',
  mixed: 'text-yellow-400', neutral: 'text-gray-400',
}[s] || 'text-gray-400')

const ResultsDisplay = ({ results, onReset, audioFile }) => {
  const [tab, setTab] = useState('analysis')
  const { analysis, audio, transcript, usage, transcript_privacy: transcriptPrivacy } = results
  const hasAudio = !!audio
  const analysisMeta = { sourceLabel: hasAudio ? 'Voice analysis' : 'Text analysis', analyzedAt: new Date().toLocaleString() }

  const visibleTabs = hasAudio ? TABS : TABS.filter(t => t.id !== 'audio')

  return (
    <div className="max-w-6xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-5"
      >
        <motion.button whileHover={{ x: -4 }} onClick={onReset}
          className="flex items-center gap-2 glass-effect px-4 py-2 rounded-lg hover:bg-white/20 transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          New Analysis
        </motion.button>
        <div className="flex items-center gap-2 glass-effect px-4 py-2 rounded-lg">
          <CheckCircle className="w-4 h-4 text-green-400" />
          <span className="text-green-400 text-sm font-semibold">Complete</span>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
        className="glass-effect rounded-2xl p-6 mb-5 grid grid-cols-2 md:grid-cols-5 gap-4"
      >
        <div className="text-center">
          <p className="text-xs text-gray-500 mb-1">Sentiment</p>
          <p className={`text-xl font-bold capitalize ${sentimentColor(analysis?.overall_sentiment)}`}>
            {analysis?.overall_sentiment || '—'}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500 mb-1">Emotion</p>
          <p className="text-xl font-bold text-white capitalize">{analysis?.dominant_emotion || '—'}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500 mb-1">Confidence</p>
          <p className="text-xl font-bold text-blue-400">
            {analysis?.confidence_score != null ? `${Math.round(analysis.confidence_score * 100)}%` : '—'}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500 mb-1">Conflict</p>
          <p className={`text-xl font-bold ${analysis?.conflict_detected ? 'text-red-400' : 'text-green-400'}`}>
            {analysis?.conflict_detected ? 'Detected' : 'None'}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500 mb-1">Negativity</p>
          <p className={`text-xl font-bold ${analysis?.negativity_detected ? 'text-red-400' : 'text-green-400'}`}>
            {analysis?.negativity_detected ? 'Detected' : 'None'}
          </p>
        </div>
      </motion.div>

      <div
        className="glass-effect mb-5 flex gap-1 overflow-x-auto overflow-y-visible rounded-xl p-1.5 [scrollbar-gutter:stable]"
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
            className={`flex cursor-pointer items-center gap-2 whitespace-nowrap rounded-lg px-5 py-2.5 text-sm font-medium transition-all
              ${tab === id
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md'
                : 'text-gray-400 hover:bg-white/10 hover:text-white'
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

      <motion.div key={tab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        {tab === 'analysis' && (
          <AnalysisPanel
            analysis={analysis}
            transcript={transcript || ''}
            meta={analysisMeta}
            hasAudio={hasAudio}
          />
        )}
        {tab === 'evidence' && (
          <EvidencePanel
            analysis={analysis}
            transcript={transcript || ''}
            audio={audio}
            hasAudio={hasAudio}
            usage={usage}
            transcriptPrivacy={transcriptPrivacy}
          />
        )}
        {tab === 'speakers'   && <SpeakersPanel analysis={analysis} />}
        {tab === 'audio'      && hasAudio && (
          <AudioPanel audio={audio} audioFile={audioFile}
            segmentInsights={analysis?.segment_insights}
            analysis={analysis}
          />
        )}
        {tab === 'transcript' && <TranscriptView transcript={transcript} />}
        {tab === 'usage'      && <UsageStats usage={usage} hasAudio={hasAudio} />}
      </motion.div>
    </div>
  )
}

export default ResultsDisplay
