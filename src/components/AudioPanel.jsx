import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Waves, BarChart3, ChevronDown, ChevronRight, Info, AlertTriangle, Zap } from 'lucide-react'
import { GLOSSARY } from '../lib/analysisGlossary'
import InfoTip from './common/InfoTip'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, ResponsiveContainer } from 'recharts'
import WaveformPlayer from './WaveformPlayer'

const FIELD_INFO = {
  avg_pitch:         'Average vocal frequency. Below 130 Hz = low/calm, 130–220 = normal, above 220 = high/excited or angry.',
  pitch_variation:   'How much pitch changes within this segment. Below 20 = monotone (possible sarcasm), above 50 = highly expressive.',
  pitch_trend:       'Direction pitch moved: rising = escalating emotion, falling = winding down, stable = controlled delivery.',
  avg_volume:        'Average loudness (RMS energy ×1000). Below 20 = soft/disengaged, 20–50 = normal, above 50 = loud/assertive.',
  volume_spikes:     'Count of sudden loudness bursts within this segment — often signals emphasis, frustration, or anger.',
  speech_rate:       'Words per second. Below 2 = slow/hesitant, 2–4 = normal, above 4 = fast/anxious.',
  pause_count:       'Number of silence gaps of 0.3s or longer. Many pauses can indicate hesitation or discomfort.',
  silence_ratio:     'Fraction of the segment that is silent. Above 40% may indicate disengagement or tension.',
  speaking_duration: 'Actual time the speaker was talking — total segment length minus silence.',
  tone_label:        'Rule-based tone estimate derived from pitch, volume, and speech rate thresholds. Not AI-generated.',
  tone_confidence:   'How strongly the audio signals matched the tone rule. This is rule-based, not from AI — higher means a clearer signal match.',
  segment_time:      'Start and end time of this 7-second audio segment within the full recording.',
}

const Tip = ({ text }) => {
  const [show, setShow] = useState(false)
  return (
    <span className="relative inline-flex items-center ml-1"
      onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}
    >
      <Info className="w-3.5 h-3.5 text-slate-400 hover:text-slate-200 cursor-help transition-colors" />
      {show && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-60 rounded-xl bg-slate-800 border border-slate-600 px-3 py-2.5 text-xs text-slate-200 leading-relaxed shadow-2xl" style={{ zIndex: 9999 }}>
          {text}
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
        </span>
      )}
    </span>
  )
}

const TONE_COLORS = {
  excited:    { bg: 'bg-yellow-500/20', text: 'text-yellow-300', border: 'border-yellow-500/40' },
  angry:      { bg: 'bg-red-500/20',    text: 'text-red-300',    border: 'border-red-500/40' },
  frustrated: { bg: 'bg-orange-500/20', text: 'text-orange-300', border: 'border-orange-500/40' },
  sad:        { bg: 'bg-blue-500/20',   text: 'text-blue-300',   border: 'border-blue-500/40' },
  disengaged: { bg: 'bg-slate-500/20',  text: 'text-slate-400',  border: 'border-slate-500/40' },
  sarcastic:  { bg: 'bg-purple-500/20', text: 'text-purple-300', border: 'border-purple-500/40' },
  neutral:    { bg: 'bg-green-500/20',  text: 'text-green-300',  border: 'border-green-500/40' },
}

const SENTIMENT_COLORS = {
  positive: { bg: 'bg-green-500/15',  text: 'text-green-300',  border: 'border-green-500/30',  dot: 'bg-green-400' },
  negative: { bg: 'bg-red-500/15',    text: 'text-red-300',    border: 'border-red-500/30',    dot: 'bg-red-400' },
  neutral:  { bg: 'bg-yellow-500/10', text: 'text-yellow-300', border: 'border-yellow-500/25', dot: 'bg-yellow-400' },
}

