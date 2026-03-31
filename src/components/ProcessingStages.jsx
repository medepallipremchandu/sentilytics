import React from 'react'
import { motion } from 'framer-motion'
import { Upload, Waves, Brain, CheckCircle } from 'lucide-react'

const AUDIO_STAGES = [
  { id: 1, label: 'Uploading audio',         icon: Upload },
  { id: 2, label: 'Extracting signal features', icon: Waves },
  { id: 3, label: 'Transcribing & analyzing', icon: Brain },
  { id: 4, label: 'Complete',                icon: CheckCircle },
]

const TEXT_STAGES = [
  { id: 1, label: 'Receiving text',          icon: Upload },
  { id: 3, label: 'Analyzing conversation',  icon: Brain },
  { id: 4, label: 'Complete',                icon: CheckCircle },
]

const ProcessingStages = ({ stage, mode }) => {
  const stages = mode === 'text' ? TEXT_STAGES : AUDIO_STAGES

  return (
    <div className="max-w-xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="text-center mb-10"
      >
        <h2 className="text-3xl font-bold gradient-text mb-2">Analyzing...</h2>
        <p className="text-gray-400">
          {mode === 'text' ? 'Running semantic analysis on your text' : 'Processing audio signal and conversation'}
        </p>
      </motion.div>

      <div className="glass-effect rounded-2xl p-6 space-y-4">
        {stages.map((s, i) => {
          const active   = stage === s.id
          const complete = stage > s.id
          const Icon     = s.icon
          return (
            <motion.div key={s.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className={`flex items-center gap-4 p-4 rounded-xl transition-all duration-400
                ${active   ? 'bg-gradient-to-r from-blue-500/30 to-purple-500/30 border border-purple-500/40' : ''}
                ${complete ? 'bg-green-500/10 border border-green-500/20' : ''}
                ${!active && !complete ? 'bg-white/5' : ''}
              `}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 relative
                ${active   ? 'bg-purple-500/30' : ''}
                ${complete ? 'bg-green-500/20' : ''}
                ${!active && !complete ? 'bg-gray-700/50' : ''}
              `}>
                {active && (
                  <motion.div className="absolute inset-0 rounded-full bg-purple-400/30"
                    animate={{ scale: [1, 1.6, 1], opacity: [0.6, 0, 0.6] }}
                    transition={{ duration: 1.8, repeat: Infinity }}
                  />
                )}
                <Icon className={`w-5 h-5 relative z-10
                  ${active ? 'text-white' : complete ? 'text-green-400' : 'text-gray-600'}
                `} />
              </div>

              <span className={`font-medium flex-1
                ${active || complete ? 'text-white' : 'text-gray-600'}
              `}>
                {s.label}
              </span>

              {active && (
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                  className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full"
                />
              )}
              {complete && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
                  <CheckCircle className="w-5 h-5 text-green-400" />
                </motion.div>
              )}
            </motion.div>
          )
        })}
      </div>

      <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 2, repeat: Infinity }}
        className="text-center mt-6"
      >
        <div className="inline-flex items-center gap-2 glass-effect px-5 py-2.5 rounded-full">
          {[0, 1, 2].map(i => (
            <motion.div key={i} animate={{ y: [0, -6, 0] }}
              transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.15 }}
              className="w-1.5 h-1.5 bg-purple-400 rounded-full"
            />
          ))}
          <span className="text-gray-400 text-sm ml-1">Please wait</span>
        </div>
      </motion.div>
    </div>
  )
}

export default ProcessingStages
