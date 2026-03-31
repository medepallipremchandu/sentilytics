import React, { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useDropzone } from 'react-dropzone'
import { Upload, FileAudio, Play, AlertCircle, X, Type, Mic } from 'lucide-react'

const InputSection = ({ onAnalyzeAudio, onAnalyzeText, error }) => {
  const [mode, setMode] = useState('audio')
  const [file, setFile] = useState(null)
  const [text, setText] = useState('')

  const onDrop = useCallback((accepted) => {
    if (accepted.length > 0) setFile(accepted[0])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'audio/*': ['.wav', '.mp3', '.m4a', '.aac', '.ogg', '.flac', '.webm'] },
    maxFiles: 1,
  })

  const canSubmit = mode === 'audio' ? !!file : text.trim().length > 10

  const handleSubmit = () => {
    if (mode === 'audio' && file) onAnalyzeAudio(file)
    if (mode === 'text' && text.trim()) onAnalyzeText(text.trim())
  }

  return (
    <div className="max-w-3xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h2 className="text-4xl md:text-5xl font-bold mb-3 gradient-text">
          Voice Intelligence Analysis
        </h2>
        <p className="text-gray-400 text-lg">
          Analyze any conversation — group discussions, feedback, sales calls, interviews
        </p>
      </motion.div>

      {/* Mode Toggle */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
        className="glass-effect rounded-xl p-1.5 flex mb-6"
      >
        {[
          { id: 'audio', label: 'Upload Audio', icon: Mic },
          { id: 'text', label: 'Paste Text', icon: Type },
        ].map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setMode(id)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-semibold transition-all duration-200
              ${mode === id
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-white'
              }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </motion.div>

      <AnimatePresence mode="wait">
        {mode === 'audio' ? (
          <motion.div key="audio"
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.25 }}
            className="glass-effect rounded-2xl p-6 mb-4"
          >
            <div {...getRootProps()}
              className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-300
                ${isDragActive ? 'border-purple-400 bg-purple-500/20 scale-105' : 'border-gray-600 hover:border-purple-400 hover:bg-purple-500/10'}
              `}
            >
              <input {...getInputProps()} />
              {!file ? (
                <>
                  <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 2, repeat: Infinity }} className="mb-3">
                    <Upload className="w-14 h-14 mx-auto text-purple-400" />
                  </motion.div>
                  <p className="text-lg font-semibold mb-1">
                    {isDragActive ? 'Drop it here' : 'Drop audio or click to browse'}
                  </p>
                  <p className="text-sm text-gray-500">WAV · MP3 · M4A · OGG · FLAC · WEBM</p>
                </>
              ) : (
                <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}
                  className="flex items-center justify-center gap-4"
                >
                  <FileAudio className="w-10 h-10 text-green-400 flex-shrink-0" />
                  <div className="text-left">
                    <p className="font-semibold">{file.name}</p>
                    <p className="text-sm text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); setFile(null) }}
                    className="ml-2 p-2 hover:bg-red-500/20 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5 text-red-400" />
                  </button>
                </motion.div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div key="text"
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}
            className="glass-effect rounded-2xl p-6 mb-4"
          >
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste conversation transcript here...&#10;&#10;Example:&#10;Speaker 1: I think this project is going nowhere.&#10;Speaker 2: I agree, nobody is taking responsibility.&#10;Speaker 3: That's not fair, we've made real progress."
              rows={10}
              className="w-full bg-black/30 border border-white/10 rounded-xl p-4 text-white placeholder-gray-600 resize-none focus:outline-none focus:border-purple-500/60 transition-colors text-sm leading-relaxed"
            />
            <div className="flex justify-between mt-2 text-xs text-gray-500">
              <span>{text.length} characters</span>
              <span>{text.trim() ? text.trim().split(/\s+/).length : 0} words</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-4 bg-red-500/20 border border-red-500/40 rounded-xl flex items-center gap-3"
        >
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <p className="text-red-300 text-sm">{error}</p>
        </motion.div>
      )}

      <motion.button
        whileHover={canSubmit ? { scale: 1.02 } : {}}
        whileTap={canSubmit ? { scale: 0.98 } : {}}
        onClick={handleSubmit}
        disabled={!canSubmit}
        className={`w-full py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-3 transition-all duration-300
          ${canSubmit
            ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg glow-effect cursor-pointer'
            : 'bg-gray-700/50 text-gray-500 cursor-not-allowed'
          }`}
      >
        <Play className="w-5 h-5" />
        {mode === 'audio' ? 'Analyze Audio' : 'Analyze Text'}
      </motion.button>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
        className="grid grid-cols-3 gap-3 mt-6"
      >
        {[
          { icon: '🎭', title: 'Emotion & Tone', desc: 'Detect emotional state per speaker' },
          { icon: '⚠️', title: 'Negativity Detection', desc: 'Flag hostile or toxic content' },
          { icon: '🔍', title: 'Sarcasm & Conflict', desc: 'Cross-modal signal reasoning' },
        ].map((f, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 + i * 0.08 }}
            className="glass-effect rounded-xl p-4 text-center"
          >
            <div className="text-2xl mb-1">{f.icon}</div>
            <p className="font-semibold text-sm mb-0.5">{f.title}</p>
            <p className="text-xs text-gray-500">{f.desc}</p>
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}

export default InputSection
