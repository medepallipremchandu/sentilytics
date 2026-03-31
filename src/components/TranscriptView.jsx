import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { FileText, Copy, Check, Download, Search } from 'lucide-react'

const TranscriptView = ({ transcript }) => {
  const [copied, setCopied] = useState(false)
  const [search, setSearch] = useState('')

  const handleCopy = () => {
    navigator.clipboard.writeText(transcript)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([transcript], { type: 'text/plain' }))
    a.download = `transcript-${Date.now()}.txt`
    a.click()
  }

  const highlight = (text) => {
    if (!search.trim()) return text
    const parts = text.split(new RegExp(`(${search})`, 'gi'))
    return parts.map((p, i) =>
      p.toLowerCase() === search.toLowerCase()
        ? <mark key={i} className="bg-yellow-400/30 text-yellow-200 rounded px-0.5">{p}</mark>
        : p
    )
  }

  const lines = transcript?.split('\n').filter(l => l.trim()) || []

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className="glass-effect rounded-xl p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-400" />
          <h3 className="font-bold">Transcript</h3>
          <span className="text-xs text-gray-500">{lines.length} lines · {transcript?.split(' ').length || 0} words</span>
        </div>
        <div className="flex gap-2">
          <button onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors"
          >
            {copied ? <><Check className="w-3.5 h-3.5 text-green-400" /><span className="text-green-400">Copied</span></> : <><Copy className="w-3.5 h-3.5" />Copy</>}
          </button>
          <button onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors"
          >
            <Download className="w-3.5 h-3.5" />Save
          </button>
        </div>
      </div>

      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search transcript..."
          className="w-full pl-9 pr-4 py-2.5 bg-black/30 border border-white/10 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/50 transition-colors"
        />
      </div>

      <div className="bg-black/30 rounded-xl p-5 max-h-[500px] overflow-y-auto space-y-3">
        {lines.length > 0 ? lines.map((line, i) => {
          const hasSpeaker = line.includes(':')
          const [speaker, ...rest] = line.split(':')
          const text = rest.join(':')
          return (
            <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ delay: Math.min(i * 0.015, 0.3) }}
            >
              {hasSpeaker ? (
                <div className="flex gap-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5
                    ${i % 2 === 0 ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'}
                  `}>
                    {speaker.trim().charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">{speaker.trim()}</p>
                    <p className="text-gray-200 text-sm leading-relaxed">{highlight(text.trim())}</p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-300 text-sm leading-relaxed pl-10">{highlight(line)}</p>
              )}
            </motion.div>
          )
        }) : (
          <p className="text-center text-gray-500 py-8">No transcript available</p>
        )}
      </div>
    </motion.div>
  )
}

export default TranscriptView
