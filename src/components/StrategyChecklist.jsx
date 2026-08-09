'use client'
import { useState, useEffect } from 'react'
import { Check, ShieldAlert } from 'lucide-react'

// ─── Design tokens ───────────────────────────────────────────────────────────
const GOLD = '#c9a961'
const EMERALD = '#10b981'
const CRIMSON = '#f87171'
const AMBER = '#f59e0b'

const STRATEGIES = {
  liquiditySweep: {
    id: 'liquiditySweep',
    name: 'Liquidity Sweep Reversal',
    instruments: ['EUR/USD', 'GBP/USD', 'DAX', 'XAU/USD', 'US100'],
    sections: [
      {
        id: 'premarket',
        title: 'Piac-nyitás Előtti Feltételek',
        kicker: 'Előkészítés',
        rules: [
          {
            id: 'p1r1',
            label: 'H1 trend egyértelmű',
            description: 'Long: HH+HL sorozat, ár a 62 EMA felett. Short: LH+LL sorozat, ár a 62 EMA alatt. Ha az ár az EMA-n van, vagy a struktúra vegyes → nem kereskedsz ezen az instrumenten ma.'
          },
          {
            id: 'p1r2',
            label: 'Kereskedési ablakban vagyunk',
            description: '09:15–11:30 vagy 15:45–18:00 CET. Az ablak előtt 15 perccel nyitod meg a chartot. Ablak után nyitott pozíciót manuálisan zárod, nem hagyod másnapra.'
          },
          {
            id: 'p1r3',
            label: 'Nincs piros hír a következő 30 percben',
            description: 'Forexfactory.com — csak a 3 csillagos (piros) hírek blokkolnak. Ha van ilyen: várod míg elmúlik, utána újra ellenőrzöd a setupot. Sárga/narancssárga hírek nem blokkolnak.'
          },
        ],
      },
      {
        id: 'setup',
        title: 'Setup Kialakulás',
        kicker: 'Konfluencia & Likviditás',
        rules: [
          {
            id: 'p2r1',
            label: 'Korrekció elérte a konfluencia zónát',
            description: 'Az ár visszahúzódott egy zónába ahol legalább 2 dolog egybeesik: a 62 EMA közel van (±0.5× ATR(14)) ÉS van ott strukturális szint (korábbi swing high/low). Ha csak az egyik teljesül → nem elég erős a zóna, vársz.'
          },
          {
            id: 'p2r2',
            label: 'Likviditás sweep megtörtént — min. 0.20× ATR(14)',
            description: 'Az ár áttörte a referencia szintet (lokális swing mélypont/csúcs) legalább 0.20× ATR(14) mélységgel. Nem elég hogy megérintette — át kell törnie. Az ATR értéket naponta egyszer kalkulálod le az adott instrumenten.'
          },
          {
            id: 'p2r3',
            label: 'Reclaim megtörtént — 2 gyertyán belül',
            description: 'A sweep után az ár visszazárt a referencia szint másik oldalára, legfeljebb 2 M15-ös gyertyán belül. Ha a 3. gyertya is a rossz oldalon zár → a setup érvénytelen. A gyertya zárása a döntő, nem a wick.'
          },
          {
            id: 'p2r4',
            label: 'Displacement teljesül — reclaim gyertya teste ≥ 1.5× ATR',
            description: 'A reclaim gyertya teste (nyitó-záró, wick nélkül) legalább 1.5× akkora mint az előző 14 gyertya átlagos teste. Ha a gyertya doji vagy spinning top jellegű → nem displacement, elveted a setupot vagy vársz a következő gyertyára.'
          },
        ],
      },
      {
        id: 'execution',
        title: 'Belépés, Kockázat & Dokumentáció',
        kicker: 'Végrehajtás',
        rules: [
          {
            id: 'p3r1',
            label: 'M1/M5 belépési jel megvan',
            description: 'M15 displacement után váltasz M5-re (DAX, US100) vagy M1-re (EUR/USD, GBP/USD, XAU/USD). Várod az első kis pullbacket, majd stop orderrel lépsz be a pullback lokális szélsőértékének törésénél. Nem piac áron — stop order, hogy a mozgás aktiválja a belépést.'
          },
          {
            id: 'p3r2',
            label: 'Kockázatkezelés ellenőrizve',
            description: 'SL: a sweep végpontja mögé, nem kerek számhoz. TP: minimum 1:1 R:R, ideális 1:2. Lot méret: max a tőke 1%-a kockáztatva (FTMO fix szabály). Ha a kalkulált lot méret irreálisan kicsi → elengeded a setupot.'
          },
          {
            id: 'p3r3',
            label: 'Trade rögzítve',
            description: 'ZynTrade-ben: instrument, irány, entry, SL, TP, M15 screenshot a setup pillanatában. Checklist run mentve. Ha nem rögzíted → nem tudod visszanézni mi működött.'
          },
        ],
      },
    ],
  },
  alping: {
    id: 'alping',
    name: 'Alping (Szint Manipuláció / Kitörés)',
    instruments: ['DAX', 'NAS100'],
    sections: [
      {
        id: 'premarket',
        title: 'Piac-nyitás Előtti Előkészítés',
        kicker: 'Van egyáltalán ma kereskedés?',
        rules: [
          {
            id: 'a1',
            label: 'Instrumentum és szezon egyeztetve',
            description: 'Délelőtt (piacnyitás 09:00 magyar idő) DAX, délután (piacnyitás 15:30 nyári / 16:30 téli) NAS100. Csak az adott szezon instrumentumán kereskedsz, nem ugrasz át a másikra menet közben.'
          },
          {
            id: 'a2',
            label: 'Előző 2 nap szintjei bejelölve',
            description: 'LOW szint = a legalacsonyabb gyertyatest teteje, HIGH szint = a legmagasabb gyertyatest alja, mindkettő az előző 2 kereskedési napról. Ellenőrzöd, hogy a szint többször tesztelt likviditási zóna-e.'
          },
          {
            id: 'a3',
            label: 'H1 trend egyértelmű',
            description: 'Csak akkor kereskedsz, ha H1-en tisztán látszik az irány. Ha csapkodás vagy szintek közötti oldalazás van → kihagyod a napot. Ellentrend trade nem létezik ebben a rendszerben.'
          },
          {
            id: 'a4',
            label: 'Megvártad a piacnyitást, nem léptél be azonnal',
            description: 'Piacnyitás után megfigyelsz, nem kapkodsz. Azt nézed, mi történik a közeli szint körül: manipulálja (felhúzza/letöri, majd visszafordul) vagy tisztán áttöri a szintet az ár?'
          },
          {
            id: 'a5',
            label: 'Fordulós alakzat vagy kitörés azonosítva a szint körül',
            description: 'Vagy manipulációs fordulat (fals áttörés majd visszafordulás), vagy heves, egyértelmű kitörés+visszateszt kezd kialakulni — a kettő közül az egyik tisztán, nem félig.'
          },
        ],
      },
      {
        id: 'entry',
        title: 'Belépési Szcenárió',
        kicker: 'Csak az egyik terv teljesülése szükséges',
        exclusive: true,
        rules: [
          {
            id: 'a6',
            label: 'Plan A — Manipulációs Fordulat',
            description: 'Ár átmegy a szinten (fake breakout / stop hunt) → fordulós alakzat kialakul → ár visszatér a szint másik oldalára → ellentétes irányba indul → belépés az alakzat visszatesztjén. Ha bármelyik lépés hiányzik vagy nem tiszta, nem lépsz be ezen a setupon.'
          },
          {
            id: 'a7',
            label: 'Plan B — Kitörés & Visszateszt',
            description: 'Heves, egyértelmű kitörés a szintből (nem lassú, nem habozó) → visszatesztelés kintről → trendirányban folytatódás → belépés a visszateszt megerősítésekor. Ha bármelyik lépés hiányzik, nem lépsz be.'
          },
        ],
      },
      {
        id: 'sizing',
        title: 'Pozícióméretezés & Felvétel',
        kicker: 'Kockázat & Paraméterek',
        rules: [
          {
            id: 'a8',
            label: 'Kockázat meghatározva a setup minősége szerint',
            description: 'Szép, tiszta setup: 1% kockázat. Kevésbé szép / bizonytalanabb setup: 0.5%. Ha nem tudod magabiztosan besorolni → a kisebb kockázatot választod, vagy kihagyod a setupot.'
          },
          {
            id: 'a9',
            label: 'SL és TP a szabály szerint pozicionálva',
            description: 'SL a szint mögé kerül, lehetőleg az EMA 62 fölé vagy alá — oda, ahol a trend egyértelműen elesne és irányt váltana. TP cél kb. 3RR.'
          },
        ],
      },
      {
        id: 'exit',
        title: 'Exit Stratégia',
        kicker: 'Pozíciókezelés & Kilépés',
        rules: [
          {
            id: 'a10',
            label: 'Pozíciókezelés — Breakeven & Trailing',
            description: '+1.5RR elérésekor SL Breakevenbe kerül, onnantól nulla kockázat. Ha van húzható trendvonal, SL-t mellé húzod és törésnél lépsz ki; ha nincs, trailing SL piaci ritmus szerint. Opció: a pozíció felét +1.5RR-nél kiveheted, a másik felét bent hagyva.'
          },
          {
            id: 'a11',
            label: 'Kilépési feltételek ismertek',
            description: 'Kilépsz, ha: a trailing SL a ~3RR körüli profitszinten aktiválódik, a trendvonal törik, vagy a következő nagy szintnél az ár megtorpan.'
          },
        ],
      },
      {
        id: 'mental',
        title: 'Mentális Fegyelem',
        kicker: 'Kötelező — nincs kompromisszum',
        critical: true,
        rules: [
          {
            id: 'a12',
            label: 'Fegyelem — nulla kivétel',
            description: 'TILOS az SL-t +1R nyereségbe húzni félelemből — az oldalazás vagy visszahúzódás az SL közelébe NORMÁLIS, nem reagálsz rá. Soha nem ülsz bele veszteségbe, és soha nem mozgatod az SL-t távolabb a belépési iránytól. A döntés mindig bináris: Breakeven marad VAGY trendvonal szerint trailelsz — nincs harmadik út. Inkább egy nullás trade, mint egy elvágott TP: a +1R-nél lezárt nyereség gyakran egy nagy trade elvesztését jelenti.'
          },
        ],
      },
    ],
  },
}

