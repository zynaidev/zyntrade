import { useState, useRef, useEffect, useId } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { sendTradeToWebhook } from '../services/n8nWebhook'
import { uploadScreenshots, insertTrade, updateTrade } from '../lib/supabaseClient'
import useTradeStore from '../store/useTrades'
import { Check, TrendingUp, TrendingDown, ImagePlus, X, CalendarDays, Clock, Save, PlusCircle, Search, DollarSign, PenTool, LayoutTemplate, Tag } from 'lucide-react'

const FAVORITES = ['EUR/USD', 'GBP/USD', 'DAX', 'XAU/USD', 'NAS100']
const POPULAR_GROUPS = {
  'Ércek & Nyersanyagok': ['XAG/USD', 'WTI', 'BRENT', 'NGAS'],
  'Devizák': ['USD/JPY', 'AUD/USD', 'USD/CAD', 'NZD/USD'],
  'Indexek': ['SPX500', 'US30', 'UK100', 'FRA40'],
  'Kripto': ['BTC/USD', 'ETH/USD', 'SOL/USD']
}

const BEHAVIORAL_TAGS = [
  { label: 'Stratégia betartva', isMistake: false },
  { label: 'FOMO', isMistake: true },
  { label: 'Bosszú Trade', isMistake: true },
  { label: 'Túl korai zárás', isMistake: true },
  { label: 'Túl távoli SL', isMistake: true },
  { label: 'Hírek miatti mozgás', isMistake: true },
]

const defaultForm = {
  instrument: 'NQ100',
  direction: 'long',
  entryPrice: '',
  stopLoss: '',
  closePrice: '',
  notes: '',
  entryTime: '',
  exitTime: '',
}

