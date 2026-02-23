import React, { useState, useEffect } from 'react'

interface Props {
  label: string
  value: number
  min: number
  max: number
  step: number
  format: (v: number) => string
  onChange: (v: number) => void
  hint?: string
}

export default function InputSlider({ label, value, min, max, step, format, onChange, hint }: Props) {
  const pct = ((value - min) / (max - min)) * 100
  const decimals = (step.toString().split('.')[1] ?? '').length
  const toStr = (v: number) => v.toFixed(decimals)

  const [text, setText] = useState(toStr(value))
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    if (!editing) setText(toStr(value))
  }, [value, editing])

  const commit = (raw: string) => {
    const num = parseFloat(raw.replace(/,/g, ''))
    if (!isNaN(num)) {
      const clamped = Math.min(max, Math.max(min, num))
      const snapped = Math.round(clamped / step) * step
      const result = parseFloat(snapped.toFixed(decimals))
      onChange(result)
      setText(toStr(result))
    } else {
      setText(toStr(value))
    }
  }

  return (
    <div style={{ marginBottom: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '7px', alignItems: 'baseline' }}>
        <label style={{
          fontSize: '12px',
          color: 'var(--text-secondary)',
          fontWeight: 500,
          letterSpacing: '-0.01em',
          fontFamily: 'var(--font-body)',
        }}>
          {label}
        </label>
        <span style={{
          fontSize: '13px',
          fontWeight: 600,
          color: 'var(--blue-500)',
          letterSpacing: '-0.01em',
        }}>
          {format(value)}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          style={{
            flex: 1,
            height: '3px',
            appearance: 'none',
            background: `linear-gradient(to right, var(--blue-500) ${pct}%, var(--surface-3) ${pct}%)`,
            borderRadius: '2px',
            cursor: 'pointer',
            outline: 'none',
          }}
        />
        <input
          type="text"
          inputMode="decimal"
          value={text}
          onFocus={(e) => {
            setEditing(true)
            e.target.select()
          }}
          onChange={(e) => setText(e.target.value)}
          onBlur={() => {
            setEditing(false)
            commit(text)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              commit(text)
              e.currentTarget.blur()
            }
            if (e.key === 'Escape') {
              setText(toStr(value))
              setEditing(false)
              e.currentTarget.blur()
            }
          }}
          className="slider-num-input"
          style={{
            width: '74px',
            padding: '5px 8px',
            background: 'var(--surface-2)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text-primary)',
            fontSize: '12px',
            fontFamily: 'var(--font-body)',
            textAlign: 'right',
            outline: 'none',
            transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
            letterSpacing: '-0.01em',
          }}
        />
      </div>
      {hint && (
        <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '5px', letterSpacing: '-0.01em' }}>{hint}</p>
      )}
      <style>{`
        input[type=range]::-webkit-slider-thumb {
          appearance: none;
          width: 15px;
          height: 15px;
          border-radius: 50%;
          background: var(--blue-500);
          border: 2px solid #000000;
          box-shadow: 0 0 0 0 rgba(229,229,234,0);
          cursor: pointer;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        input[type=range]::-webkit-slider-thumb:hover {
          transform: scale(1.15);
          box-shadow: 0 0 12px rgba(229,229,234,0.3);
        }
        input[type=range]::-moz-range-thumb {
          width: 15px;
          height: 15px;
          border-radius: 50%;
          background: var(--blue-500);
          border: 2px solid #000000;
          cursor: pointer;
        }
      `}</style>
    </div>
  )
}
