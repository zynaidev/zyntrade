import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Globe, Clock, MapPin } from 'lucide-react'

const CLOCKS = [
  { city: 'Frankfurt', zone: 'Europe/Berlin', country: 'Németország' },
  { city: 'London', zone: 'Europe/London', country: 'Egyesült Királyság' },
  { city: 'New York', zone: 'America/New_York', country: 'Egyesült Államok' },
  { city: 'Tokyo', zone: 'Asia/Tokyo', country: 'Japán' },
]

const PSYCHOLOGY_QUOTES = [
  { text: "A piacok sosem tévednek, a vélemények viszont gyakran.", author: "Jesse Livermore" },
  { text: "A jó kereskedés unalmas. Ha izgalmat keresel, menj a kaszinóba.", author: "Paul Tudor Jones" },
  { text: "Nem az a lényeg, hogy igazad van-e vagy sem, hanem hogy mennyi pénzt csinálsz, amikor igazad van, és mennyit veszítesz, amikor tévedsz.", author: "George Soros" },
  { text: "A konzisztens eredmények eléréséhez konzisztens gondolkodásmódra van szükség.", author: "Mark Douglas" },
  { text: "A legfontosabb szabály a kereskedésben: a tőke megóvása. A második legfontosabb: sose felejtsd el az elsőt.", author: "Paul Tudor Jones" },
]

function ClockCard({ city, zone, country, delay }) {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const dateFormatter = new Intl.DateTimeFormat('hu-HU', {
    timeZone: zone,
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  })

  const timeFormatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: zone,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className="glass-card-strong p-8 rounded-[32px] border border-white/5 relative overflow-hidden group hover:border-purple-500/30 transition-all duration-500"
    >
      {/* Decorative gradient */}
      <div className="absolute -top-12 -right-12 w-24 h-24 bg-purple-500/10 blur-3xl rounded-full group-hover:bg-purple-500/20 transition-all" />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-purple-400">
              <MapPin size={20} />
            </div>
            <div>
              <h3 className="font-black text-xl text-white tracking-tight">{city}</h3>
              <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">{country}</p>
            </div>
          </div>
          <Globe size={20} className="text-white/10 group-hover:text-purple-500/40 transition-colors" />
        </div>

        <div className="space-y-1">
          <div className="text-5xl font-black text-white tracking-tighter tabular-nums drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
            {timeFormatter.format(time)}
          </div>
          <div className="text-xs text-white/40 font-medium pt-2">
            {dateFormatter.format(time)}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default function WorldClocks() {
  const [quoteIndex, setQuoteIndex] = useState(0)

  useEffect(() => {
    // Select a random quote on mount
    setQuoteIndex(Math.floor(Math.random() * PSYCHOLOGY_QUOTES.length))
  }, [])

  return (
    <main className="w-full max-w-7xl mx-auto px-6 lg:px-10 py-12 space-y-12">
      {/* Header */}
      <motion.div
         initial={{ opacity: 0, y: -10 }}
         animate={{ opacity: 1, y: 0 }}
         className="space-y-2"
      >
        <h1 className="text-5xl font-black text-white tracking-tight">
          Világ<span style={{ color: '#a855f7' }}>órák</span>
        </h1>
        <p className="text-white/40 text-sm font-medium italic tracking-wide">
          Valós idejű piaci időzónák és globális kereskedési órák
        </p>
      </motion.div>

      {/* Daily Psychology Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card-strong p-8 rounded-[32px] border border-white/5 relative overflow-hidden"
      >
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-pink-500/20 blur-[80px] rounded-full pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/20 blur-[80px] rounded-full pointer-events-none" />
        
        <div className="relative z-10 flex flex-col items-center text-center max-w-4xl mx-auto">
          <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-pink-400 mb-6 border border-white/10">
            <span className="text-2xl font-serif">"</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-white leading-tight tracking-tight mb-6">
            {PSYCHOLOGY_QUOTES[quoteIndex].text}
          </h2>
          <div className="flex items-center gap-3 text-pink-400">
            <div className="w-8 h-px bg-pink-500/30" />
            <span className="text-xs font-bold uppercase tracking-[0.2em]">
              {PSYCHOLOGY_QUOTES[quoteIndex].author}
            </span>
            <div className="w-8 h-px bg-pink-500/30" />
          </div>
          <div className="mt-8 text-[10px] font-black text-white/20 uppercase tracking-widest">
            Napi Pszichológia
          </div>
        </div>
      </motion.div>

      {/* Clocks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {CLOCKS.map((clock, idx) => (
          <ClockCard 
            key={clock.city} 
            {...clock} 
            delay={idx * 0.1} 
          />
        ))}
      </div>

      {/* Info Footer */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="glass-card p-6 rounded-2xl border border-white/5 flex items-center gap-4 bg-white/[0.01]"
      >
        <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
           <Clock size={20} />
        </div>
        <p className="text-xs text-white/40 leading-relaxed font-medium">
          Az órák automatikusan szinkronizálnak a helyi időzónákkal, figyelembe véve a téli és nyári időszámítást (DST). 
          A pontos idő elengedhetetlen a piaci nyitások és zárások követéséhez.
        </p>
      </motion.div>
    </main>
  )
}
