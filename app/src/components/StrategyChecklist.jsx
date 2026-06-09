import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, CheckCircle2, Circle, Quote, ShieldAlert, ShieldCheck } from 'lucide-react'
import ProgressRing from '@/components/ProgressRing'

// ─── Data ────────────────────────────────────────────────────────────────────

const strategyData = [
  {
    phase: "🛠️ 1. FÁZIS: Előkészületek",
    rules: [
      "Időzítés ellenőrzése: Megfelelő időszakban vagyok? (Délelőtt 09:15-11:30 vagy Délután 15:45-18:00 Arany Ablak).",
      "Makroadat szűrő: Nincs 3 csillagos hír a következő 30 percben.",
      "Szintek felrajzolása: Behúztam a Tegnapi és a 2 nappal ezelőtti High / Low szinteket.",
      "Indikátor: Bekapcsoltam a 62-es EMA-t, minden mást letöröltem."
    ]
  },
  {
    phase: "📈 2. FÁZIS: A Kontextus",
    rules: [
      "Struktúra (H1): Egyértelmű a trend (HH/HL longhoz, vagy LH/LL shorthoz)?",
      "EMA szűrő: Az árfolyam a megfelelő oldalon van a 62 EMA-hoz képest?",
      "Nincs oldalazás: A struktúra egyértelmű, nem oldalazó piacon vagyok."
    ]
  },
  {
    phase: "🎯 3. FÁZIS: A Killzone (M15)",
    rules: [
      "Korrekció: Az árfolyam visszahúzódik a fő trenddel ellentétesen.",
      "Konfluencia: Az árfolyam beleért a zónába (62 EMA + korábbi strukturális szint találkozása)."
    ]
  },
  {
    phase: "🔫 4. FÁZIS: A Trigger (M5 / M15)",
    rules: [
      "Trendvonal: Sikerült egyértelmű trendvonalat/nyakvonalat húzni a korrekcióra.",
      "Struktúratörés (MSS): Egy határozott gyertya testtel bezárt a trendvonal felett/alatt.",
      "A gyertya lezárt, a belépés indítható."
    ]
  },
  {
    phase: "🛡️ 5. FÁZIS: Kockázatkezelés",
    rules: [
      "Pozícióméretezés: A Stop Loss maximum a tőkém 1%-át (vagy 0.5%-át) kockáztatja.",
      "Agresszív Stop: Ellenőriztem, hogy a szűkebb (második völgy alatti) stoppal megvan-e az 1:1 vagy 1:2 R/R.",
      "Visszateszt: Ha rossz az R/R, megvártam a visszacsorgást és egy új trigger gyertyát."
    ]
  },
  {
    phase: "💼 6. FÁZIS: Pozíció Menedzselés",
    rules: [
      "Break Even: 1:1 R/R-nél vagy az első logikus akadálynál a Stop Loss-t nullába húzom.",
      "Take Profit 1 (50% zárás): A pozíció felét zárom a Tegnapi High/Low elérésekor.",
      "Trailing Stop (TP2 felé): A maradék 50%-ot az M15-ös új mélypontok/csúcsok mögé húzott követő stoppal menedzselem."
    ]
  }
]

const goldenRule = `"A stratégiám csak egy statisztikai előny. Minden egyes kötés kimenetele teljesen független az előzőtől. Ha a checklistem teljesül, végrehajtom. Ha kistoppolódok, az a statisztika része, nem az én hibám. Ha a szabályt szegem meg, az az én hibám."`

const TOTAL_RULES = strategyData.reduce((sum, p) => sum + p.rules.length, 0)

// ─── Phase Card (Accordion) ────────────────────────────────────────────────

