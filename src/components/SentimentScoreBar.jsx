import React from 'react'
import { GLOSSARY } from '../lib/analysisGlossary'
import InfoTip from './common/InfoTip'

/**
 * Horizontal scale for sentiment_score in [-1, 1] with legend matching product reference.
 */
export default function SentimentScoreBar({ score, label = 'Sentiment score', labelHint }) {
  const hintText = labelHint === undefined ? GLOSSARY.sentimentScore : labelHint
  const n = typeof score === 'number' && Number.isFinite(score) ? Math.max(-1, Math.min(1, score)) : null
  const pct = n == null ? 0 : ((n + 1) / 2) * 100
  let barColor = '#a3a3a3'
  if (n != null) {
    if (n > 0.15) barColor = '#4ade80'
    else if (n < -0.15) barColor = '#f87171'
    else barColor = '#facc15'
  }

  return (
    <div>
      {label ? (
        <p className="text-[10px] font-semibold tracking-wider text-gray-500 uppercase mb-2 flex items-center gap-1">
          {label}
          {hintText ? <InfoTip text={hintText} /> : null}
        </p>
      ) : null}
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="text-3xl font-bold tabular-nums" style={{ color: barColor }}>
          {n == null ? '—' : n.toFixed(2)}
        </span>
        <span className="text-xs text-gray-500">(-1 negative → +1 positive)</span>
      </div>
      <div className="mt-3 h-2.5 w-full max-w-xl rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${pct}%`, backgroundColor: barColor }}
        />
      </div>
    </div>
  )
}
