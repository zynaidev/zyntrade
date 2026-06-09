import { motion } from 'framer-motion'

/**
 * Animated SVG circular progress ring
 * @param {number} progress - 0 to 100
 */
export default function ProgressRing({ progress }) {
  const size = 200
  const strokeWidth = 12
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (progress / 100) * circumference

  const isComplete = progress >= 100
  const color = isComplete ? '#22c55e' : progress > 60 ? '#f97316' : '#ef4444'
  const glowColor = isComplete
    ? 'rgba(34,197,94,0.6)'
    : progress > 60
    ? 'rgba(249,115,22,0.6)'
    : 'rgba(239,68,68,0.6)'

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          {/* Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={strokeWidth}
          />
          {/* Progress arc */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            style={{
              filter: `drop-shadow(0 0 8px ${glowColor})`,
            }}
          />
        </svg>

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            key={progress}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-4xl font-black"
            style={{ color }}
          >
            {Math.round(progress)}%
          </motion.span>
          <span className="text-xs text-white/40 font-medium mt-1">Teljesítve</span>
        </div>
      </div>
    </div>
  )
}
