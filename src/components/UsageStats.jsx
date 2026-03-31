import React from 'react'
import { motion } from 'framer-motion'
import { DollarSign, Zap, Clock, Activity } from 'lucide-react'

const UsageStats = ({ usage, hasAudio }) => {
  if (!usage) return null

  const rows = [
    hasAudio && { label: 'Whisper Duration', value: `${usage.whisper_duration_minutes} min`, sub: `$${usage.whisper_cost_usd?.toFixed(4)}`, icon: Clock, color: 'border-blue-500/30 from-blue-500/10 to-cyan-500/10' },
    { label: 'GPT Tokens', value: (usage.gpt_total_tokens || 0).toLocaleString(), sub: `↓${usage.gpt_prompt_tokens} ↑${usage.gpt_completion_tokens}`, icon: Zap, color: 'border-purple-500/30 from-purple-500/10 to-pink-500/10' },
    { label: 'GPT Cost', value: `$${usage.gpt_cost_usd?.toFixed(4)}`, sub: 'USD', icon: DollarSign, color: 'border-yellow-500/30 from-yellow-500/10 to-orange-500/10' },
    { label: 'Total Cost', value: `$${usage.total_cost_usd?.toFixed(4)}`, sub: 'USD', icon: Activity, color: 'border-green-500/30 from-green-500/10 to-emerald-500/10', highlight: true },
  ].filter(Boolean)

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className="glass-effect rounded-xl p-5"
    >
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-5 h-5 text-green-400" />
        <h3 className="font-bold">API Usage & Cost</h3>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {rows.map(({ label, value, sub, icon: Icon, color, highlight }, i) => (
          <motion.div key={i} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.07 }}
            className={`bg-gradient-to-br ${color} border rounded-xl p-4`}
          >
            <div className="flex items-center gap-1.5 mb-2">
              <Icon className="w-4 h-4 text-gray-400" />
              <p className="text-xs text-gray-400">{label}</p>
            </div>
            <p className={`text-xl font-bold ${highlight ? 'text-green-400' : 'text-white'}`}>{value}</p>
            {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}

export default UsageStats
