import { useState, useMemo, useEffect } from 'react'
import { motion } from 'framer-motion'
import { BarChart3, TrendingUp, DollarSign, Activity, Terminal } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import TradeForm from '../components/TradeForm'
import TradeCalendar from '../components/TradeCalendar'
import DayTradeCard from '../components/DayTradeCard'
import useTradeStore from '../store/useTrades'
import { getTrades } from '@/lib/api'

export default function Dashboard() {
  const [selectedDate, setSelectedDate] = useState(null)
  const [editingTrade, setEditingTrade] = useState(null)
  const trades = useTradeStore((s) => s.trades)
  const setTrades = useTradeStore((s) => s.setTrades)
  const setLoading = useTradeStore((s) => s.setLoading)

  useEffect(() => {
    async function loadTrades() {
      setLoading(true)
      try {
        const data = await getTrades()
        if (data && data.length > 0) {
          setTrades(data)
        }
      } catch (err) {
        console.error('Hiba a kötések betöltésekor:', err)
      } finally {
        setLoading(false)
      }
    }
    loadTrades()
  }, [setTrades, setLoading])

  const tradesForDay = selectedDate
    ? trades.filter((t) => t.date === selectedDate)
    : []

  const stats = useMemo(() => {
    if (!trades.length) return { count: 0, netPnl: 0, winRate: 0, profitFactor: '0.00', streak: 0 }

    let totalPnl = 0
    let grossProfit = 0
    let grossLoss = 0
    let wins = 0
    const dailyPnls = {}

    trades.forEach((t) => {
      const diff = t.closePrice - t.entryPrice
      const pnl = t.direction === 'long' ? diff : -diff
      
      totalPnl += pnl
      
      if (pnl > 0) {
        wins++
        grossProfit += pnl
      } else {
        grossLoss += Math.abs(pnl)
      }

      if (!dailyPnls[t.date]) dailyPnls[t.date] = 0
      dailyPnls[t.date] += pnl
    })

    const pf = grossLoss > 0 ? (grossProfit / grossLoss).toFixed(2) : (grossProfit > 0 ? '∞' : '0.00')

    // Nyerő Széria (napok)
    const sortedDays = Object.keys(dailyPnls).sort((a, b) => new Date(b) - new Date(a))
    let currentStreak = 0
    for (const day of sortedDays) {
      if (dailyPnls[day] > 0) {
        currentStreak++
      } else {
        break
      }
    }

    return {
      count: trades.length,
      winRate: Math.round((wins / trades.length) * 100),
      netPnl: totalPnl,
      profitFactor: pf,
      streak: currentStreak
    }
  }, [trades])

  const chartData = useMemo(() => {
    if (!trades.length) return []
    const sorted = [...trades].sort((a, b) => new Date(a.date) - new Date(b.date))
    let cumulative = 0
    return sorted.map(t => {
      const diff = t.closePrice - t.entryPrice
      const pnl = t.direction === 'long' ? diff : -diff
      cumulative += pnl
      return {
        date: t.date,
        pnl: pnl,
        cumulative: cumulative
      }
    })
  }, [trades])

  const handleEdit = (trade) => {
    setEditingTrade(trade)
    setSelectedDate(trade.date)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleClearEdit = () => {
    setEditingTrade(null)
  }

  return (
    <main className="w-full max-w-7xl mx-auto py-12 px-8 lg:px-10 space-y-16">
      {/* ── SECTION 1: HEADER & STATS ── */}
      <div>
        <section className="space-y-10">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-4"
        >
          <div>
            <h1 className="text-5xl font-black text-white tracking-tight">
              Jó reggelt, <span style={{ color: '#a855f7' }}>Trader!</span>
            </h1>
            <p className="text-white/40 text-sm mt-2 font-medium italic tracking-wide">
              Kereskedési Teljesítmény (Vezérlőpult)
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {[
            { label: 'Nettó PnL', value: `$${stats.netPnl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: DollarSign, color: stats.netPnl >= 0 ? '#22c55e' : '#ef4444', bg: stats.netPnl >= 0 ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)' },
            { label: 'Profit Faktor', value: stats.profitFactor, icon: BarChart3, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
            { label: 'Nyerő Széria', value: `${stats.streak} Nap`, icon: Activity, color: stats.streak > 0 ? '#a855f7' : '#64748b', bg: stats.streak > 0 ? 'rgba(168,85,247,0.1)' : 'rgba(100,116,139,0.1)' },
            { label: 'Nyerési Arány', value: `${stats.winRate}%`, icon: TrendingUp, color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
          ].map((item) => (
            <div
              key={item.label}
              className="glass-card-strong p-8 rounded-[32px] flex flex-col items-start relative overflow-hidden group"
              style={{ border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 duration-300" style={{ background: item.bg, color: item.color }}>
                <item.icon size={28} />
              </div>
              <div className="text-4xl font-black text-white leading-none">{item.value}</div>
              <div className="text-[11px] text-white/30 font-black uppercase tracking-[0.2em] mt-3">{item.label}</div>
            </div>
          ))}
        </motion.div>
        </section>
      </div>

      {/* ── SECTION 1.5: EQUITY CHART ── */}
      <div>
        <section className="pt-4">
          <div className="glass-card-strong p-8 rounded-[32px] border relative overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
             <h3 className="text-xl font-black text-white mb-6 tracking-tight flex items-center gap-2">
               <Activity size={18} className="text-[#a855f7]" /> Tőke Növekedés (Equity Curve)
             </h3>
             <div className="h-[250px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={chartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                   <defs>
                     <linearGradient id="colorCumulative" x1="0" y1="0" x2="0" y2="1">
                       <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3}/>
                       <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                     </linearGradient>
                   </defs>
                   <XAxis dataKey="date" hide />
                   <YAxis hide domain={['auto', 'auto']} />
                   <Tooltip 
                     contentStyle={{ background: '#0f0f1e', border: '1px solid rgba(168,85,247,0.3)', borderRadius: '12px' }}
                     itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                     labelStyle={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                     formatter={(value) => [`$${value.toFixed(2)}`, 'Tőke']}
                   />
                   <Area type="monotone" dataKey="cumulative" stroke="#a855f7" strokeWidth={3} fillOpacity={1} fill="url(#colorCumulative)" />
                 </AreaChart>
               </ResponsiveContainer>
             </div>
          </div>
        </section>
      </div>

      {/* ── SECTION 2: SPACIOUS CONTROL CENTER ── */}
      <div>
        <section className="pt-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="relative"
        >
          <div className="relative mb-8 w-fit px-6 py-2 bg-gradient-to-r from-[#a855f7] to-[#6366f1] rounded-full flex items-center gap-3 z-20 shadow-[0_0_20px_rgba(168,85,247,0.4)]">
             <Terminal size={14} className="text-white" />
             <span className="text-[11px] font-black text-white uppercase tracking-widest">Kereskedés rögzítése</span>
          </div>
          <TradeForm
            activeDate={selectedDate}
            editingTrade={editingTrade}
            onCancelEdit={handleClearEdit}
          />
        </motion.div>
        </section>
      </div>

      {/* ── SECTION 3: CALENDAR & DAILY LOG ── */}
      <div>
        <section className="grid grid-cols-1 xl:grid-cols-[7fr_3fr] gap-8 items-start pb-10">
        {/* Left — Calendar (Wider, ~70%) */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-6 rounded-full bg-blue-500" />
            <h3 className="font-black text-white/80 uppercase tracking-widest text-sm">Kereskedési Naptár</h3>
          </div>
          <TradeCalendar
            selectedDate={selectedDate}
            onDaySelect={(date) => {
              console.log("Calendar Day Clicked. Selected date string:", date);
              setSelectedDate((prev) => {
                console.log("Previous selected date:", prev, "New selected date:", date);
                return prev === date ? null : date;
              })
              setEditingTrade(null)
            }}
          />
        </motion.div>

        {/* Right — Day Detail (Compact Sidebar) */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-6 rounded-full bg-purple-500" />
            <h3 className="font-black text-white/80 uppercase tracking-widest text-sm">Napi Információk</h3>
          </div>
          {selectedDate ? (
            <DayTradeCard
              date={selectedDate}
              trades={tradesForDay}
              onClose={() => setSelectedDate(null)}
              onEdit={handleEdit}
            />
          ) : (
            <div className="glass-card p-10 rounded-3xl border border-white/5 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                 <Activity size={24} className="text-white/10" />
              </div>
              <p className="text-sm text-white/20 font-bold uppercase tracking-widest">Válassz egy napot<br/>a részletekhez</p>
            </div>
          )}
        </motion.div>
        </section>
      </div>
    </main>
  )
}