// ─── Presentational helpers ──────────────────────────────────────────────────

function StatusBadge({ ok }) {
  return (
    <div
      style={{
        background: ok ? 'rgba(16,185,129,0.10)' : 'rgba(248,113,113,0.08)',
        border: '1px solid ' + (ok ? 'rgba(16,185,129,0.5)' : 'rgba(248,113,113,0.35)'),
        borderRadius: 6,
        padding: '9px 20px',
        color: ok ? EMERALD : CRIMSON,
        fontWeight: 800,
        fontSize: 12,
        letterSpacing: 1,
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
      }}
    >
      {ok ? 'Mehet' : 'Nem mehet'}
    </div>
  )
}

function RuleRow({ rule, isChecked, onToggle, emphasized }) {
  const boxSize = emphasized ? 24 : 20
  return (
    <div
      onClick={onToggle}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: emphasized ? 16 : 14,
        padding: emphasized ? '16px 18px' : '12px 14px',
        borderRadius: 8,
        background: isChecked ? 'rgba(16,185,129,0.07)' : 'rgba(255,255,255,0.02)',
        border: '1px solid',
        borderColor: isChecked ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.06)',
        cursor: 'pointer',
        transition: 'all 0.15s',
      }}
    >
      <div
        style={{
          width: boxSize,
          height: boxSize,
          borderRadius: 5,
          border: '2px solid',
          borderColor: isChecked ? EMERALD : 'rgba(255,255,255,0.2)',
          background: isChecked ? EMERALD : 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          marginTop: 1,
          transition: 'all 0.15s',
        }}
      >
        {isChecked && <Check size={emphasized ? 15 : 13} color="white" strokeWidth={3} />}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <span
          style={{
            color: isChecked ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.5)',
            fontSize: emphasized ? 17 : 14,
            fontWeight: 700,
            lineHeight: 1.5,
          }}
        >
          {rule.label}
        </span>
        <p style={{ color: 'rgba(255,255,255,0.32)', fontSize: emphasized ? 13 : 12, lineHeight: 1.55, marginTop: 4 }}>
          {rule.description}
        </p>
      </div>
    </div>
  )
}

