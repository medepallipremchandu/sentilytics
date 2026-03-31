import { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import { Play, Pause, Download } from 'lucide-react'

// Top half — sentiment colors
const SENTIMENT_COLORS = {
  positive: 'rgba(74, 222, 128, 0.85)',
  negative: 'rgba(248, 113, 113, 0.85)',
  neutral:  'rgba(250, 204, 21, 0.75)',
}
const SENTIMENT_DIM = {
  positive: 'rgba(74, 222, 128, 0.2)',
  negative: 'rgba(248, 113, 113, 0.2)',
  neutral:  'rgba(250, 204, 21, 0.18)',
}

// Generate a distinct HSL color for any speaker index
function speakerColor(idx, alpha = 0.9) {
  // Golden angle spacing ensures max perceptual distance between adjacent hues
  const hue = (idx * 137.508) % 360
  return `hsla(${hue.toFixed(1)}, 80%, 62%, ${alpha})`
}
function speakerColorDim(idx) { return speakerColor(idx, 0.22) }

function buildSpeakerMap(audioSegments) {
  if (!audioSegments?.length) return {}
  // Prefer backend-assigned speaker_id
  const hasBackendIds = audioSegments.some(s => s.speaker_id != null)
  if (hasBackendIds) {
    const map = {}
    audioSegments.forEach(s => { map[s.segment_index] = s.speaker_id ?? 0 })
    return map
  }
  // Fallback: elbow k-means on pitch
  const voiced = audioSegments.filter(s => s.avg_pitch > 0)
  if (voiced.length < 2) return {}

  const kmeans = (pitches, k) => {
    const sorted = [...pitches].sort((a, b) => a - b)
    let centroids = Array.from({ length: k }, (_, i) =>
      sorted[Math.floor(i * (sorted.length - 1) / Math.max(k - 1, 1))]
    )
    let labels = new Array(pitches.length).fill(0)
    for (let iter = 0; iter < 30; iter++) {
      const newLabels = pitches.map(p =>
        centroids.reduce((best, c, j) =>
          Math.abs(p - c) < Math.abs(p - centroids[best]) ? j : best, 0)
      )
      const changed = newLabels.some((l, i) => l !== labels[i])
      labels = newLabels
      if (!changed) break
      centroids = centroids.map((_, j) => {
        const members = pitches.filter((_, i) => labels[i] === j)
        return members.length ? members.reduce((a, b) => a + b, 0) / members.length : centroids[j]
      })
    }
    const inertia = pitches.reduce((sum, p, i) => sum + (p - centroids[labels[i]]) ** 2, 0)
    return { labels, inertia }
  }

  const pitches = voiced.map(s => s.avg_pitch)
  const maxK = Math.min(5, Math.floor(voiced.length / 2))
  const inertias = Array.from({ length: maxK }, (_, i) => kmeans(pitches, i + 1).inertia)
  const totalDrop = inertias[0] - inertias[inertias.length - 1]
  let bestK = 1
  if (totalDrop > 1e-6) {
    for (let k = 1; k < inertias.length; k++) {
      if ((inertias[k - 1] - inertias[k]) / totalDrop < 0.20) { bestK = k; break }
      bestK = k + 1
    }
  }

  const { labels } = kmeans(pitches, bestK)
  const map = {}
  voiced.forEach((s, i) => { map[s.segment_index] = labels[i] })
  audioSegments.filter(s => s.avg_pitch === 0).forEach(s => { map[s.segment_index] = 0 })
  return map
}

function getSegmentAtTime(segments, t) {
  return segments?.find(s => t >= s.start_sec && t < s.end_sec)
}

const WaveformPlayer = ({
  audioFile,
  audioUrl: remoteAudioUrl,
  downloadUrl,
  downloadFilename,
  waveformData,
  waveformTimes,
  totalDuration,
  segmentInsights,
  audioSegments,
}) => {
  const canvasRef = useRef(null)
  const audioRef = useRef(null)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [audioUrl, setAudioUrl] = useState(null)
  const [downloading, setDownloading] = useState(false)

  const speakerMap = useMemo(
    () => buildSpeakerMap(audioSegments),
    [audioSegments]
  )

  useEffect(() => {
    if (remoteAudioUrl) {
      let revokedUrl = null
      let cancelled = false
      const token = localStorage.getItem('token') || ''
      fetch(remoteAudioUrl, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
        .then(async (res) => {
          if (!res.ok) throw new Error('Audio fetch failed')
          return res.blob()
        })
        .then((blob) => {
          if (cancelled) return
          revokedUrl = URL.createObjectURL(blob)
          setAudioUrl(revokedUrl)
        })
        .catch(() => {
          if (!cancelled) setAudioUrl(null)
        })
      return () => {
        cancelled = true
        if (revokedUrl) URL.revokeObjectURL(revokedUrl)
      }
    }
    if (audioFile) {
      const url = URL.createObjectURL(audioFile)
      setAudioUrl(url)
      return () => URL.revokeObjectURL(url)
    }
    setAudioUrl(null)
  }, [audioFile, remoteAudioUrl])

  const draw = useCallback((prog) => {
    const canvas = canvasRef.current
    if (!canvas || !waveformData?.length) return
    const ctx = canvas.getContext('2d')
    const W = canvas.width
    const H = canvas.height
    ctx.clearRect(0, 0, W, H)

    const barW = W / waveformData.length
    // Divider: top 48% = sentiment, bottom 48%, 4% gap in middle
    const topH = H * 0.48
    const botH = H * 0.48
    const gap  = H * 0.04

    waveformData.forEach((val, i) => {
      const x = i * barW
      const ratio = i / waveformData.length
      const t = ratio * totalDuration
      const played = ratio <= prog

      // --- Sentiment color (top half, grows upward from center) ---
      const insight = segmentInsights?.find(s => t >= s.start_sec && t < s.end_sec)
      const audioSeg = getSegmentAtTime(audioSegments, t)

      // Resolve sentiment: prefer GPT label, fall back to audio signals
      let sentKey = insight?.sentiment_label || 'neutral'
      if (sentKey === 'neutral') {
        // Escalate based on available signals
        if (insight?.negativity_spike) sentKey = 'negative'
        else if (insight?.tone_shift && audioSeg?.tone_label === 'disengaged') sentKey = 'negative'
        else if (['angry', 'frustrated', 'sad', 'disengaged'].includes(audioSeg?.tone_label)) sentKey = 'negative'
        else if (['excited'].includes(audioSeg?.tone_label)) sentKey = 'positive'
      }
      if (!SENTIMENT_COLORS[sentKey]) sentKey = 'neutral'
      const sentColor = played ? SENTIMENT_COLORS[sentKey] : SENTIMENT_DIM[sentKey]
      const sentBarH = Math.max(2, val * topH * 0.95)

      ctx.fillStyle = sentColor
      ctx.beginPath()
      ctx.roundRect(x + 0.5, topH - sentBarH, Math.max(1, barW - 1), sentBarH, [2, 2, 0, 0])
      ctx.fill()

      // --- Speaker color (bottom half, grows downward from center) ---
      const spIdx = audioSeg != null ? (speakerMap[audioSeg.segment_index] ?? 0) : 0
      const spColor = played
        ? speakerColor(spIdx)
        : speakerColorDim(spIdx)
      const spBarH = Math.max(2, val * botH * 0.95)
      const botTop = topH + gap

      ctx.fillStyle = spColor
      ctx.beginPath()
      ctx.roundRect(x + 0.5, botTop, Math.max(1, barW - 1), spBarH, [0, 0, 2, 2])
      ctx.fill()
    })

    // Thin divider line
    ctx.fillStyle = 'rgba(255,255,255,0.08)'
    ctx.fillRect(0, topH, W, gap)

    // Playhead
    if (prog > 0) {
      const cx = prog * W
      ctx.fillStyle = 'rgba(255,255,255,0.85)'
      ctx.fillRect(cx - 1, 0, 2, H)
    }
  }, [waveformData, segmentInsights, speakerMap, audioSegments, totalDuration])

  useEffect(() => { draw(progress) }, [draw, progress])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const onTime = () => {
      const p = audio.duration ? audio.currentTime / audio.duration : 0
      setProgress(p)
      setCurrentTime(audio.currentTime)
    }
    const onEnd = () => { setPlaying(false); setProgress(0); setCurrentTime(0) }
    audio.addEventListener('timeupdate', onTime)
    audio.addEventListener('ended', onEnd)
    return () => { audio.removeEventListener('timeupdate', onTime); audio.removeEventListener('ended', onEnd) }
  }, [audioUrl])

  const togglePlay = () => {
    const audio = audioRef.current
    if (!audio) return
    if (playing) { audio.pause(); setPlaying(false) }
    else { audio.play(); setPlaying(true) }
  }

  const seek = (e) => {
    const canvas = canvasRef.current
    const audio = audioRef.current
    if (!canvas || !audio) return
    const rect = canvas.getBoundingClientRect()
    const ratio = (e.clientX - rect.left) / rect.width
    audio.currentTime = ratio * (audio.duration || 0)
    setProgress(ratio)
  }

  const fmt = (s) => {
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  const canSaveLocal = !!audioFile
  const canSaveRemote = !!downloadUrl
  const showDownload = canSaveLocal || canSaveRemote

  const handleDownload = async () => {
    if (canSaveLocal) {
      const url = URL.createObjectURL(audioFile)
      const a = document.createElement('a')
      a.href = url
      a.download = downloadFilename || audioFile.name || 'audio'
      a.click()
      URL.revokeObjectURL(url)
      return
    }
    if (!downloadUrl) return
    setDownloading(true)
    try {
      const token = localStorage.getItem('token') || ''
      const res = await fetch(downloadUrl, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) throw new Error('Download failed')
      const blob = await res.blob()
      const disp = res.headers.get('Content-Disposition')
      let fname = downloadFilename || 'audio'
      const m = disp && /filename="([^"]+)"/.exec(disp)
      if (m?.[1]) fname = m[1]
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fname
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      /* keep UI quiet; network layer may log */
    } finally {
      setDownloading(false)
    }
  }

  const distinctSpeakers = useMemo(() => {
    const ids = new Set(Object.values(speakerMap))
    return Array.from(ids).sort()
  }, [speakerMap])

  const speakerLabels = distinctSpeakers.map(id => ({
    label: `Speaker ${id + 1}`,
    color: speakerColor(id),
  }))

  return (
    <div className="space-y-3">
      <canvas
        ref={canvasRef}
        width={800}
        height={90}
        onClick={seek}
        className="w-full rounded-lg cursor-pointer"
        style={{ background: 'rgba(255,255,255,0.04)' }}
      />

      <div className="flex items-center gap-4 flex-wrap">
        <button onClick={togglePlay} disabled={!audioUrl}
          className="flex items-center justify-center w-9 h-9 rounded-full bg-blue-500 hover:bg-blue-400 disabled:opacity-40 transition-colors shrink-0"
        >
          {playing ? <Pause className="w-4 h-4 text-white" /> : <Play className="w-4 h-4 text-white ml-0.5" />}
        </button>

        <span className="text-xs font-mono text-gray-400 w-20 shrink-0">
          {fmt(currentTime)} / {fmt(totalDuration || 0)}
        </span>

        {showDownload && (
          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading || (!canSaveLocal && !canSaveRemote)}
            className="flex items-center justify-center w-9 h-9 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 disabled:opacity-40 transition-colors shrink-0"
            title={canSaveRemote ? 'Download original audio' : 'Save audio file'}
            aria-label="Download audio"
          >
            <Download className="w-4 h-4 text-slate-200" />
          </button>
        )}

        {/* Sentiment legend */}
        <div className="flex items-center gap-2 ml-auto flex-wrap">
          <span className="text-xs text-gray-600 mr-1">Sentiment:</span>
          {Object.entries(SENTIMENT_COLORS).map(([label, color]) => (
            <span key={label} className="flex items-center gap-1 text-xs text-gray-400 capitalize">
              <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: color }} />
              {label}
            </span>
          ))}
          <span className="w-px h-3 bg-white/20 mx-1" />
          <span className="text-xs text-gray-600 mr-1">Speaker:</span>
          {speakerLabels.map(({ label, color }) => (
            <span key={label} className="flex items-center gap-1 text-xs text-gray-400">
              <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: color }} />
              {label}
            </span>
          ))}
        </div>
      </div>

      {!audioUrl && (
        <p className="text-xs text-gray-600 text-center">Audio file not available for playback — waveform shown from analysis data</p>
      )}

      {audioUrl && <audio ref={audioRef} src={audioUrl} preload="metadata" className="hidden" />}
    </div>
  )
}

export default WaveformPlayer
