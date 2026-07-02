import { useState, useEffect, useMemo } from 'react'

// ─── Instrument-specific parameters (display only) ─────────────────────────

const INSTRUMENT_PARAMS = {
  'DAX':      { minSweep: '0.15× ATR(14)', displacement: '1.5× ATR(14)', risk: '0.5–1%' },
  'EUR/USD':  { minSweep: '0.20× ATR(14)', displacement: '1.5× ATR(14)', risk: '0.5–1%' },
  'GBP/USD':  { minSweep: '0.20× ATR(14)', displacement: '1.5× ATR(14)', risk: '0.5–1%' },
  'US100':    { minSweep: '0.15× ATR(14)', displacement: '1.5× ATR(14)', risk: '0.5–1%' },
  'XAU/USD':  { minSweep: '0.20× ATR(14)', displacement: '1.6× ATR(14)', risk: '0.5–1%' },
}

const SESSION_OPTIONS = {
  morning: { label: 'Délelőtt', time: '09:15 – 11:30 CET' },
  afternoon: { label: 'Délután', time: '15:45 – 18:00 CET' },
}

// ─── Phases & Rules ──────────────────────────────────────────────────────

const PHASES = [
  {
    name: 'FÁZIS 1 — Előkészület',
    blocking: true,
    rules: [
      'Session azonosítva (délelőtt 09:15–11:30 vagy délután 15:45–18:00 CET)',
      'Nyitási káosz ablak lezárult (09:00–09:15 / 15:30–15:45 eltelt)',
      'Nincs 3 csillagos (piros) hír a következő 30 percben az instrumentumon',
      'Chart setup kész: csak 62 EMA látható, Tegnapi H/L és -2 nap H/L berajzolva',
    ],
  },
  {
    name: 'FÁZIS 2 — Kontextus H1',
    blocking: true,
    rules: [
      'Irány meghatározva: utolsó 3 fraktálpont egyértelmű HH+HL (Long) vagy LH+LL (Short) sorozatot alkot',
      'Árfolyam a 62 EMA FELETT van H1-en (Long) / ALATT (Short)',
      'Nincs oldalazás — ha oldalaz: NINCS KÖTÉS, ugorj más instrumentumra',
    ],
  },
  {
    name: 'FÁZIS 3 — Korrekció és Konfluencia Zóna M15',
    blocking: true,
    rules: [
      'Legalább 3 egymást követő M15 gyertya visszahúzódott a fő trenddel ellentétesen',
      'Korrekció elérte a konfluencia zónát: 62 EMA (± fél ATR14) átfedésben van egy strukturális szinttel',
      'Zónában azonosítható: Tegnapi H/L vagy korábban áttört, visszatesztelt strukturális szint',
    ],
  },
  {
    name: 'FÁZIS 4 — Trigger: Sweep + Reclaim + Displacement',
    blocking: true,
    rules: [
      'Referencia swing pont azonosítva M15-ön: utolsó 10–15 gyertya, 2-bal/2-jobb fraktál szabállyal',
      'Likviditás sweep megtörtént: gyertya áttörte a referencia szintet min. {minSweep} mélységgel',
      'Reclaim megtörtént: 2 gyertyán belül a gyertya visszazárt a referencia szint fölé (Long) / alá (Short)',
      'Displacement teljesül: reclaim gyertya teste ≥ {displacement} az előző 14 gyertya átlagos testméreténél',
      '(Opcionális) Fair Value Gap azonosítható a mozgás irányában — 3 gyertya közötti be nem töltött rés',
    ],
  },
  {
    name: 'FÁZIS 5 — Kockázatkezelés',
    blocking: true,
    rules: [
      'Stop Loss elhelyezve a második völgy (Higher Low) alá / fölé — NEM a legeslegalsó pontra',
      'R:R arány legalább 1:1 teljesül a szűkebb stoppal is (ideálisan 1:2)',
      'Pozícióméret kiszámolva: SL teljesülése esetén max {risk} tőkeveszteség',
      'Lot méret kalkulátorral ellenőrizve és beírva a kereskedési platformba',
    ],
  },
  {
    name: 'FÁZIS 6 — Pozíció Menedzsment',
    blocking: false,
    rules: [
      'BE szint meghatározva: 1:1 R:R elérése után SL → belépési árra húzva',
      'TP1: Tegnapi High (Long) / Low (Short) — itt zárom a pozíció 50%-át',
      'TP2: 2 nappal ezelőtti High/Low — trailing stop: minden új HL/LH után SL mögé húzva',
    ],
  },
]

const BLOCKING_PHASES = [0, 1, 2, 3, 4]

