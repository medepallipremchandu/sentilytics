import React from 'react'
import { motion } from 'framer-motion'
import { Mic2, Sparkles } from 'lucide-react'
import { ThemeSwitcher } from './ThemeSwitcher'

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
                className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-lg opacity-50"
              />
              <div className="relative bg-gradient-to-br from-blue-500 to-purple-600 p-3 rounded-xl">
                <Mic2 className="w-8 h-8 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-bold gradient-text flex items-center gap-2">
                VoxIntent AI
                <Sparkles className="w-6 h-6 text-yellow-400 animate-pulse" />
              </h1>
              <p className="text-sm text-gray-300">Audio Analysis Platform</p>
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