function OrDivider() {
  const label = (
    <span style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.28)', letterSpacing: 1.5, whiteSpace: 'nowrap' }}>
      VAGY
    </span>
  )
  return (
    <>
      {/* Keskeny nézetben (mobil, egy oszlop) vízszintes elválasztó a két út között */}
      <div className="flex md:hidden items-center gap-3">
        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
        {label}
        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
      </div>
      {/* Széles nézetben a két út egymás mellett fut, közte függőleges elválasztó */}
      <div className="hidden md:flex flex-col items-center gap-3 h-full">
        <div style={{ flex: 1, width: 1, background: 'rgba(255,255,255,0.08)' }} />
        {label}
        <div style={{ flex: 1, width: 1, background: 'rgba(255,255,255,0.08)' }} />
      </div>
    </>
  )
}

function SectionBlock({ section, checked, onToggle }) {
  const complete = section.exclusive
    ? section.rules.some(r => checked[r.id])
    : section.rules.every(r => checked[r.id])
  const critical = section.critical
  const emphasized = section.exclusive

  // Sima szekcióknak nincs saját keretük — csak a kicker/cím és a térköz különíti el őket.
  // A Belépési Szcenárió és a Mentális Fegyelem kap teljes keretet, hogy kiemelkedjen a listából.
  const boxStyle = critical
    ? { border: '1px solid rgba(245,158,11,0.35)', background: 'rgba(245,158,11,0.06)', borderRadius: 12, padding: '22px 24px' }
    : emphasized
      ? { border: '1px solid rgba(201,169,97,0.35)', background: 'rgba(201,169,97,0.05)', borderRadius: 12, padding: '24px 26px' }
      : {}

  return (
    <div style={boxStyle}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, marginBottom: emphasized ? 18 : 14 }}>
        <div>
          <p
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              textTransform: 'uppercase',
              letterSpacing: 1.5,
              fontSize: critical ? 11.5 : emphasized ? 12 : 10.5,
              fontWeight: 800,
              color: critical ? AMBER : GOLD,
              marginBottom: 4,
            }}
          >
            {critical && <ShieldAlert size={13} />}
            {section.kicker}
          </p>
          <h3 style={{ fontSize: critical ? 17 : emphasized ? 20 : 16, fontWeight: 800, color: 'white', letterSpacing: -0.2 }}>
            {section.title}
          </h3>
        </div>
        {complete && (
          <span style={{ fontSize: 11, fontWeight: 800, color: EMERALD, textTransform: 'uppercase', letterSpacing: 0.5, whiteSpace: 'nowrap' }}>
            ✓ Teljesítve
          </span>
        )}
      </div>

      {section.exclusive ? (
        // Alternatív tervek (VAGY reláció) — széles nézetben egymás mellett, függőleges elválasztóval
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 md:gap-6 items-stretch">
          <RuleRow rule={section.rules[0]} isChecked={!!checked[section.rules[0].id]} onToggle={() => onToggle(section.rules[0].id)} emphasized />
          <OrDivider />
          <RuleRow rule={section.rules[1]} isChecked={!!checked[section.rules[1].id]} onToggle={() => onToggle(section.rules[1].id)} emphasized />
        </div>
      ) : section.rules.length > 1 ? (
        // Több tétel esetén két oszlopban töltjük ki a rendelkezésre álló helyet
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {section.rules.map(rule => (
            <RuleRow key={rule.id} rule={rule} isChecked={!!checked[rule.id]} onToggle={() => onToggle(rule.id)} />
          ))}
        </div>
      ) : (
        // Egyetlen, kiemelt tétel (pl. mentális fegyelem) — teljes szélességben
        <div className="space-y-2">
          {section.rules.map(rule => (
            <RuleRow key={rule.id} rule={rule} isChecked={!!checked[rule.id]} onToggle={() => onToggle(rule.id)} />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function StrategyChecklist() {
  const [strategyId, setStrategyId] = useState('liquiditySweep')
  const [checked, setChecked] = useState({})
  const [instrument, setInstrument] = useState(STRATEGIES.liquiditySweep.instruments[0])

  const strategy = STRATEGIES[strategyId]
  const INSTRUMENTS = strategy.instruments

  const reset = () => setChecked({})

  useEffect(() => { reset() }, [instrument, strategyId])

  // Stratégiaváltáskor, ha az aktuális instrumentum nem létezik az új stratégiában, visszaállunk az elsőre.
  const selectStrategy = (id) => {
    setStrategyId(id)
    if (!STRATEGIES[id].instruments.includes(instrument)) {
      setInstrument(STRATEGIES[id].instruments[0])
    }
  }

  const toggle = (id) => setChecked(prev => ({ ...prev, [id]: !prev[id] }))

  const allChecked = strategy.sections.every(section =>
    section.exclusive ? section.rules.some(r => checked[r.id]) : section.rules.every(r => checked[r.id])
  )

  return (
    <div className="w-full max-w-7xl mx-auto px-6 lg:px-10 py-10">
      <div className="glass-card p-8 lg:p-12 space-y-8" style={{ borderTop: '2px solid rgba(201,169,97,0.45)' }}>

        {/* Eyebrow + Header */}
        <div>
          <p style={{ textTransform: 'uppercase', letterSpacing: 2, fontSize: 11, color: GOLD, fontWeight: 800 }}>
            Trading Desk Protokoll
          </p>
          <div className="flex items-end justify-between gap-4" style={{ marginTop: 6 }}>
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: 'white', letterSpacing: -0.3 }}>
                Pre-Trade Ellenőrzőlista
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, marginTop: 4 }}>
                Minden szakasz teljesítve? → A pozíció felvehető.
              </p>
            </div>
            <StatusBadge ok={allChecked} />
          </div>
        </div>

        {/* Strategy selector — segmented tabs */}
        <div>
          <p style={{ textTransform: 'uppercase', letterSpacing: 1.5, fontSize: 10.5, color: 'rgba(255,255,255,0.35)', fontWeight: 700, marginBottom: 10 }}>
            Stratégia
          </p>
          <div style={{ display: 'flex', gap: 24, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            {Object.values(STRATEGIES).map(s => (
              <button
                key={s.id}
                onClick={() => selectStrategy(s.id)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  borderBottom: '2px solid ' + (strategyId === s.id ? GOLD : 'transparent'),
                  padding: '0 0 10px 0',
                  color: strategyId === s.id ? 'white' : 'rgba(255,255,255,0.4)',
                  fontWeight: strategyId === s.id ? 700 : 500,
                  fontSize: 13,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>

        {/* Instrument */}
        <div className="space-y-2">
          <p style={{ textTransform: 'uppercase', letterSpacing: 1.5, fontSize: 10.5, color: 'rgba(255,255,255,0.35)', fontWeight: 700 }}>
            Instrumentum
          </p>
          <div className="flex flex-wrap gap-2">
            {INSTRUMENTS.map(inst => (
              <button
                key={inst}
                onClick={() => setInstrument(inst)}
                style={{
                  background: instrument === inst ? 'rgba(201,169,97,0.16)' : 'rgba(255,255,255,0.04)',
                  border: '1px solid',
                  borderColor: instrument === inst ? GOLD : 'rgba(255,255,255,0.1)',
                  borderRadius: 6,
                  padding: '6px 14px',
                  color: instrument === inst ? GOLD : 'rgba(255,255,255,0.6)',
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

        {/* Sections */}
        <div className="space-y-8">
          {strategy.sections.map(section => (
            <SectionBlock key={section.id} section={section} checked={checked} onToggle={toggle} />
          ))}
        </div>

        {/* Reset */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 16 }}>
          <button
            onClick={reset}
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 6,
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
