'use client'
import { useState, useEffect } from 'react'

const RULES = [
  { id: 'context',      label: 'H1 trend egyértelmű — HH+HL (Long) vagy LH+LL (Short) + árfolyam 62 EMA megfelelő oldalán' },
  { id: 'session',      label: 'Arany ablakban vagyunk — 09:15–11:30 vagy 15:45–18:00 CET' },
  { id: 'news',         label: 'Nincs piros (3 csillagos) hír a következő 30 percben' },
  { id: 'zone',         label: 'Korrekció elérte a konfluencia zónát — 62 EMA ± fél ATR(14) átfedésben strukturális szinttel' },
  { id: 'sweep',        label: 'Likviditás sweep megtörtént — referencia szint áttörve min. 0.20× ATR(14) mélységgel' },
  { id: 'reclaim',      label: 'Reclaim megtörtént — 2 gyertyán belül visszazárt a referencia szint fölé/alá' },
  { id: 'displacement', label: 'Displacement teljesül — reclaim gyertya teste ≥ 1.5× ATR(14) az előző 14 gyertya átlagához képest' },
  { id: 'risk',         label: 'R:R legalább 1:1 — lot méret kiszámolva, max 1% tőkekockázat' },
]

const INSTRUMENTS = ['DAX', 'EUR/USD', 'GBP/USD', 'US100', 'XAU/USD']
const DIRECTIONS = ['Long', 'Short']

export default function StrategyChecklist() {
  const [checked, setChecked] = useState({})
  const [instrument, setInstrument] = useState('EUR/USD')
  const [direction, setDirection] = useState('Long')

  const reset = () => setChecked({})

  useEffect(() => { reset() }, [instrument, direction])

  const toggle = (id) => setChecked(prev => ({ ...prev, [id]: !prev[id] }))

  const allChecked = RULES.every(r => checked[r.id])

  return (
    <div className="w-full max-w-2xl mx-auto p-6">
      <div className="glass-card p-6 space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-white">Pre-Trade Checklist</h2>
            <p className="text-white/40 text-xs mt-1">Mind a 8 pont teljesül? → Kötés mehet.</p>
          </div>
          <div
            style={{
              background: allChecked ? '#16a34a' : '#dc2626',
              borderRadius: 12,
              padding: '10px 20px',
              color: 'white',
              fontWeight: 900,
              fontSize: 16,
              whiteSpace: 'nowrap',
              transition: 'background 0.2s',
            }}
          >
            {allChecked ? '✓ MEHET' : '✗ NEM MEHET'}
          </div>
        </div>

        {/* Instrument pills */}
        <div className="space-y-2">
          <p className="text-white/40 text-xs uppercase tracking-widest">Instrumentum</p>
          <div className="flex flex-wrap gap-2">
            {INSTRUMENTS.map(inst => (
              <button
                key={inst}
                onClick={() => setInstrument(inst)}
                style={{
                  background: instrument === inst ? 'rgba(124,58,237,0.7)' : 'rgba(255,255,255,0.06)',
                  border: '1px solid',
                  borderColor: instrument === inst ? '#7c3aed' : 'rgba(255,255,255,0.1)',
                  borderRadius: 8,
                  padding: '6px 14px',
                  color: 'white',
                  fontSize: 13,
                  fontWeight: instrument === inst ? 700 : 400,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {inst}
              </button>
            ))}
          </div>
        </div>

        {/* Direction pills */}
        <div className="space-y-2">
          <p className="text-white/40 text-xs uppercase tracking-widest">Irány</p>
          <div className="flex gap-2">
            {DIRECTIONS.map(dir => (
              <button
                key={dir}
                onClick={() => setDirection(dir)}
                style={{
                  background: direction === dir
                    ? dir === 'Long' ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'
                    : 'rgba(255,255,255,0.06)',
                  border: '1px solid',
                  borderColor: direction === dir
                    ? dir === 'Long' ? '#22c55e' : '#ef4444'
                    : 'rgba(255,255,255,0.1)',
                  borderRadius: 8,
                  padding: '6px 24px',
                  color: direction === dir
                    ? dir === 'Long' ? '#22c55e' : '#ef4444'
                    : 'rgba(255,255,255,0.5)',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {dir === 'Long' ? '▲ Long' : '▼ Short'}
              </button>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }} />

        {/* Rules */}
        <div className="space-y-3">
          {RULES.map((rule, i) => (
            <div
              key={rule.id}
              onClick={() => toggle(rule.id)}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 14,
                padding: '12px 14px',
                borderRadius: 10,
                background: checked[rule.id] ? 'rgba(34,197,94,0.08)' : 'rgba(255,255,255,0.02)',
                border: '1px solid',
                borderColor: checked[rule.id] ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.06)',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {/* Checkbox */}
              <div style={{
                width: 22,
                height: 22,
                borderRadius: 6,
                border: '2px solid',
                borderColor: checked[rule.id] ? '#22c55e' : 'rgba(255,255,255,0.2)',
                background: checked[rule.id] ? '#22c55e' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                marginTop: 1,
                transition: 'all 0.15s',
              }}>
                {checked[rule.id] && (
                  <svg width="13" height="10" viewBox="0 0 13 10" fill="none">
                    <path d="M1 5L5 9L12 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
              {/* Rule text */}
              <span style={{
                color: checked[rule.id] ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.45)',
                fontSize: 14,
                lineHeight: 1.6,
                transition: 'color 0.15s',
              }}>
                <span style={{ color: 'rgba(255,255,255,0.2)', marginRight: 8, fontSize: 12 }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                {rule.label}
              </span>
            </div>
          ))}
        </div>

        {/* Reset */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 16 }}>
          <button
            onClick={reset}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8,
              padding: '8px 20px',
              color: 'rgba(255,255,255,0.4)',
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            Reset
          </button>
        </div>

      </div>
    </div>
  )
}
