import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Mic, Square, UploadCloud } from 'lucide-react'

function audioBufferToWavBlob(audioBuffer) {
  const channels = audioBuffer.numberOfChannels
  const sampleRate = audioBuffer.sampleRate
  const format = 1
  const bitDepth = 16
  const samples = audioBuffer.length
  const blockAlign = channels * (bitDepth / 8)
  const byteRate = sampleRate * blockAlign
  const dataSize = samples * blockAlign
  const buffer = new ArrayBuffer(44 + dataSize)
  const view = new DataView(buffer)

  let offset = 0
  const writeString = (str) => {
    for (let i = 0; i < str.length; i += 1) view.setUint8(offset + i, str.charCodeAt(i))
    offset += str.length
  }

  writeString('RIFF')
  view.setUint32(offset, 36 + dataSize, true); offset += 4
  writeString('WAVE')
  writeString('fmt ')
  view.setUint32(offset, 16, true); offset += 4
  view.setUint16(offset, format, true); offset += 2
  view.setUint16(offset, channels, true); offset += 2
  view.setUint32(offset, sampleRate, true); offset += 4
  view.setUint32(offset, byteRate, true); offset += 4
  view.setUint16(offset, blockAlign, true); offset += 2
  view.setUint16(offset, bitDepth, true); offset += 2
  writeString('data')
  view.setUint32(offset, dataSize, true); offset += 4

  const channelData = []
  for (let c = 0; c < channels; c += 1) channelData.push(audioBuffer.getChannelData(c))
  for (let i = 0; i < samples; i += 1) {
    for (let c = 0; c < channels; c += 1) {
      const sample = Math.max(-1, Math.min(1, channelData[c][i] || 0))
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true)
      offset += 2
    }
  }
  return new Blob([buffer], { type: 'audio/wav' })
}

async function convertRecordedBlobToWavFile(blob) {
  const Ctx = window.AudioContext || window.webkitAudioContext
  if (!Ctx) throw new Error('AudioContext unavailable')
  const ctx = new Ctx()
  try {
    const arr = await blob.arrayBuffer()
    const decoded = await ctx.decodeAudioData(arr.slice(0))
    const wavBlob = audioBufferToWavBlob(decoded)
    return new File([wavBlob], `recording-${Date.now()}.wav`, { type: 'audio/wav' })
  } finally {
    await ctx.close()
  }
}

