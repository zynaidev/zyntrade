import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TrendingUp, TrendingDown, DollarSign, BarChart2, X, ChevronDown, ImageIcon, Edit3, Trash2, ChevronLeft, ChevronRight, Clock } from 'lucide-react'
import { deleteTrade } from '@/lib/api'
import useTradeStore from '../store/useTrades'

function calcPnL(trade) {
  const diff = trade.closePrice - trade.entryPrice
  const pnl = trade.direction === 'long' ? diff : -diff
  const risk = Math.abs(trade.entryPrice - (trade.stopLoss || trade.entryPrice))
  const rr = risk > 0 ? pnl / risk : 0
  return { pnl, rr }
}

function formatPrice(n) {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n)
}

// ─── Lightbox Component ───────────────────────────────────────────────────────

function Lightbox({ images, initialIndex, onClose }) {
  const [index, setIndex] = useState(initialIndex)

  const next = useCallback((e) => {
    e?.stopPropagation()
    setIndex((prev) => (prev + 1) % images.length)
  }, [images.length])

  const prev = useCallback((e) => {
    e?.stopPropagation()
    setIndex((prev) => (prev - 1 + images.length) % images.length)
  }, [images.length])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') next()
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [next, prev, onClose])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 md:p-10"
      onClick={onClose}
    >
      <button 
        onClick={onClose}
        className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors p-2"
      >
        <X size={32} />
      </button>

      {images.length > 1 && (
        <>
          <button 
            onClick={prev}
            className="absolute left-4 md:left-10 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-all bg-white/5 hover:bg-white/10 p-4 rounded-full"
          >
            <ChevronLeft size={32} />
          </button>
          <button 
            onClick={next}
            className="absolute right-4 md:right-10 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-all bg-white/5 hover:bg-white/10 p-4 rounded-full"
          >
            <ChevronRight size={32} />
          </button>
        </>
      )}

      <motion.div 
        key={index}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative max-w-5xl max-h-full"
        onClick={(e) => e.stopPropagation()}
      >
        <img 
          src={images[index]} 
          alt={`Slide ${index + 1}`} 
          className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
        />
        <div className="absolute -bottom-10 left-0 right-0 text-center text-white/50 text-sm font-medium">
          {index + 1} / {images.length}
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Main DayTradeCard Component ─────────────────────────────────────────────

