import React from 'react'
import { motion } from 'framer-motion'
import { User, Clock, AlertTriangle } from 'lucide-react'

const sentimentStyle = {
  positive: 'bg-green-500/20 border-green-500/30 text-green-400',
  negative: 'bg-red-500/20 border-red-500/30 text-red-400',
  neutral:  'bg-gray-500/20 border-gray-500/30 text-gray-400',
  mixed:    'bg-yellow-500/20 border-yellow-500/30 text-yellow-400',
}

// Same golden-angle HSL as WaveformPlayer — unlimited speakers, always in sync
function speakerColor(idx) {
  const hue = (idx * 137.508) % 360
  return `hsla(${hue.toFixed(1)}, 80%, 62%, 0.9)`
}
function speakerColorMid(idx) {
  const hue = (idx * 137.508) % 360
  return `hsla(${hue.toFixed(1)}, 70%, 55%, 1)`
}
function speakerColorFaint(idx) {
  const hue = (idx * 137.508) % 360
  return `hsla(${hue.toFixed(1)}, 60%, 62%, 0.25)`
}

// Assign speaker index to each audio segment by pitch clustering — REMOVED (now done in backend + WaveformPlayer)


const SpeakersPanel = ({ analysis }) => {
  const speakers = analysis?.speakers || []
  const segmentInsights = analysis?.segment_insights || []
  const hasShifts = segmentInsights.some(s => s.tone_shift || s.negativity_spike)

  if (speakers.length === 0 && segmentInsights.length === 0) {
    return (
      <div className="glass-effect rounded-xl p-10 text-center text-gray-500">
        <User className="w-10 h-10 mx-auto mb-3 opacity-40" />
        <p>No speaker data available</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Speakers */}
      {speakers.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {speakers.map((sp, i) => {
            const style = sentimentStyle[sp.sentiment] || sentimentStyle.neutral
            const avatarColor = speakerColor(i)
            const faintColor  = speakerColorFaint(i)
            const solidColor  = speakerColorMid(i)
            return (
              <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="glass-effect rounded-xl p-5"
                style={{ borderLeft: `3px solid ${avatarColor}` }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-white shrink-0"
                    style={{ background: `linear-gradient(135deg, ${avatarColor}, ${solidColor})`, boxShadow: `0 0 0 2px ${faintColor}` }}
                  >
                    {sp.speaker_id?.replace(/\D/g, '') || (i + 1)}
                  </div>
                  <div>
                    <p className="font-semibold">{sp.speaker_id || `Speaker ${i + 1}`}</p>
                    <p className="text-xs text-gray-500 capitalize">{sp.dominant_tone || 'unknown tone'}</p>
                  </div>
                  <span className={`ml-auto px-2.5 py-1 rounded-full text-xs font-semibold border capitalize ${style}`}>
                    {sp.sentiment || 'neutral'}
                  </span>
                </div>

                {sp.key_statements?.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-gray-500 mb-1">Key statements</p>
                    {sp.key_statements.map((s, j) => (
                      <p key={j} className="text-sm text-gray-300 bg-white/5 rounded-lg p-2.5 leading-relaxed"
                        style={{ borderLeft: `2px solid ${avatarColor}` }}>
                        "{s}"
                      </p>
                    ))}
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Segment timeline */}
      {hasShifts && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="glass-effect rounded-xl p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold">Conversation Timeline</h3>
            <span className="text-xs text-gray-500 ml-auto">flagged moments only</span>
          </div>
          <div className="space-y-2">
            {segmentInsights.filter(s => s.tone_shift || s.negativity_spike || s.key_moment).map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className={`flex items-start gap-3 p-3 rounded-lg border text-sm
                  ${s.negativity_spike ? 'bg-red-500/10 border-red-500/20' : 'bg-yellow-500/10 border-yellow-500/20'}
                `}
              >
                <span className="text-xs text-gray-500 font-mono whitespace-nowrap mt-0.5">
                  {s.start_sec?.toFixed(1)}s – {s.end_sec?.toFixed(1)}s
                </span>
                <div className="flex-1">
                  <div className="flex gap-2 mb-1 flex-wrap">
                    {s.tone_shift && (
                      <span className="text-xs px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded-full">tone shift</span>
                    )}
                    {s.negativity_spike && (
                      <span className="text-xs px-2 py-0.5 bg-red-500/20 text-red-400 rounded-full flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> negativity spike
                      </span>
                    )}
                  </div>
                  {s.key_moment && <p className="text-gray-300">{s.key_moment}</p>}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}

export default SpeakersPanel
