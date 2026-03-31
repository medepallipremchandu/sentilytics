import React from 'react'
import { AlertCircle, Clock3 } from 'lucide-react'
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

export default function DashboardPanel({ dashboard, permissions = [] }) {
  if (!dashboard) return null
  const canViewCost = permissions.includes('ai.cost.view') || permissions.includes('system.superadmin')
  const statusData = [
    { name: 'Completed', value: dashboard.completed || 0, color: '#34d399' },
    { name: 'In Progress', value: dashboard.inprogress || 0, color: '#f59e0b' },
    { name: 'Soon', value: dashboard.soon || 0, color: '#38bdf8' },
  ]
  const sourceData = [
    { name: 'Text', value: dashboard.text_feedback || 0 },
    { name: 'Audio', value: dashboard.audio_feedback || 0 },
  ]
  const costData = canViewCost
    ? [
        { name: 'Whisper', value: Number(dashboard.whisper_cost_usd || 0) },
        { name: 'GPT', value: Number(dashboard.gpt_cost_usd || 0) },
      ]
    : []
  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-5 gap-4">
        <KpiCard title="Total" value={dashboard.total_feedback} />
        <KpiCard title="Completed" value={dashboard.completed} color="emerald" />
        <KpiCard title="In Progress" value={dashboard.inprogress} color="amber" />
        <KpiCard title="Need Quick Resolve" value={dashboard.high_priority} color="red" icon={<AlertCircle className="w-5 h-5" />} />
        <KpiCard title="Resolve Rate" value={`${dashboard.resolve_rate}%`} color="blue" icon={<Clock3 className="w-5 h-5" />} />
        <KpiCard title="Text Feedback" value={dashboard.text_feedback ?? 0} />
        <KpiCard title="Audio Feedback" value={dashboard.audio_feedback ?? 0} />
        {typeof dashboard.total_ai_cost_usd !== 'undefined' && (
          <>
            <KpiCard title="Whisper Cost (USD)" value={`$${Number(dashboard.whisper_cost_usd || 0).toFixed(4)}`} color="amber" />
            <KpiCard title="GPT Cost (USD)" value={`$${Number(dashboard.gpt_cost_usd || 0).toFixed(4)}`} color="blue" />
            <KpiCard title="Total AI Cost (USD)" value={`$${Number(dashboard.total_ai_cost_usd || 0).toFixed(4)}`} color="red" />
          </>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard title="Status Distribution">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={statusData} dataKey="value" nameKey="name" outerRadius={75}>
                {statusData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Submission Type">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={sourceData}>
              <XAxis dataKey="name" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip />
              <Bar dataKey="value" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        {canViewCost && (
          <ChartCard title="AI Cost Split">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={costData} dataKey="value" nameKey="name" outerRadius={75}>
                  <Cell fill="#f59e0b" />
                  <Cell fill="#3b82f6" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        )}
      </div>
    </div>
  )
}

function ChartCard({ title, children }) {
  return (
    <div className="glass-effect rounded-2xl p-4 border border-white/10">
      <p className="text-sm text-slate-300 mb-3">{title}</p>
      {children}
    </div>
  )
}

function KpiCard({ title, value, color = 'violet', icon = null }) {
  const colorMap = {
    violet: 'from-violet-600/40 to-violet-950',
    emerald: 'from-emerald-600/40 to-emerald-950',
    amber: 'from-amber-600/40 to-amber-950',
    red: 'from-red-600/40 to-red-950',
    blue: 'from-blue-600/40 to-blue-950',
  }
  return (
    <div className={`rounded-2xl p-5 bg-gradient-to-br ${colorMap[color]} border border-white/10`}>
      <div className="flex items-center justify-between text-slate-300 text-sm">
        <span>{title}</span>
        {icon}
      </div>
      <p className="text-2xl font-bold mt-2">{value}</p>
    </div>
  )
}
