import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LayoutDashboard, CheckSquare, Globe, Flame, ZapOff, Coffee, ArrowRight, User } from 'lucide-react'
import { useState, useEffect } from 'react'

// ─── Constants Interface ─────────────────────────────────────────────────────

const TRADING_PHASES = [
  { start: '09:00', end: '09:15', name: 'Nyitási Káosz', type: 'chaos', note: 'Kéz a zsebben' },
  { start: '09:15', end: '11:30', name: 'Arany Ablak (Delelőtt)', type: 'gold', note: '62 EMA visszateszt' },
  { start: '15:30', end: '15:45', name: 'USA Nyitási Káosz', type: 'chaos', note: 'Kéz a zsebben' },
  { start: '15:45', end: '18:00', name: 'Arany Ablak (Délután)', type: 'gold', note: 'Kitörés-visszateszt' },
]

// ─── Helper Functions ────────────────────────────────────────────────────────

const getUTCTime = () => {
  const now = new Date()
  const hour = now.getUTCHours()
  const minute = now.getUTCMinutes()
  const second = now.getUTCSeconds()
  return { hour, minute, second, totalSeconds: hour * 3600 + minute * 60 + second }
}

const timeToSeconds = (timeStr) => {
  const [h, m] = timeStr.split(':').map(Number)
  return h * 3600 + m * 60
}

const formatHMS = (totalSec) => {
  if (totalSec < 0) return '00:00:00'
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  return [h, m, s].map(v => v.toString().padStart(2, '0')).join(':')
}

// ─── Session Tracker Component ───────────────────────────────────────────────

function TradingSessionTracker() {
  const [stats, setStats] = useState({ current: null, next: null, currentT: 0, nextT: 0 })

  useEffect(() => {
    const update = () => {
      const now = getUTCTime()
      const t = now.totalSeconds
      
      let current = null
      let next = null
      let currentT = 0
      let nextT = 0

      // Find current phase
      const activePhase = TRADING_PHASES.find(p => {
        const s = timeToSeconds(p.start)
        const e = timeToSeconds(p.end)
        return t >= s && t < e
      })

      if (activePhase) {
        current = activePhase
        currentT = timeToSeconds(activePhase.end) - t
        const idx = TRADING_PHASES.indexOf(activePhase)
        next = TRADING_PHASES[idx + 1] || TRADING_PHASES[0]
      } else {
        current = { name: 'Pihenő / Várakozás', type: 'rest', note: 'Piacon kívüli időszak' }
        next = TRADING_PHASES.find(p => timeToSeconds(p.start) > t) || TRADING_PHASES[0]
      }

      let nt = timeToSeconds(next.start) - t
      if (nt < 0) nt += 24 * 3600
      nextT = nt

      setStats({ current, next, currentT, nextT })
    }

    update()
    const timer = setInterval(update, 1000)
    return () => clearInterval(timer)
  }, [])

  if (!stats.current) return null

  const getTheme = (type) => {
    switch(type) {
      case 'gold': return { color: '#22c55e', bg: 'rgba(34,197,94,0.1)', icon: Flame, pulse: true }
      case 'chaos': return { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', icon: ZapOff, pulse: true }
      default: return { color: '#64748b', bg: 'rgba(100,116,139,0.1)', icon: Coffee, pulse: false }
    }
  }

  const cTheme = getTheme(stats.current.type)
  const nTheme = getTheme(stats.next.type)

  return (
    <div className="flex flex-col gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/5 backdrop-blur-md">
      {/* Current Session */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: cTheme.bg, color: cTheme.color }}>
            <cTheme.icon size={20} />
          </div>
          {cTheme.pulse && (
            <div className="absolute inset-0 rounded-full animate-ping opacity-20" style={{ background: cTheme.color }} />
          )}
        </div>
        <div className="flex flex-col">
          <div className="text-[11px] font-black uppercase tracking-widest leading-none flex flex-col gap-1">
            <span className="text-white/40">Aktuális</span>
            <span style={{ color: cTheme.color }}>{stats.current.name}</span>
          </div>
          <div className="text-[12px] font-black mt-1 tabular-nums opacity-80 decoration-white/20 underline underline-offset-4">
             {formatHMS(stats.currentT)}
          </div>
        </div>
      </div>

      <div className="w-full h-[1px] bg-white/5" />

      {/* Next Session */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full flex items-center justify-center opacity-40" style={{ background: nTheme.bg, color: nTheme.color }}>
          <nTheme.icon size={16} />
        </div>
        <div className="flex flex-col">
          <div className="text-[10px] font-black uppercase tracking-widest leading-none text-white/40 mb-1">
            Következő
          </div>
          <div className="text-[11px] font-bold text-white/60">
            {stats.next.name}
          </div>
          <div className="text-[10px] font-bold mt-1 tabular-nums" style={{ color: nTheme.color }}>
             Indul: {formatHMS(stats.nextT)}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main Sidebar Component ───────────────────────────────────────────────────

export default function Sidebar() {
  const NAV_LINKS = [
    { to: '/', icon: LayoutDashboard, label: 'Vezérlőpult' },
    { to: '/checklist', icon: CheckSquare, label: 'Stratégia' },
    { to: '/clocks', icon: Globe, label: 'Órák' },
  ]

  return (
    <aside className="w-72 h-full bg-[#0b0e14]/90 backdrop-blur-3xl border-r border-[#ffffff0a] flex flex-col shrink-0">
      {/* Header / Logo */}
      <div className="p-8 pb-6 flex items-center gap-4">
        <img
          src="https://zynai.hu/wp-content/uploads/2025/10/cropped-ZynAI_favicon-1.png"
          alt="ZynTrade Logo"
          className="w-10 h-10 object-contain drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]"
        />
        <span className="font-black text-2xl tracking-tight text-white">
          Zyn<span className="text-[#a855f7]">Trade</span>
        </span>
      </div>

      {/* Trading Session Tracker Plugin */}
      <div className="px-6 pb-6 border-b border-white/5 mb-6 mx-4">
        <TradingSessionTracker />
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 space-y-2">
        {NAV_LINKS.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `flex items-center gap-4 px-6 py-4 rounded-2xl text-sm font-bold transition-all duration-300 group ${
                isActive 
                  ? 'text-white bg-gradient-to-r from-[#a855f7]/20 to-[#3b82f6]/20 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]' 
                  : 'text-white/40 hover:text-white hover:bg-white/[0.02]'
              }`
            }
            style={({ isActive }) =>
              isActive
                ? { border: '1px solid rgba(168,85,247,0.3)' }
                : { border: '1px solid transparent' }
            }
          >
            {({ isActive }) => (
              <>
                <link.icon 
                  size={20} 
                  className={`transition-colors duration-300 ${isActive ? 'text-[#a855f7]' : 'text-white/30 group-hover:text-white/70'}`} 
                />
                <span className="tracking-wide">{link.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