function PhaseCard({ phaseData, phaseIndex, checked, onToggle }) {
  const [open, setOpen] = useState(true)

  const phaseCheckedCount = phaseData.rules.filter((_, rIdx) =>
    checked[`${phaseIndex}-${rIdx}`]
  ).length
  const phaseTotal = phaseData.rules.length
  const phaseComplete = phaseCheckedCount === phaseTotal

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: phaseIndex * 0.07, duration: 0.35 }}
      className="glass-card overflow-hidden"
      style={{
        border: phaseComplete
          ? '1px solid rgba(34,197,94,0.35)'
          : '1px solid rgba(255,255,255,0.07)',
        boxShadow: phaseComplete
          ? '0 0 24px rgba(34,197,94,0.08)'
          : 'none',
        transition: 'border-color 0.4s, box-shadow 0.4s',
      }}
    >
      {/* Accordion header */}
      <button
        id={`phase-toggle-${phaseIndex}`}
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-left transition-all hover:bg-white/[0.02]"
      >
        <div className="flex items-center gap-3 min-w-0">
          {/* Phase completion indicator */}
          <motion.div
            animate={{ scale: phaseComplete ? [1, 1.25, 1] : 1 }}
            transition={{ duration: 0.3 }}
          >
            {phaseComplete
              ? <CheckCircle2 size={20} style={{ color: '#22c55e', filter: 'drop-shadow(0 0 6px rgba(34,197,94,0.6))' }} />
              : <Circle size={20} className="text-white/20" />
            }
          </motion.div>

          <div className="min-w-0">
            <span className="font-bold text-white text-sm truncate block">
              {phaseData.phase}
            </span>
            <span className="text-xs text-white/40">
              {phaseCheckedCount} / {phaseTotal} teljesítve
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0 ml-3">
          {/* Mini progress pill */}
          <div className="h-1.5 w-20 rounded-full overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.08)' }}>
            <motion.div
              className="h-full rounded-full"
              animate={{ width: `${(phaseCheckedCount / phaseTotal) * 100}%` }}
              transition={{ duration: 0.4 }}
              style={{
                background: phaseComplete
                  ? 'linear-gradient(90deg, #22c55e, #16a34a)'
                  : 'linear-gradient(90deg, #7c3aed, #3b82f6)',
              }}
            />
          </div>

          <ChevronDown
            size={16}
            className="text-white/40 accordion-chevron"
            style={{
              transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.3s ease',
            }}
          />
        </div>
      </button>

      {/* Accordion body */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div
              className="px-5 pb-4 space-y-2"
              style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
            >
              {phaseData.rules.map((rule, rIdx) => {
                const key = `${phaseIndex}-${rIdx}`
                const isChecked = !!checked[key]

                return (
                  <motion.label
                    key={key}
                    htmlFor={`rule-${key}`}
                    whileHover={{ x: 3 }}
                    className="flex items-start gap-3 py-2.5 px-3 rounded-xl cursor-pointer mt-2 transition-all duration-200"
                    style={{
                      background: isChecked
                        ? 'rgba(34,197,94,0.07)'
                        : 'rgba(255,255,255,0.02)',
                      border: isChecked
                        ? '1px solid rgba(34,197,94,0.2)'
                        : '1px solid transparent',
                    }}
                  >
                    {/* Custom checkbox */}
                    <div className="relative flex-shrink-0 mt-0.5">
                      <input
                        type="checkbox"
                        id={`rule-${key}`}
                        checked={isChecked}
                        onChange={() => onToggle(key)}
                        className="sr-only"
                      />
                      <motion.div
                        animate={{
                          background: isChecked
                            ? 'linear-gradient(135deg,#22c55e,#16a34a)'
                            : 'rgba(255,255,255,0.05)',
                          borderColor: isChecked
                            ? '#22c55e'
                            : 'rgba(255,255,255,0.15)',
                          boxShadow: isChecked
                            ? '0 0 10px rgba(34,197,94,0.4)'
                            : 'none',
                        }}
                        transition={{ duration: 0.2 }}
                        className="w-5 h-5 rounded-md border flex items-center justify-center"
                        style={{ borderWidth: '1.5px' }}
                      >
                        <AnimatePresence>
                          {isChecked && (
                            <motion.svg
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0, opacity: 0 }}
                              transition={{ duration: 0.15 }}
                              width="11"
                              height="11"
                              viewBox="0 0 12 12"
                              fill="none"
                            >
                              <path
                                d="M2 6l3 3 5-5"
                                stroke="white"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </motion.svg>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    </div>

                    <span
                      className="text-sm leading-relaxed transition-colors duration-200"
                      style={{
                        color: isChecked ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.8)',
                        textDecoration: isChecked ? 'line-through' : 'none',
                        textDecorationColor: 'rgba(255,255,255,0.25)',
                      }}
                    >
                      {rule}
                    </span>
                  </motion.label>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────

export default function StrategyChecklist() {
  const [checked, setChecked] = useState({})

  const checkedCount = useMemo(
    () => Object.values(checked).filter(Boolean).length,
    [checked]
  )
  const progress = TOTAL_RULES > 0 ? (checkedCount / TOTAL_RULES) * 100 : 0
  const isApproved = progress >= 100

  const toggleRule = (key) => {
    setChecked((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const resetAll = () => setChecked({})

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      {/* Page title */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-black text-white tracking-tight">
          Stratégia <span style={{ color: '#a855f7' }}>Ellenőrzőlista</span>
        </h1>
        <p className="text-white/40 text-sm mt-1">
          Pipáld ki az összes szabályt a belépés előtt · {checkedCount} / {TOTAL_RULES} teljesítve
        </p>
      </motion.div>

      {/* ── Golden Rule Quote ─────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.05 }}
        className="relative mb-8 p-6 rounded-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(124,58,237,0.12), rgba(59,130,246,0.08))',
          border: '1px solid rgba(168,85,247,0.35)',
          boxShadow: '0 0 40px rgba(124,58,237,0.1)',
        }}
      >
        {/* Decorative quote icon */}
        <Quote
          size={56}
          className="absolute -top-1 -left-1 opacity-10"
          style={{ color: '#a855f7' }}
        />
        <div className="relative">
          <div className="flex items-center gap-2 mb-3">
            <div
              className="text-xs font-bold uppercase tracking-widest px-2 py-0.5 rounded-md"
              style={{
                background: 'rgba(168,85,247,0.2)',
                color: '#a855f7',
                border: '1px solid rgba(168,85,247,0.3)',
              }}
            >
              ⚡ Arany Szabály
            </div>
          </div>
          <p
            className="text-base leading-relaxed font-medium italic"
            style={{ color: 'rgba(255,255,255,0.85)' }}
          >
            {goldenRule}
          </p>
        </div>
      </motion.div>

      {/* ── Layout: Checklist + Progress ─────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-6 items-start">

        {/* Left: Phase cards */}
        <div className="space-y-3">
          {strategyData.map((phase, pIdx) => (
            <PhaseCard
              key={pIdx}
              phaseData={phase}
              phaseIndex={pIdx}
              checked={checked}
              onToggle={toggleRule}
            />
          ))}

          {/* Reset button */}
          <motion.button
            id="reset-checklist"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={resetAll}
            className="w-full mt-2 py-2.5 rounded-xl text-sm font-medium text-white/40 transition-all hover:text-white/70"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            ↺ Checklist visszaállítása
          </motion.button>
        </div>

        {/* Right: Progress ring + Status badge */}
        <div className="lg:sticky lg:top-28 space-y-4">
          {/* Progress ring card */}
          <div
            className="glass-card p-6 flex flex-col items-center"
            style={{
              border: isApproved
                ? '1px solid rgba(34,197,94,0.35)'
                : '1px solid rgba(255,255,255,0.07)',
              transition: 'border-color 0.4s',
            }}
          >
            <p className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-5">
              Globális Haladás
            </p>
            <ProgressRing progress={progress} />
            <p className="text-xs text-white/30 mt-4 text-center">
              {checkedCount} / {TOTAL_RULES} szabály
            </p>
          </div>

          {/* Status badge */}
          <AnimatePresence mode="wait">
            {isApproved ? (
              <motion.div
                key="approved"
                id="status-approved"
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                className="p-5 rounded-2xl text-center"
                style={{
                  background: 'linear-gradient(135deg, rgba(34,197,94,0.18), rgba(34,197,94,0.08))',
                  border: '1px solid rgba(34,197,94,0.5)',
                  animation: 'glowGreen 2s ease-in-out infinite',
                }}
              >
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="flex justify-center mb-3"
                >
                  <ShieldCheck size={36} style={{ color: '#22c55e', filter: 'drop-shadow(0 0 12px rgba(34,197,94,0.8))' }} />
                </motion.div>
                <div
                  className="font-black text-sm uppercase tracking-wide leading-tight"
                  style={{ color: '#22c55e', textShadow: '0 0 20px rgba(34,197,94,0.6)' }}
                >
                  POZÍCIÓ JÓVÁHAGYVA
                </div>
                <div
                  className="font-bold text-xs mt-1 uppercase tracking-widest"
                  style={{ color: 'rgba(34,197,94,0.7)' }}
                >
                  ✓ KERESKEDÉSRE KÉSZ
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="denied"
                id="status-denied"
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                className="p-5 rounded-2xl text-center"
                style={{
                  background: 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(239,68,68,0.06))',
                  border: '1px solid rgba(239,68,68,0.4)',
                  animation: 'glowRed 2s ease-in-out infinite',
                }}
              >
                <motion.div
                  animate={{ scale: [1, 1.08, 1] }}
                  transition={{ repeat: Infinity, duration: 2.5 }}
                  className="flex justify-center mb-3"
                >
                  <ShieldAlert size={36} style={{ color: '#ef4444', filter: 'drop-shadow(0 0 12px rgba(239,68,68,0.8))' }} />
                </motion.div>
                <div
                  className="font-black text-sm uppercase tracking-wide leading-tight"
                  style={{ color: '#ef4444', textShadow: '0 0 20px rgba(239,68,68,0.6)' }}
                >
                  NE KERESKEDJ
                </div>
                <div
                  className="font-bold text-xs mt-1 uppercase tracking-widest"
                  style={{ color: 'rgba(239,68,68,0.6)' }}
                >
                  ✗ ELLENŐRZŐLISTA HIÁNYOS
                </div>
                <div className="mt-2 text-xs text-white/25">
                  {TOTAL_RULES - checkedCount} szabály van hátra
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </main>
  )
}