function renderRuleText(text, params) {
  return text
    .replace('{minSweep}', params.minSweep)
    .replace('{displacement}', params.displacement)
    .replace('{risk}', params.risk)
}

// ─── Main Component ─────────────────────────────────────────────────────

export default function StrategyChecklist() {
  const [checked, setChecked] = useState({})
  const [instrument, setInstrument] = useState('EUR/USD')
  const [session, setSession] = useState('morning')
  const [direction, setDirection] = useState('long')
  const [date, setDate] = useState(() => new Date().toLocaleDateString('sv'))
  const [history, setHistory] = useState([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState(null)

  const params = INSTRUMENT_PARAMS[instrument]

  useEffect(() => {
    setChecked({})
  }, [instrument, session, direction])

  useEffect(() => {
    async function loadHistory() {
      try {
        const res = await fetch('/api/checklist')
        if (!res.ok) throw new Error('Failed to load history')
        const data = await res.json()
        setHistory(data.slice(0, 10))
      } catch (err) {
        console.error('Hiba a checklist előzmények betöltésekor:', err)
      }
    }
    loadHistory()
  }, [])

  const toggleRule = (key) => {
    setChecked((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const totalRules = useMemo(
    () => PHASES.reduce((sum, p) => sum + p.rules.length, 0),
    []
  )
  const checkedCount = useMemo(
    () => Object.values(checked).filter(Boolean).length,
    [checked]
  )
  const progress = totalRules > 0 ? (checkedCount / totalRules) * 100 : 0

  const approved = BLOCKING_PHASES.every((pi) =>
    PHASES[pi].rules.every((_, ri) => checked[`f${pi}_r${ri}`])
  )

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    setError(null)
    try {
      const rulesChecked = {}
      PHASES.forEach((phase, pi) => {
        phase.rules.forEach((_, ri) => {
          rulesChecked[`f${pi}_r${ri}`] = checked[`f${pi}_r${ri}`] || false
        })
      })

      const res = await fetch('/api/checklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          instrument,
          session,
          direction,
          approved,
          checked_count: Object.values(rulesChecked).filter(Boolean).length,
          total_rules: Object.keys(rulesChecked).length,
          rules_checked: rulesChecked,
        }),
      })
      if (!res.ok) throw new Error('Mentés sikertelen')
      const savedRow = await res.json()
      setHistory((prev) => [savedRow, ...prev].slice(0, 10))
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setError(err.message || 'Váratlan hiba történt a mentés során.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* ── Header card ─────────────────────────────────── */}
      <div className="glass-card-strong p-6 rounded-3xl space-y-6">
        <h1 className="text-2xl font-black text-white tracking-tight">
          Stratégia Checklist — <span style={{ color: '#a855f7' }}>Liquidity Sweep Reversal</span>
        </h1>

        {/* Row 1: selectors */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold block mb-1">
              Instrumentum
            </label>
            <select
              value={instrument}
              onChange={(e) => setInstrument(e.target.value)}
              className="input-field w-full py-2.5 px-3 text-sm font-bold"
            >
              {Object.keys(INSTRUMENT_PARAMS).map((i) => (
                <option key={i} value={i}>{i}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold block mb-1">
              Session
            </label>
            <select
              value={session}
              onChange={(e) => setSession(e.target.value)}
              className="input-field w-full py-2.5 px-3 text-sm font-bold"
            >
              {Object.entries(SESSION_OPTIONS).map(([key, s]) => (
                <option key={key} value={key}>{s.label} ({s.time})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold block mb-1">
              Irány
            </label>
            <select
              value={direction}
              onChange={(e) => setDirection(e.target.value)}
              className="input-field w-full py-2.5 px-3 text-sm font-bold"
            >
              <option value="long">Long</option>
              <option value="short">Short</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold block mb-1">
              Dátum
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="input-field w-full py-2.5 px-3 text-sm font-bold"
              style={{ colorScheme: 'dark' }}
            />
          </div>
        </div>

        {/* Row 2: approval badge */}
        <div className="flex justify-center">
          <div
            className="text-center font-black text-lg"
            style={{
              background: approved ? '#16a34a' : '#dc2626',
              color: 'white',
              borderRadius: '12px',
              padding: '12px 24px',
            }}
          >
            {approved ? '✓ KÖTÉS ENGEDÉLYEZVE' : '✗ KÖTÉS TILTOTT'}
          </div>
        </div>

        {/* Progress bar */}
        <div>
          <p className="text-xs text-white/40 mb-2 text-center">
            {checkedCount} / {totalRules} szabály teljesítve
          </p>
          <div className="h-2 w-full rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${progress}%`,
                background: approved
                  ? 'linear-gradient(90deg, #22c55e, #16a34a)'
                  : 'linear-gradient(90deg, #7c3aed, #3b82f6)',
              }}
            />
          </div>
        </div>
      </div>

      {/* ── Phase cards ─────────────────────────────────── */}
      {PHASES.map((phase, pi) => {
        const phaseCheckedCount = phase.rules.filter((_, ri) => checked[`f${pi}_r${ri}`]).length
        const phaseTotal = phase.rules.length
        const phaseComplete = phaseCheckedCount === phaseTotal

        return (
          <div
            key={pi}
            className="glass-card p-5 rounded-2xl"
            style={{
              border: phaseComplete ? '1px solid #22c55e' : '1px solid rgba(255,255,255,0.07)',
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-white text-sm">
                {phase.name}
                {!phase.blocking && (
                  <span className="ml-2 text-xs text-white/40 font-normal">(Informatív)</span>
                )}
              </h2>
              <span
                className="text-xs font-black px-2 py-0.5 rounded-md"
                style={{
                  color: phaseComplete ? '#22c55e' : 'rgba(255,255,255,0.4)',
                  background: phaseComplete ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.05)',
                }}
              >
                {phaseCheckedCount}/{phaseTotal}
              </span>
            </div>

            <div className="space-y-2">
              {phase.rules.map((rule, ri) => {
                const key = `f${pi}_r${ri}`
                const isChecked = !!checked[key]
                const text = renderRuleText(rule, params)

                return (
                  <label
                    key={key}
                    htmlFor={key}
                    className="flex items-start gap-3 py-2 px-3 rounded-xl cursor-pointer"
                    style={{
                      background: isChecked ? 'rgba(34,197,94,0.07)' : 'rgba(255,255,255,0.02)',
                    }}
                  >
                    <input
                      type="checkbox"
                      id={key}
                      checked={isChecked}
                      onChange={() => toggleRule(key)}
                      style={{ accentColor: '#22c55e' }}
                      className="mt-0.5"
                    />
                    <span
                      className="text-sm leading-relaxed"
                      style={{ color: isChecked ? '#22c55e' : 'rgba(255,255,255,0.8)' }}
                    >
                      {text}
                    </span>
                  </label>
                )
              })}
            </div>
          </div>
        )
      })}

      {/* ── Save section ─────────────────────────────────── */}
      <div className="glass-card p-6 rounded-2xl text-center space-y-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-8 py-3 rounded-xl font-black text-sm text-white transition-all"
          style={{
            background: 'linear-gradient(135deg, #7c3aed, #3b82f6)',
            opacity: saving ? 0.6 : 1,
          }}
        >
          {saving ? 'Mentés...' : 'Mentés'}
        </button>
        {saved && (
          <p className="text-sm font-bold" style={{ color: '#22c55e' }}>✓ Checklist elmentve</p>
        )}
        {error && (
          <p className="text-sm font-bold" style={{ color: '#ef4444' }}>{error}</p>
        )}
      </div>

      {/* ── History section ─────────────────────────────────── */}
      <div className="glass-card p-6 rounded-2xl">
        <h2 className="font-bold text-white text-sm mb-4">Korábbi Checklistek</h2>
        {history.length === 0 ? (
          <p className="text-sm text-white/40 text-center py-6">Még nincs mentett checklist</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-white/40 text-xs uppercase tracking-widest">
                  <th className="py-2 pr-4">Dátum</th>
                  <th className="py-2 pr-4">Instrumentum</th>
                  <th className="py-2 pr-4">Session</th>
                  <th className="py-2 pr-4">Irány</th>
                  <th className="py-2 pr-4">Eredmény</th>
                  <th className="py-2 pr-4">Teljesítve</th>
                </tr>
              </thead>
              <tbody>
                {history.map((row) => (
                  <tr key={row.id} className="border-t border-white/5">
                    <td className="py-2 pr-4 text-white/70">{String(row.date).slice(0, 10)}</td>
                    <td className="py-2 pr-4 text-white/70">{row.instrument}</td>
                    <td className="py-2 pr-4 text-white/70">
                      {SESSION_OPTIONS[row.session]?.label || row.session}
                    </td>
                    <td className="py-2 pr-4 text-white/70">
                      {row.direction === 'short' ? 'Short' : 'Long'}
                    </td>
                    <td className="py-2 pr-4">
                      {row.approved ? (
                        <span className="font-bold" style={{ color: '#22c55e' }}>✓ Engedélyezve</span>
                      ) : (
                        <span className="font-bold" style={{ color: '#ef4444' }}>✗ Tiltott</span>
                      )}
                    </td>
                    <td className="py-2 pr-4 text-white/70">
                      {row.checked_count}/{row.total_rules}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  )
}