export default function TradeForm({ activeDate, editingTrade, onCancelEdit }) {
  const [form, setForm] = useState({
    ...defaultForm,
    date: activeDate || new Date().toISOString().split('T')[0]
  })
  const [imageFiles, setImageFiles] = useState([])
  const [imagePreviews, setImagePreviews] = useState([])
  const [selectedTags, setSelectedTags] = useState([])
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef(null)
  const fileInputId = useId()

  const addTrade = useTradeStore((s) => s.addTrade)
  const updateTradeStore = useTradeStore((s) => s.updateTrade)

  // Load editing trade data
  useEffect(() => {
    if (editingTrade) {
      setForm({
        instrument: editingTrade.instrument,
        direction: editingTrade.direction,
        entryPrice: editingTrade.entryPrice.toString(),
        stopLoss: editingTrade.stopLoss.toString(),
        closePrice: editingTrade.closePrice.toString(),
        notes: editingTrade.notes || '',
        entryTime: editingTrade.entryTime || '',
        exitTime: editingTrade.exitTime || '',
        date: editingTrade.date || new Date().toISOString().split('T')[0],
      })
      
      // Reconstruct combined selected tags
      const combined = [
        ...(editingTrade.tags || []),
        ...(editingTrade.mistake_tags || [])
      ]
      setSelectedTags(combined)
    } else {
      setForm(prev => ({ ...defaultForm, date: activeDate || new Date().toISOString().split('T')[0] }))
      setSelectedTags([])
    }
  }, [editingTrade, activeDate])

  // Clean up Object URLs
  useEffect(() => {
    return () => {
      imagePreviews.forEach(p => URL.revokeObjectURL(p))
    }
  }, [imagePreviews])

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files)
    if (files.length > 0) {
      setImageFiles(prev => [...prev, ...files])
      const newPreviews = files.map(file => URL.createObjectURL(file))
      setImagePreviews(prev => [...prev, ...newPreviews])
    }
  }

  const handleRemoveImage = (index) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index))
    URL.revokeObjectURL(imagePreviews[index])
    setImagePreviews(prev => prev.filter((_, i) => i !== index))
  }

  const handleReset = () => {
    setForm({ ...defaultForm, date: activeDate || new Date().toISOString().split('T')[0] })
    setImageFiles([])
    imagePreviews.forEach(p => URL.revokeObjectURL(p))
    setImagePreviews([])
    setSelectedTags([])
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      let finalImageUrls = editingTrade ? (editingTrade.image_urls || []) : []
      if (imageFiles && imageFiles.length > 0) {
        try {
          const uploadedUrls = await uploadScreenshots(imageFiles)
          finalImageUrls = [...finalImageUrls, ...uploadedUrls]
        } catch (err) {
          console.error('Képfeltöltés sikertelen.', err)
          throw new Error('Képfeltöltés sikertelen: ' + err.message)
        }
      }

      const tradeDate = form.date || new Date().toISOString().split('T')[0]

      // R-Multiple Calculation
      const ep = parseFloat(form.entryPrice)
      const sl = parseFloat(form.stopLoss)
      const cp = parseFloat(form.closePrice)
      
      let r_multiple = 0
      if (!isNaN(ep) && !isNaN(sl) && !isNaN(cp) && Math.abs(ep - sl) > 0) {
        const diff = cp - ep
        const pnl = form.direction === 'long' ? diff : -diff
        const risk = Math.abs(ep - sl)
        r_multiple = Number((pnl / risk).toFixed(2))
      }

      // Filter tags
      const normalTags = selectedTags.filter(t => !BEHAVIORAL_TAGS.find(b => b.label === t)?.isMistake)
      const mistakeTags = selectedTags.filter(t => BEHAVIORAL_TAGS.find(b => b.label === t)?.isMistake)

      const tradeData = {
        ...form,
        entryPrice: isNaN(ep) ? 0 : ep,
        stopLoss: isNaN(sl) ? 0 : sl,
        closePrice: isNaN(cp) ? 0 : cp,
        date: tradeDate,
        image_urls: finalImageUrls || [],
        r_multiple,
        tags: normalTags,
        mistake_tags: mistakeTags
      }

      let resultTrade
      if (editingTrade) {
        resultTrade = await updateTrade(editingTrade.id, tradeData)
        updateTradeStore(resultTrade || tradeData) // Ensure immediate local update
      } else {
        resultTrade = await insertTrade(tradeData)
        addTrade(resultTrade || tradeData) // Ensure immediate local update
      }

      try {
        await sendTradeToWebhook(resultTrade || tradeData)
      } catch (err) {
        console.warn('n8n webhook sikertelen.', err)
      }

      setSubmitted(true)
      
      // Force instant full form reset instead of waiting
      if (editingTrade) {
        onCancelEdit()
      } else {
        handleReset()
      }

      setTimeout(() => {
        setSubmitted(false)
      }, 1500)
    } catch (err) {
      console.error(err)
      alert(err.message || 'Váratlan hiba történt a mentés során.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full relative transition-all duration-500 mt-6 lg:mt-2">
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-4 gap-8 lg:gap-10 relative z-10 w-full items-stretch">
        
        {/* COLUMN 1: Basic Info & Direction */}
        <div className="flex flex-col justify-start w-full gap-5">
           <div>
             <div className="flex items-center gap-2 ml-1 mb-3">
                <LayoutTemplate size={16} className="text-purple-400" />
                <h3 className="font-black text-white/90 uppercase tracking-widest text-[10px]">Alapadatok & Irány</h3>
             </div>
             <div className="flex gap-2">
                <select
                  value={FAVORITES.includes(form.instrument) ? form.instrument : ''}
                  onChange={(e) => setForm({ ...form, instrument: e.target.value })}
                  className="w-1/2 input-field py-2.5 px-3 text-xs font-bold bg-white/5 border-white/10 rounded-xl"
                  title="Kedvencek"
                >
                  <option value="" disabled style={{ background: '#0e0e1a' }}>Kedvencek</option>
                  {FAVORITES.map((i) => (
                    <option key={i} value={i} style={{ background: '#0e0e1a' }}>{i}</option>
                  ))}
                </select>

                <select
                  value={!FAVORITES.includes(form.instrument) && form.instrument ? form.instrument : ''}
                  onChange={(e) => setForm({ ...form, instrument: e.target.value })}
                  className="w-1/2 input-field py-2.5 px-3 text-xs font-bold bg-white/5 border-white/10 rounded-xl"
                  title="Népszerűek"
                >
                  <option value="" disabled style={{ background: '#0e0e1a' }}>Kategóriák</option>
                  {Object.entries(POPULAR_GROUPS).map(([group, items]) => (
                    <optgroup key={group} label={group} style={{ background: '#0e0e1a', color: '#a855f7' }}>
                      {items.map((i) => (
                        <option key={i} value={i} style={{ background: '#0e0e1a', color: '#fff' }}>{i}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
             </div>
           </div>

           <div className="flex gap-2">
             <motion.button
               whileHover={{ scale: 1.02 }}
               whileTap={{ scale: 0.98 }}
               type="button"
               onClick={() => setForm({ ...form, direction: 'long' })}
               className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 rounded-xl text-[10px] font-black transition-all border-2 ${
                 form.direction === 'long' 
                   ? 'bg-green-500/10 border-green-500/40 text-green-400 shadow-[0_0_20px_rgba(34,197,94,0.15)]' 
                   : 'bg-white/[0.03] border-white/5 text-white/20 hover:text-white/40'
               }`}
             >
               <TrendingUp size={16} /> LONG (VÉTEL)
             </motion.button>
             <motion.button
               whileHover={{ scale: 1.02 }}
               whileTap={{ scale: 0.98 }}
               type="button"
               onClick={() => setForm({ ...form, direction: 'short' })}
               className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 rounded-xl text-[10px] font-black transition-all border-2 ${
                 form.direction === 'short' 
                   ? 'bg-red-500/10 border-red-500/40 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.15)]' 
                   : 'bg-white/[0.03] border-white/5 text-white/20 hover:text-white/40'
               }`}
             >
               <TrendingDown size={16} /> SHORT (ELADÁS)
             </motion.button>
           </div>

           <div>
             <label className="text-[9px] uppercase tracking-widest text-white/30 font-bold ml-1 flex gap-1 items-center mb-1">
               <CalendarDays size={10} className="text-[#a855f7]" /> Kötés Dátuma
             </label>
             <input
               type="date"
               required
               value={form.date || ''}
               onChange={(e) => setForm({ ...form, date: e.target.value })}
               className="w-full input-field py-2.5 px-4 text-sm font-bold bg-white/5 border-white/10 rounded-xl"
               style={{ colorScheme: 'dark' }}
             />
           </div>
        </div>

        {/* COLUMN 2: Finances & Times */}
        <div className="flex flex-col justify-start w-full gap-5">
           <div className="grid grid-cols-2 gap-2">
             <div className="col-span-2">
               <label className="text-[9px] uppercase tracking-widest text-white/30 font-bold ml-1 flex gap-1 items-center mb-1">
                 <DollarSign size={10} className="text-blue-400" /> Belépési Ár
               </label>
               <input
                 type="number" step="any" required placeholder="0.00"
                 value={form.entryPrice}
                 onChange={(e) => setForm({ ...form, entryPrice: e.target.value })}
                 className="w-full input-field py-2.5 px-4 text-sm font-black bg-white/5 border-white/10 rounded-xl"
               />
             </div>
             <div>
               <label className="text-[9px] uppercase tracking-widest text-white/30 font-bold ml-1 mb-1 block">Stop Loss</label>
               <input
                 type="number" step="any" required placeholder="0.00"
                 value={form.stopLoss}
                 onChange={(e) => setForm({ ...form, stopLoss: e.target.value })}
                 className="w-full input-field py-2.5 px-3 text-sm font-bold bg-white/5 border-white/10 rounded-xl text-red-500/80"
               />
             </div>
             <div>
               <label className="text-[9px] uppercase tracking-widest text-white/30 font-bold ml-1 mb-1 block">Záró Ár</label>
               <input
                 type="number" step="any" required placeholder="0.00"
                 value={form.closePrice}
                 onChange={(e) => setForm({ ...form, closePrice: e.target.value })}
                 className="w-full input-field py-2.5 px-3 text-sm font-bold bg-white/5 border-white/10 rounded-xl text-green-500/80"
               />
             </div>
           </div>
           
           <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5">
             <div>
               <label className="text-[9px] uppercase tracking-widest text-white/30 font-bold ml-1 flex gap-1 items-center mb-1">
                 <Clock size={10} className="text-orange-400" /> Belépés
               </label>
               <input
                 type="time"
                 value={form.entryTime}
                 onChange={(e) => setForm({ ...form, entryTime: e.target.value })}
                 className="w-full input-field py-2 px-3 text-xs font-bold bg-white/5 border-white/10 rounded-xl"
               />
             </div>
             <div>
               <label className="text-[9px] uppercase tracking-widest text-white/30 font-bold ml-1 block mb-1">Kilépés</label>
               <input
                 type="time"
                 value={form.exitTime}
                 onChange={(e) => setForm({ ...form, exitTime: e.target.value })}
                 className="w-full input-field py-2 px-3 text-xs font-bold bg-white/5 border-white/10 rounded-xl"
               />
             </div>
           </div>
        </div>

        {/* COLUMN 3: Notes, Tags & Media */}
        <div className="flex flex-col justify-start w-full gap-5">
           <div className="flex-1 flex flex-col gap-2">
             <label className="text-[9px] uppercase tracking-widest text-white/30 font-bold ml-1 flex gap-1 items-center">
               <PenTool size={10} className="text-pink-400" /> Jegyzet
             </label>
             <textarea
               placeholder="Piaci kontextus, érzelmek..."
               value={form.notes}
               onChange={(e) => setForm({ ...form, notes: e.target.value })}
               className="w-full lg:flex-1 input-field py-3 px-4 text-xs font-medium bg-white/5 border-white/10 rounded-xl resize-none relative z-20 min-h-[60px]"
             />
           </div>

           <div className="flex flex-col gap-2 relative z-20">
             <label className="text-[9px] uppercase tracking-widest text-white/30 font-bold ml-1 flex gap-1 items-center mt-1">
               <Tag size={10} className="text-yellow-400" /> Címkék & Viselkedés
             </label>
             <div className="flex flex-wrap gap-1.5">
               {BEHAVIORAL_TAGS.map((tag) => {
                 const isSelected = selectedTags.includes(tag.label)
                 
                 return (
                   <button
                     key={tag.label}
                     type="button"
                     onClick={() => {
                       setSelectedTags(prev => 
                         isSelected ? prev.filter(t => t !== tag.label) : [...prev, tag.label]
                       )
                     }}
                     className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider transition-all border ${
                       isSelected 
                         ? tag.isMistake 
                           ? 'bg-red-500/20 text-red-400 border-red-500/40 shadow-[0_0_15px_rgba(239,68,68,0.2)]' 
                           : 'bg-green-500/20 text-green-400 border-green-500/40 shadow-[0_0_15px_rgba(34,197,94,0.2)]'
                         : 'bg-white/5 text-white/40 border-white/10 hover:bg-white/10'
                     }`}
                   >
                     {tag.label}
                   </button>
                 )
               })}
             </div>
           </div>
           
           <input id={fileInputId} type="file" accept="image/*" multiple ref={fileInputRef} onChange={handleImageChange} className="sr-only" />
           <label 
             htmlFor={fileInputId}
             onClick={() => fileInputRef.current?.click()}
             className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-dashed transition-all cursor-pointer relative z-20 ${
               imagePreviews.length > 0 
                 ? 'bg-purple-500/10 border-purple-500/40 text-purple-400' 
                 : 'bg-white/[0.03] border-white/10 text-white/40 hover:bg-white/10'
             }`}
           >
             <ImagePlus size={16} />
             <span className="text-xs font-bold text-white/70">
                {imagePreviews.length > 0 ? `${imagePreviews.length} fájl csatolva` : 'Kép csatolása...'}
             </span>
           </label>
        </div>

        {/* COLUMN 4: Action Button */}
        <div className="flex flex-col justify-start w-full gap-5">
           <div className="hidden lg:block h-6" /> {/* Spacer to align button lower */}
           <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className={`w-full h-full min-h-[60px] lg:flex-1 rounded-2xl font-black text-sm text-white flex flex-col items-center justify-center gap-2 transition-all border-b-2 relative z-20 ${
                submitted 
                  ? 'bg-green-600 border-green-700 shadow-[0_0_20px_rgba(34,197,94,0.3)]' 
                  : editingTrade
                    ? 'bg-green-600 border-green-700 shadow-[0_0_20px_rgba(34,197,94,0.3)]'
                    : 'bg-gradient-to-br from-purple-600 to-blue-600 border-blue-900 shadow-[0_0_20px_rgba(124,58,237,0.3)]'
              }`}
              style={{ opacity: loading ? 0.7 : 1 }}
            >
              {submitted ? (
                <><Check size={20} /> RÖGZÍTVE</>
              ) : loading ? (
                <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> ...</>
              ) : (
                editingTrade ? <><Save size={20} /> FRISSÍTÉS</> : <><PlusCircle size={20} /> KÖTÉS LÉTREHOZÁSA</>
              )}
            </motion.button>
            
            {editingTrade && (
              <button 
                type="button" onClick={onCancelEdit}
                className="w-full py-1.5 text-[10px] font-bold text-white/30 hover:text-white/60 uppercase tracking-widest transition-colors flex items-center justify-center gap-1 relative z-20"
              >
                <X size={12} /> Mégse
              </button>
            )}
        </div>
      </form>
      
      {/* GALLERY VIEW */}
      <AnimatePresence>
        {imagePreviews.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-8 pt-8 border-t border-white/10"
          >
            <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
              {imagePreviews.map((preview, idx) => (
                <motion.div 
                  key={idx} 
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  className="relative flex-shrink-0 w-24 h-24 rounded-2xl overflow-hidden border-2 border-white/10 group"
                >
                  <img src={preview} alt="preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      type="button" onClick={() => handleRemoveImage(idx)}
                      className="bg-red-500 rounded-lg p-1.5 hover:scale-110 transition-transform"
                    >
                      <X size={14} className="text-white" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
