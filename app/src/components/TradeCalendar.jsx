import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useTradeStore from '@/store/useTrades'
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown } from 'lucide-react'

const DAYS = ['Hét', 'Ked', 'Sze', 'Csü', 'Pén', 'Szo', 'Vas']
const MONTHS = [
  'Január', 'Február', 'Március', 'Április', 'Május', 'Június',
  'Július', 'Augusztus', 'Szeptember', 'Október', 'November', 'December',
]

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year, month) {
  // Monday-based: 0=Mon … 6=Sun
  const day = new Date(year, month, 1).getDay()
  return day === 0 ? 6 : day - 1
}

function calcPnL(trade) {
  const diff = trade.closePrice - trade.entryPrice
  const pnl = trade.direction === 'long' ? diff : -diff
  return pnl
}

export default function TradeCalendar({ onDaySelect, selectedDate }) {
  const trades = useTradeStore((s) => s.trades)
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]

  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())

  const daysInMonth = getDaysInMonth(viewYear, viewMonth)
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth)

  // Group trades by date for indicators
  const tradesByDate = trades.reduce((acc, t) => {
    if (!acc[t.date]) acc[t.date] = []
    acc[t.date].push(t)
    return acc
  }, {})

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1) }
    else setViewMonth(viewMonth - 1)
  }
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1) }
    else setViewMonth(viewMonth + 1)
  }

  const handleDayClick = (day) => {
    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    onDaySelect(dateStr)
  }

  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  return (
    <div
      className="glass-card-strong p-6"
      style={{ border: '1px solid rgba(168,85,247,0.2)' }}
    >
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6">
        <button
          id="cal-prev"
          onClick={prevMonth}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:bg-white/10 active:scale-95"
          style={{ border: '1px solid rgba(255,255,255,0.1)' }}
        >
          <ChevronLeft size={17} className="text-white/60" />
        </button>

        <div className="text-center select-none">
          <div className="font-bold text-white text-lg leading-tight">{MONTHS[viewMonth]}</div>
          <div className="text-xs text-white/40 font-medium mt-0.5 tracking-widest">{viewYear}</div>
        </div>

        <button
          id="cal-next"
          onClick={nextMonth}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:bg-white/10 active:scale-95"
          style={{ border: '1px solid rgba(255,255,255,0.1)' }}
        >
          <ChevronRight size={17} className="text-white/60" />
        </button>
      </div>

      {/* ── Day-of-week headers ── */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS.map((d) => (
          <div
            key={d}
            className="text-center text-xs font-semibold py-2 select-none"
            style={{ color: d === 'Sat' || d === 'Sun' ? 'rgba(168,85,247,0.5)' : 'rgba(255,255,255,0.28)' }}
          >
            {d}
          </div>
        ))}
      </div>

      {/* ── Day cells ── */}
      <div className="grid grid-cols-7 gap-1.5">
        {cells.map((day, idx) => {
          if (!day) return <div key={`empty-${idx}`} />

          const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const dayTrades = tradesByDate[dateStr] || []
          const hasTrades = dayTrades.length > 0
          const isToday = dateStr === todayStr
          const isSelected = dateStr === selectedDate
          const isFuture = dateStr > todayStr

          // Net PnL for the day — determines win/loss colouring
          const netPnl = hasTrades
            ? dayTrades.reduce((sum, t) => sum + calcPnL(t), 0)
            : 0
          const isWinDay = hasTrades && netPnl >= 0
          const isLossDay = hasTrades && netPnl < 0

          return (
            <motion.button
              key={dateStr}
              id={`cal-day-${dateStr}`}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.93 }}
              onClick={() => handleDayClick(day)}
              className="relative flex flex-col items-center justify-center rounded-xl font-medium transition-all duration-150 select-none cursor-pointer hover:border-white/50 hover:bg-white/5"
              style={{
                aspectRatio: '1 / 1',
                cursor: 'pointer',
                background: isSelected
                  ? 'linear-gradient(135deg, rgba(168,85,247,0.8), rgba(59,130,246,0.8))'
                  : isToday
                  ? 'rgba(168,85,247,0.15)'
                  : isWinDay
                  ? 'rgba(34,197,94,0.1)'
                  : isLossDay
                  ? 'rgba(239,68,68,0.1)'
                  : 'transparent',
                border: isSelected
                  ? '2px solid rgba(255,255,255,0.9)'
                  : isToday
                  ? '1px solid rgba(168,85,247,0.45)'
                  : isWinDay
                  ? '1px solid rgba(34,197,94,0.3)'
                  : isLossDay
                  ? '1px solid rgba(239,68,68,0.3)'
                  : '1px solid transparent',
                color: isSelected
                  ? '#fff'
                  : isToday
                  ? '#a855f7'
                  : '#e2e8f0',
                boxShadow: isSelected ? '0 0 20px rgba(255,255,255,0.4), inset 0 0 10px rgba(255,255,255,0.2)' : 'none',
              }}
            >
              <span className="text-sm leading-none">{day}</span>

              {/* Trade indicator dots */}
              {hasTrades && (
                <span
                  className="absolute bottom-1.5 flex gap-0.5"
                >
                  {dayTrades.slice(0, 3).map((_, i) => (
                    <span
                      key={i}
                      className="w-1 h-1 rounded-full"
                      style={{
                        background: isSelected
                          ? '#fff'
                          : isWinDay
                          ? '#22c55e'
                          : '#ef4444',
                        boxShadow: isSelected
                          ? 'none'
                          : isWinDay
                          ? '0 0 4px rgba(34,197,94,0.7)'
                          : '0 0 4px rgba(239,68,68,0.7)',
                      }}
                    />
                  ))}
                </span>
              )}
            </motion.button>
          )
        })}
      </div>

      {/* ── Legend ── */}
      <div className="flex items-center justify-center gap-5 mt-5 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        {[
          { icon: <TrendingUp size={11} />, label: 'Nyerő nap', color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
          { icon: <TrendingDown size={11} />, label: 'Vesztes nap', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
          { icon: <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: 'rgba(168,85,247,0.35)', border: '1px solid rgba(168,85,247,0.6)' }} />, label: 'Ma', color: '#a855f7', bg: 'transparent' },
        ].map(({ icon, label, color, bg }) => (
          <div key={label} className="flex items-center gap-1.5">
            <span style={{ color, background: bg, borderRadius: '5px', padding: '2px 4px', display: 'flex', alignItems: 'center' }}>{icon}</span>
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