const ToneChip = ({ label }) => {
  const c = TONE_COLORS[label] || TONE_COLORS.neutral
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize ${c.bg} ${c.text} ${c.border}`}>
      {label}
    </span>
  )
}

const SentimentChip = ({ label }) => {
  const c = SENTIMENT_COLORS[label] || SENTIMENT_COLORS.neutral
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize ${c.bg} ${c.text} ${c.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {label}
    </span>
  )
}

const Stat = ({ label, value, sub, color = 'text-white', tip }) => (
  <div className="bg-white/5 rounded-xl p-4">
    <p className="text-xs text-slate-400 mb-1 flex items-center font-medium">
      {label}
      {tip && <Tip text={tip} />}
    </p>
    <p className={`text-xl font-bold ${color}`}>{value}</p>
    {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
  </div>
)

const pitchColor = (v) => v > 220 ? 'text-red-400' : v < 130 ? 'text-blue-400' : 'text-slate-300'
const volColor   = (v) => v > 0.05 ? 'text-red-400' : v < 0.02 ? 'text-blue-400' : 'text-slate-300'

const SegmentRow = ({ s, insight }) => {
  const [open, setOpen] = useState(false)

  const expanded = [
    { label: 'Pitch Variation',   val: s.pitch_variation?.toFixed(1),             tip: FIELD_INFO.pitch_variation,   color: '' },
    { label: 'Pitch Trend',       val: s.pitch_trend,                              tip: FIELD_INFO.pitch_trend,       color: '' },
    { label: 'Speech Rate',       val: `${s.speech_rate?.toFixed(1)} wps`,         tip: FIELD_INFO.speech_rate,       color: s.speech_rate < 2 ? 'text-yellow-400' : s.speech_rate > 4 ? 'text-orange-400' : 'text-slate-300' },
    { label: 'Pauses',            val: s.pause_count,                              tip: FIELD_INFO.pause_count,       color: s.pause_count > 3 ? 'text-yellow-400' : 'text-slate-300' },
    { label: 'Speaking Duration', val: `${s.speaking_duration?.toFixed(2)}s`,      tip: FIELD_INFO.speaking_duration, color: '' },
    { label: 'Tone Confidence',   val: `${(s.tone_confidence * 100).toFixed(0)}%`, tip: FIELD_INFO.tone_confidence,   color: s.tone_confidence >= 0.7 ? 'text-green-400' : 'text-slate-400' },
  ]

  return (
    <>
      <tr onClick={() => setOpen(o => !o)}
        className="border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer select-none"
      >
        <td className="py-2.5 pr-3 text-slate-400 font-mono text-xs whitespace-nowrap">
          <span className="inline-flex items-center gap-1.5">
            {open ? <ChevronDown className="w-3 h-3 text-slate-500" /> : <ChevronRight className="w-3 h-3 text-slate-500" />}
            {s.start_sec?.toFixed(1)}–{s.end_sec?.toFixed(1)}s
          </span>
        </td>
        <td className={`py-2.5 pr-3 text-right font-mono text-xs ${pitchColor(s.avg_pitch)}`}>{s.avg_pitch?.toFixed(0)}</td>
        <td className={`py-2.5 pr-3 text-right font-mono text-xs ${volColor(s.avg_volume)}`}>{(s.avg_volume * 1000)?.toFixed(1)}</td>
        <td className={`py-2.5 pr-3 text-right font-mono text-xs ${s.volume_spikes > 2 ? 'text-orange-400' : 'text-slate-300'}`}>{s.volume_spikes}</td>
        <td className={`py-2.5 pr-3 text-right font-mono text-xs ${s.silence_ratio > 0.4 ? 'text-yellow-400' : 'text-slate-300'}`}>{(s.silence_ratio * 100)?.toFixed(0)}%</td>
        <td className="py-2.5 pr-3"><ToneChip label={s.tone_label} /></td>
        <td className="py-2.5">
          {insight ? <SentimentChip label={insight.sentiment_label} /> : <span className="text-slate-600 text-xs">—</span>}
        </td>
      </tr>

      <AnimatePresence>
        {open && (
          <tr>
            <td colSpan={7} className="p-0">
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.18 }} className="overflow-hidden"
              >
                <div className="px-4 py-3 bg-white/3 border-b border-white/5 space-y-3">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
                    {expanded.map(({ label, val, tip, color }) => (
                      <div key={label} className="bg-white/5 rounded-lg px-3 py-2">
                        <p className="text-xs text-slate-400 flex items-center gap-0.5 mb-0.5 font-medium">
                          {label}<Tip text={tip} />
                        </p>
                        <p className={`text-sm font-semibold ${color || 'text-slate-200'}`}>{val ?? '—'}</p>
                      </div>
                    ))}
                  </div>
                  {insight?.key_moment && (
                    <div className="flex items-start gap-2 px-3 py-2.5 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                      <Zap className="w-3.5 h-3.5 text-blue-400 mt-0.5 shrink-0" />
                      <p className="text-xs text-blue-200 leading-relaxed">{insight.key_moment}</p>
                    </div>
                  )}
                  {insight && (insight.tone_shift || insight.negativity_spike) && (
                    <div className="flex gap-2">
                      {insight.tone_shift && (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-yellow-500/15 text-yellow-300 border border-yellow-500/30">Tone Shift</span>
                      )}
                      {insight.negativity_spike && (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-red-500/15 text-red-300 border border-red-500/30 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />Negativity Spike
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            </td>
          </tr>
        )}
      </AnimatePresence>
    </>
  )
}

const ColHeader = ({ label, tip, right }) => (
  <th className={`pb-2.5 pr-3 text-slate-400 text-xs font-semibold ${right ? 'text-right' : 'text-left'}`}>
    <span className="inline-flex items-center gap-0.5">
      {label}
      {tip && <Tip text={tip} />}
    </span>
  </th>
)

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg p-3 text-sm border border-slate-600 bg-slate-800 shadow-xl">
      <p className="text-slate-400 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>{p.name}: {typeof p.value === 'number' ? p.value.toFixed(2) : p.value}</p>
      ))}
    </div>
  )
}

const AudioPanel = ({ audio, audioFile, audioUrl, audioDownloadUrl, audioDownloadFilename, segmentInsights, analysis }) => {
  if (!audio) return null

  const insightMap = {}
  ;(segmentInsights || []).forEach(si => { insightMap[si.segment_index] = si })

  const segmentChartData = (audio.segments || []).map(s => ({
    name: `${s.start_sec?.toFixed(0)}s`,
    pitch: s.avg_pitch,
    volume: +(s.avg_volume * 1000).toFixed(2),
  }))

  return (
    <div className="space-y-4">

      {/* Waveform */}
      {audio.waveform_data?.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-effect rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <Waves className="w-5 h-5 text-cyan-400 shrink-0" />
            <h3 className="font-bold text-white flex items-center gap-1">
              Waveform
              <InfoTip text={GLOSSARY.audioSignalTab} />
            </h3>
            <span className="text-xs text-slate-400 ml-auto">top = sentiment · bottom = speaker</span>
          </div>
          <WaveformPlayer
            audioFile={audioFile}
            audioUrl={audioUrl}
            downloadUrl={audioDownloadUrl}
            downloadFilename={audioDownloadFilename}
            waveformData={audio.waveform_data}
            waveformTimes={audio.waveform_times}
            totalDuration={audio.total_duration}
            segmentInsights={segmentInsights}
            audioSegments={audio.segments}
          />
        </motion.div>
      )}

      {/* Overview */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-effect rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Waves className="w-5 h-5 text-blue-400" />
          <h3 className="font-bold text-white">Signal Overview</h3>
          <ToneChip label={audio.tone_label} />
          <span className="text-xs text-slate-300 ml-1 font-medium">{(audio.tone_confidence * 100).toFixed(0)}% rule confidence</span>
          <Tip text={FIELD_INFO.tone_confidence} />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat label="Total Duration"    value={`${audio.total_duration?.toFixed(1)}s`} />
          <Stat label="Speaking Duration" value={`${audio.speaking_duration?.toFixed(1)}s`} tip={FIELD_INFO.speaking_duration} />
          <Stat label="Silence Ratio"     value={`${(audio.silence_ratio * 100).toFixed(0)}%`}
            color={audio.silence_ratio > 0.4 ? 'text-yellow-400' : 'text-white'} tip={FIELD_INFO.silence_ratio} />
          <Stat label="Segments" value={audio.segment_count} sub="7s each" />
        </div>
      </motion.div>

      {/* Pitch & Volume */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-effect rounded-xl p-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <Stat label="Avg Pitch"       value={`${audio.avg_pitch?.toFixed(0)} Hz`} sub={audio.pitch_trend} tip={FIELD_INFO.avg_pitch}
            color={audio.avg_pitch > 220 ? 'text-red-400' : audio.avg_pitch < 130 ? 'text-blue-400' : 'text-white'} />
          <Stat label="Pitch Variation" value={audio.pitch_variation?.toFixed(1)} tip={FIELD_INFO.pitch_variation}
            sub={audio.pitch_variation < 20 ? 'monotone' : audio.pitch_variation > 50 ? 'expressive' : 'normal'} />
          <Stat label="Avg Volume"      value={(audio.avg_volume * 1000).toFixed(2)} sub="RMS ×1000" tip={FIELD_INFO.avg_volume}
            color={audio.avg_volume > 0.05 ? 'text-red-400' : audio.avg_volume < 0.02 ? 'text-blue-400' : 'text-white'} />
          <Stat label="Volume Spikes"   value={audio.volume_spikes} tip={FIELD_INFO.volume_spikes}
            color={audio.volume_spikes > 5 ? 'text-red-400' : 'text-white'} />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Stat label="Speech Rate" value={`${audio.speech_rate?.toFixed(1)} wps`} tip={FIELD_INFO.speech_rate}
            sub={audio.speech_rate < 2 ? 'slow/hesitant' : audio.speech_rate > 4 ? 'fast/anxious' : 'normal'} />
          <Stat label="Pauses" value={audio.pause_count} sub={`avg ${audio.avg_pause_duration_sec?.toFixed(2)}s each`} tip={FIELD_INFO.pause_count} />
          <Stat label="Pitch Trend" value={audio.pitch_trend} tip={FIELD_INFO.pitch_trend} />
        </div>
      </motion.div>

      {/* Chart */}
      {segmentChartData.length > 1 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-effect rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-purple-400" />
            <h3 className="font-bold text-white">Pitch per Segment</h3>
            <span className="text-xs text-slate-400 ml-auto">Hz over time</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={segmentChartData} barSize={18}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} />
              <ReTooltip content={<CustomTooltip />} />
              <Bar dataKey="pitch" name="Pitch (Hz)" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Segment Breakdown */}
      {audio.segments?.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-effect rounded-xl p-5">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-white">Segment Breakdown</h3>
            <span className="text-xs text-slate-400">— click a row to expand all fields</span>
          </div>
          <p className="text-xs text-slate-400 mb-3 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            Tone and tone confidence are <span className="text-slate-200 font-medium">rule-based signals</span> from pitch, volume, and speech rate thresholds — not AI-generated. Sentiment label comes from GPT analysis.
          </p>
          <div className="overflow-visible">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <ColHeader label="Time"      tip={FIELD_INFO.segment_time} />
                  <ColHeader label="Pitch Hz"  tip={FIELD_INFO.avg_pitch}     right />
                  <ColHeader label="Vol ×1k"   tip={FIELD_INFO.avg_volume}    right />
                  <ColHeader label="Spikes"    tip={FIELD_INFO.volume_spikes} right />
                  <ColHeader label="Silence"   tip={FIELD_INFO.silence_ratio} right />
                  <ColHeader label="Tone"      tip={FIELD_INFO.tone_label} />
                  <ColHeader label="Sentiment" tip="GPT-assigned sentiment label for this segment based on transcript content." />
                </tr>
              </thead>
              <tbody>
                {audio.segments.map((s, i) => (
                  <SegmentRow key={i} s={s} insight={insightMap[s.segment_index]} />
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Segment Insights summary cards */}
      {segmentInsights?.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-effect rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-yellow-400" />
            <h3 className="font-bold text-white">Segment Insights</h3>
            <span className="text-xs text-slate-400 ml-auto">GPT analysis per segment</span>
          </div>
          <div className="space-y-2">
            {segmentInsights.map((si, i) => {
              const sc = SENTIMENT_COLORS[si.sentiment_label] || SENTIMENT_COLORS.neutral
              return (
                <div key={i} className={`flex gap-3 p-3 rounded-xl border ${sc.bg} ${sc.border}`}>
                  <div className="shrink-0 flex flex-col items-center gap-1 pt-0.5">
                    <span className="text-xs font-bold text-slate-400">#{si.segment_index}</span>
                    <span className="text-xs text-slate-500 font-mono">{si.start_sec?.toFixed(0)}s</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <SentimentChip label={si.sentiment_label} />
                      {si.tone_shift && (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-yellow-500/15 text-yellow-300 border border-yellow-500/30">Tone Shift</span>
                      )}
                      {si.negativity_spike && (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-red-500/15 text-red-300 border border-red-500/30 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />Negativity Spike
                        </span>
                      )}
                      <span className="text-xs text-slate-500 ml-auto font-mono">{si.start_sec?.toFixed(1)}–{si.end_sec?.toFixed(1)}s</span>
                    </div>
                    {si.key_moment && (
                      <p className={`text-xs leading-relaxed ${sc.text}`}>{si.key_moment}</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </motion.div>
      )}

    </div>
  )
}

export default AudioPanel