export default function SubmitPanel({
  mode,
  setMode,
  text,
  setText,
  audioFile,
  setAudioFile,
  onSubmit,
  isSubmitting,
  sourceId,
  setSourceId,
  departmentId,
  setDepartmentId,
  courseCode,
  setCourseCode,
  sources = [],
  departments = [],
}) {
  const [isRecording, setIsRecording] = useState(false)
  const [recordSeconds, setRecordSeconds] = useState(0)
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const [formError, setFormError] = useState('')

  useEffect(() => {
    if (!isRecording) return
    const t = setInterval(() => setRecordSeconds((s) => s + 1), 1000)
    return () => clearInterval(t)
  }, [isRecording])

  useEffect(() => {
    setFormError('')
  }, [mode, text, audioFile, isRecording])

  const handleSubmit = (e) => {
    e.preventDefault()
    const trimmed = (text || '').trim()
    if (mode === 'text') {
      if (!trimmed || trimmed.length < 10) {
        setFormError('Feedback text is required (min 10 characters).')
        return
      }
    }
    if (mode === 'audio') {
      if (isRecording) {
        setFormError('Finish recording before submitting.')
        return
      }
      if (!audioFile) {
        setFormError('Audio file is required (upload or record with the mic).')
        return
      }
    }
    onSubmit(e)
  }

  const fmt = useMemo(() => {
    const m = Math.floor(recordSeconds / 60)
    const s = recordSeconds % 60
    return `${m}:${String(s).padStart(2, '0')}`
  }, [recordSeconds])

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const recorder = new MediaRecorder(stream)
    chunksRef.current = []
    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunksRef.current.push(e.data)
    }
    recorder.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop())
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' })
      try {
        const wavFile = await convertRecordedBlobToWavFile(blob)
        setAudioFile(wavFile)
      } catch {
        const fallback = new File([blob], `recording-${Date.now()}.webm`, { type: blob.type || 'audio/webm' })
        setAudioFile(fallback)
      }
    }
    recorder.start()
    mediaRecorderRef.current = recorder
    setRecordSeconds(0)
    setIsRecording(true)
  }

  const stopRecording = () => {
    const r = mediaRecorderRef.current
    if (!r) return
    r.stop()
    mediaRecorderRef.current = null
    setIsRecording(false)
  }

  return (
    <form onSubmit={handleSubmit} className="brand-submit-panel rounded-2xl border border-slate-800 bg-slate-900/70 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
      <div className="border-b border-slate-800 px-6 py-4">
        <h2 className="text-lg font-semibold text-slate-100">Submit Feedback</h2>
        <p className="mt-1 text-xs text-slate-400">Enter student feedback text for analysis. Sources can be simulated.</p>
      </div>
      <div className="space-y-4 p-6">
        <div className="flex gap-2">
          <button type="button" disabled={isSubmitting} className={`rounded-lg border px-3 py-2 text-sm ${mode === 'text' ? 'border-cyan-400/40 bg-cyan-500/10 text-cyan-200' : 'border-slate-700 bg-slate-900 text-slate-300'} disabled:opacity-50`} onClick={() => setMode('text')}>Text</button>
          <button type="button" disabled={isSubmitting} className={`rounded-lg border px-3 py-2 text-sm ${mode === 'audio' ? 'border-violet-400/40 bg-violet-500/10 text-violet-200' : 'border-slate-700 bg-slate-900 text-slate-300'} disabled:opacity-50`} onClick={() => setMode('audio')}>Audio</button>
        </div>

        {mode === 'text' && (
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-300">
              Feedback Text <span className="text-red-200">*</span>
            </label>
            <textarea className="w-full rounded-xl border border-slate-700 bg-slate-900/40 p-3 min-h-36 text-slate-100 outline-none focus:border-slate-500" placeholder="Paste or type student feedback here..." value={text} onChange={(e) => setText(e.target.value)} disabled={isSubmitting} />
            <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
              <span>Minimum 10 characters</span>
              <span>{text.length} chars</span>
            </div>
            {formError && mode === 'text' ? <p className="mt-1 text-xs text-red-200">{formError}</p> : null}
          </div>
        )}

        {mode === 'audio' && (
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-300">
              Audio File <span className="text-red-200">*</span>
            </label>
            <input className="w-full rounded-xl border border-slate-700 bg-slate-900/40 p-3 text-sm" type="file" accept="audio/*" onChange={(e) => setAudioFile(e.target.files?.[0] || null)} disabled={isSubmitting} />
            <div className="mt-2 flex flex-wrap gap-2">
              {!isRecording ? (
                <button
                  type="button"
                  className="rounded-lg border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-200 inline-flex items-center gap-2"
                  disabled={isSubmitting}
                  onClick={startRecording}
                >
                  <Mic className="h-4 w-4" /> Record with Mic
                </button>
              ) : (
                <button
                  type="button"
                  className="rounded-lg border border-rose-400/40 bg-rose-500/20 px-3 py-2 text-sm text-rose-100 inline-flex items-center gap-2"
                  onClick={stopRecording}
                >
                  <Square className="h-4 w-4" /> Stop ({fmt})
                </button>
              )}
              <span className="text-xs text-slate-400 inline-flex items-center gap-2">
                <UploadCloud className="h-4 w-4" /> Upload or record — both run Whisper + analysis.
              </span>
            </div>
            {audioFile && <p className="mt-1 text-xs text-slate-400">Selected: {audioFile.name}</p>}
            {formError && mode === 'audio' ? <p className="mt-1 text-xs text-red-200">{formError}</p> : null}
          </div>
        )}

        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-300">
              Source <span className="text-slate-400">(optional)</span>
            </label>
            <select className="w-full rounded-lg border border-slate-700 bg-slate-900/40 px-3 py-2 text-sm outline-none focus:border-slate-500 [&>option]:text-slate-900 [&>option]:bg-white" value={sourceId} onChange={(e) => setSourceId(e.target.value)} disabled={isSubmitting}>
              <option value="">Select source</option>
              {sources.map((source) => <option key={source.id} value={String(source.id)}>{source.name}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-300">
              Department <span className="text-slate-400">(optional)</span>
            </label>
            <select className="w-full rounded-lg border border-slate-700 bg-slate-900/40 px-3 py-2 text-sm outline-none focus:border-slate-500 [&>option]:text-slate-900 [&>option]:bg-white" value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} disabled={isSubmitting}>
              <option value="">Select department</option>
              {departments.map((department) => <option key={department.id} value={String(department.id)}>{department.name}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-300">Course Code (optional)</label>
          <input className="w-full rounded-lg border border-slate-700 bg-slate-900/40 px-3 py-2 text-sm outline-none focus:border-slate-500" placeholder="e.g. CS301, BUS201" value={courseCode} onChange={(e) => setCourseCode(e.target.value)} disabled={isSubmitting} />
        </div>

        <button
          disabled={
            isSubmitting ||
            (mode === 'text' ? !(text || '').trim() || (text || '').trim().length < 10 : false) ||
            (mode === 'audio' ? isRecording || !audioFile : false)
          }
          type="submit"
          className="brand-cta w-full rounded-lg border border-transparent bg-gradient-to-r from-[#0970b8] to-[#05924a] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_4px_24px_-4px_rgba(9,112,184,0.55)] transition hover:brightness-110 disabled:opacity-60 disabled:hover:brightness-100"
        >
          {isSubmitting ? 'Analyzing & Submitting...' : 'Analyze Feedback'}
        </button>
      </div>
    </form>
  )
}