export default function DayTradeCard({ date, trades, onClose, onEdit }) {
  const [expandedTradeId, setExpandedTradeId] = useState(null)
  const [lightboxData, setLightboxData] = useState(null) // { images: [], index: 0 }
  
  const removeTradeLocal = useTradeStore((s) => s.removeTrade)

  if (!date) return null

  const displayDate = new Date(date + 'T00:00:00').toLocaleDateString('hu-HU', {
    year: 'numeric', month: 'long', day: 'numeric',
  })

  const toggleExpand = (id) => {
    setExpandedTradeId(prev => prev === id ? null : id)
  }

  const handleDelete = async (e, tradeId) => {
    e.stopPropagation()
    if (window.confirm('Biztosan törölni szeretnéd ezt a kötést?')) {
      try {
        await deleteTrade(tradeId)
        removeTradeLocal(tradeId)
      } catch (err) {
        console.error(err)
        alert(err.message || 'Hiba történt a törlés során.')
      }
    }
  }

  const stats = trades.map(calcPnL)
  const dailyPnl = stats.reduce((sum, s) => sum + s.pnl, 0)
  const avgRR = stats.length
    ? stats.reduce((sum, s) => sum + s.rr, 0) / stats.length
    : 0
  const wins = stats.filter((s) => s.pnl > 0).length

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.98 }}
          className="glass-card-strong p-6 mt-4 relative z-10"
          style={{ border: '1px solid rgba(59,130,246,0.3)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-white text-xl tracking-tight">{displayDate}</h3>
              <p className="text-xs text-white/40 mt-1 uppercase tracking-widest font-semibold">
                {trades.length} Kötés rögzítve
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white/30 hover:text-white hover:bg-white/10 transition-all"
            >
              <X size={20} />
            </button>
          </div>

          {/* Daily Stats Grid */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="glass-card p-3 rounded-2xl text-center border border-white/5 overflow-hidden flex flex-col justify-center">
              <div className="flex items-center justify-center gap-1 mb-1.5 text-white/40">
                <DollarSign size={12} className="shrink-0" />
                <span className="text-[9px] font-bold uppercase tracking-wider truncate">Napi PnL</span>
              </div>
              <div className="text-lg font-black truncate" style={{ color: dailyPnl >= 0 ? '#22c55e' : '#ef4444' }} title={`${dailyPnl >= 0 ? '+' : ''}${formatPrice(dailyPnl)}`}>
                {dailyPnl >= 0 ? '+' : ''}{formatPrice(dailyPnl)}
              </div>
            </div>
            <div className="glass-card p-3 rounded-2xl text-center border border-white/5 overflow-hidden flex flex-col justify-center">
              <div className="flex items-center justify-center gap-1 mb-1.5 text-white/40">
                <BarChart2 size={12} className="shrink-0" />
                <span className="text-[9px] font-bold uppercase tracking-wider truncate">Átl. R/R</span>
              </div>
              <div className="text-lg font-black text-blue-400 truncate" title={`${avgRR.toFixed(2)}R`}>
                {avgRR.toFixed(2)}R
              </div>
            </div>
            <div className="glass-card p-3 rounded-2xl text-center border border-white/5 overflow-hidden flex flex-col justify-center">
              <div className="flex items-center justify-center gap-1 mb-1.5 text-white/40">
                <TrendingUp size={12} className="shrink-0" />
                <span className="text-[9px] font-bold uppercase tracking-wider truncate">Nyerési Arány</span>
              </div>
              <div className="text-lg font-black text-white truncate" title={`${trades.length > 0 ? Math.round((wins / trades.length) * 100) : 0}%`}>
                {trades.length > 0 ? Math.round((wins / trades.length) * 100) : 0}%
              </div>
            </div>
          </div>

          {/* Trade List */}
          <div className="space-y-3">
            {trades.map((trade, i) => {
              const { pnl, rr } = calcPnL(trade)
              const rMultiple = trade.r_multiple != null ? Number(trade.r_multiple) : rr
              const isExpanded = expandedTradeId === trade.id
              const images = trade.image_urls || trade.imageUrls || []

              return (
                <div key={trade.id} className="group">
                  <motion.div
                    layout="position"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => toggleExpand(trade.id)}
                    className="cursor-pointer rounded-2xl overflow-hidden border transition-all duration-300"
                    style={{ 
                      background: isExpanded ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)',
                      borderColor: isExpanded ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)' 
                    }}
                  >
                    <div className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div
                            className="flex items-baseline gap-1 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tighter"
                            style={{
                              background: trade.direction === 'long' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                              color: trade.direction === 'long' ? '#22c55e' : '#ef4444',
                            }}
                          >
                            {trade.direction === 'long' ? 'Vétel' : 'Eladás'}
                          </div>
                          <div>
                            <div className="text-sm font-black text-white tracking-tight">{trade.instrument}</div>
                            <div className="text-[10px] text-white/30 font-bold uppercase tracking-widest mt-0.5 flex items-center gap-1.5">
                              <span>Belépés: {formatPrice(trade.entryPrice)}</span>
                              <span className="w-1 h-1 rounded-full bg-white/10" />
                              <span className="text-white/20">SL: {formatPrice(trade.stopLoss)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-5">
                          <div className="text-right">
                            <div className="text-sm font-black text-white" style={{ color: pnl >= 0 ? '#22c55e' : '#ef4444' }}>
                              {pnl >= 0 ? '+' : ''}{formatPrice(pnl)}
                            </div>
                            <div className="text-[10px] font-bold uppercase tracking-widest pl-1 py-0.5 rounded" style={{ color: rMultiple > 0 ? '#22c55e' : (rMultiple < 0 ? '#ef4444' : 'rgba(255,255,255,0.3)'), background: rMultiple > 0 ? 'rgba(34,197,94,0.1)' : (rMultiple < 0 ? 'rgba(239,68,68,0.1)' : 'transparent') }}>
                              R: {rMultiple > 0 ? `+${rMultiple.toFixed(2)}` : rMultiple.toFixed(2)}
                            </div>
                          </div>
                          <div className={`text-white/20 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                            <ChevronDown size={18} />
                          </div>
                        </div>
                      </div>
                    </div>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="px-4 pb-4 border-t border-white/5 pt-4 space-y-5"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Details Column */}
                            <div className="space-y-4">
                              <div className="flex items-center gap-6">
                                <div>
                                  <div className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1 flex items-center gap-1">
                                    <Clock size={10} /> Belépés
                                  </div>
                                  <div className="text-xs font-bold text-white/80">{trade.entryTime || '--:--'}</div>
                                </div>
                                <div>
                                  <div className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1 flex items-center gap-1">
                                    <Clock size={10} /> Kilépés
                                  </div>
                                  <div className="text-xs font-bold text-white/80">{trade.exitTime || '--:--'}</div>
                                </div>
                              </div>

                              <div>
                                <div className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1.5 text-blue-400">Összegzés</div>
                                <p className="text-xs text-white/70 leading-relaxed font-medium">
                                  {trade.notes || 'Nincs jegyzet rögzítve.'}
                                </p>
                                
                                {/* Smart View: Tags */}
                                {(trade.tags?.length > 0 || trade.mistake_tags?.length > 0) && (
                                  <div className="mt-4 flex flex-wrap gap-2">
                                    {trade.tags?.map(tag => (
                                      <div key={tag} className="px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-wider bg-green-500/20 text-green-400 border border-green-500/40">
                                        {tag}
                                      </div>
                                    ))}
                                    {trade.mistake_tags?.map(tag => (
                                      <div key={tag} className="px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-wider bg-red-500/20 text-red-400 border border-red-500/40 flex items-center gap-1">
                                        ⚠️ {tag}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {/* CRUD Buttons */}
                              <div className="flex gap-2 pt-2">
                                <button
                                  onClick={(e) => { e.stopPropagation(); onEdit(trade) }}
                                  className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-[11px] font-bold transition-all border border-white/5"
                                >
                                  <Edit3 size={13} /> Szerkesztés
                                </button>
                                <button
                                  onClick={(e) => handleDelete(e, trade.id)}
                                  className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-red-500/5 hover:bg-red-500/10 text-red-500/60 hover:text-red-500 text-[11px] font-bold transition-all border border-red-500/10"
                                >
                                  <Trash2 size={13} /> Törlés
                                </button>
                              </div>
                            </div>

                            {/* Gallery Column */}
                            <div>
                              <div className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                <ImageIcon size={11} /> Galéria ({images.length})
                              </div>
                              {images.length > 0 ? (
                                <div className="grid grid-cols-3 gap-2">
                                  {images.map((src, idx) => (
                                    <motion.div
                                      key={idx}
                                      whileHover={{ scale: 1.05 }}
                                      onClick={(e) => { e.stopPropagation(); setLightboxData({ images, index: idx }) }}
                                      className="aspect-square rounded-lg overflow-hidden border border-white/10 cursor-zoom-in"
                                    >
                                      <img src={src} alt="screenshot" className="w-full h-full object-cover" />
                                    </motion.div>
                                  ))}
                                </div>
                              ) : (
                                <div className="h-24 rounded-xl border border-dashed border-white/5 flex items-center justify-center text-white/20 text-[11px] font-medium">
                                  Nincs csatolt kép
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </div>
              )
            })}
          </div>
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {lightboxData && (
          <Lightbox 
            images={lightboxData.images} 
            initialIndex={lightboxData.index} 
            onClose={() => setLightboxData(null)} 
          />
        )}
      </AnimatePresence>
    </>
  )
}
