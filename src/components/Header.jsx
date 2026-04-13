import React from 'react'
import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { ThemeSwitcher } from './ThemeSwitcher'
import { APP_LOGO, APP_NAME, APP_SUBTITLE } from '../lib/branding'

const Header = () => {
  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      className="py-6 px-4"
    >
      <div className="container mx-auto">
        <div className="flex items-center justify-between">
          <motion.div
            className="flex items-center gap-3"
            whileHover={{ scale: 1.05 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <div className="relative">
              <motion.div
                animate={{ rotate: [0, 360], scale: [1, 1.2, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500 blur-lg opacity-50"
              />
              <img src={APP_LOGO} alt={`${APP_NAME} logo`} className="relative h-14 w-14 rounded-xl border border-white/10 bg-slate-900/50 p-2" />
            </div>
            <div>
              <h1 className="text-3xl font-bold gradient-text flex items-center gap-2">
                {APP_NAME}
                <Sparkles className="w-6 h-6 text-yellow-400 animate-pulse" />
              </h1>
              <p className="text-sm text-gray-300">{APP_SUBTITLE}</p>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }} className="flex items-center gap-3"
          >
            <div className="hidden md:block glass-effect px-4 py-2 rounded-lg">
              <p className="text-sm text-gray-300">Powered by</p>
              <p className="text-xs font-semibold gradient-text">Azure OpenAI & GPT-4</p>
            </div>
            <ThemeSwitcher />
          </motion.div>
        </div>
      </div>
    </motion.header>
  )
}

export default Header
