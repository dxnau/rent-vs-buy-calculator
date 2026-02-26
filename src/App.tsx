import React, { useState, useMemo, useEffect } from 'react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import { calculate, formatCurrency, formatCurrencyFull, type Inputs } from './calculator'
import InputSlider from './components/InputSlider'

// U.S. national averages — 2024–2025
// Sources: NAR, Freddie Mac, Zillow, Insurance.com, Tax Foundation
const DEFAULT_INPUTS: Inputs = {
  homePrice: 420000,
  downPaymentPct: 13,
  mortgageRate: 6.9,
  loanTermYears: 30,
  propertyTaxRate: 1.1,
  homeInsurance: 2200,
  maintenancePct: 1,
  hoaMonthly: 0,
  homeAppreciation: 4.0,
  monthlyRent: 1850,
  rentIncrease: 3.5,
  investmentReturn: 7,
  yearsToAnalyze: 10,
}

function useIsMobile() {
  const [mobile, setMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  )
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const handler = (e: MediaQueryListEvent) => setMobile(e.matches)
    mq.addEventListener('change', handler)
    setMobile(mq.matches)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return mobile
}

function Section({ title, children, color = 'var(--blue-500)' }: { title: string; children: React.ReactNode; color?: string }) {
  return (
    <div style={{ marginBottom: '28px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <div style={{ width: '2px', height: '12px', background: color, borderRadius: '2px' }} />
        <h3 style={{
          fontSize: '10px',
          fontWeight: 600,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
        }}>{title}</h3>
      </div>
      {children}
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'var(--surface-2)',
        border: '1px solid var(--border-hover)',
        borderRadius: 'var(--radius-md)',
        padding: '12px 16px',
        boxShadow: 'var(--shadow-card)',
      }}>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>Year {label}</p>
        {payload.map((p: any) => (
          <div key={p.dataKey} style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: p.color }} />
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{p.name}:</span>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
              {formatCurrencyFull(p.value)}
            </span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

function InfoIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor" style={{ flexShrink: 0 }}>
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
    </svg>
  )
}

export default function App() {
  const [inputs, setInputs] = useState<Inputs>(() => {
    try {
      const saved = localStorage.getItem('rvb-inputs')
      return saved ? { ...DEFAULT_INPUTS, ...JSON.parse(saved) } : DEFAULT_INPUTS
    } catch {
      return DEFAULT_INPUTS
    }
  })
  const [activeTab, setActiveTab] = useState<'networth' | 'costs'>('networth')
  const [showInfo, setShowInfo] = useState(false)
  const [mobileTab, setMobileTab] = useState<'results' | 'inputs'>('results')
  const isMobile = useIsMobile()

  useEffect(() => {
    localStorage.setItem('rvb-inputs', JSON.stringify(inputs))
  }, [inputs])

  const set = (key: keyof Inputs) => (v: number) =>
    setInputs((prev) => ({ ...prev, [key]: v }))

  const reset = () => {
    setInputs(DEFAULT_INPUTS)
    localStorage.removeItem('rvb-inputs')
  }

  const result = useMemo(() => calculate(inputs), [inputs])

  const chartData = result.yearlyData.map((d) => ({
    year: d.year,
    'Buy Net Worth': Math.round(d.buyNetWorth),
    'Rent Net Worth': Math.round(d.rentNetWorth),
    'Unrecoverable (Buy)': Math.round(d.cumulativeTrueBuyCost),
    'Rent Paid': Math.round(d.cumulativeRentCost),
  }))

  const isBuyBetter = result.recommendation === 'buy'
  const netWorthDiff = Math.abs(result.buyNetWorthFinal - result.rentNetWorthFinal)

  // ── Shared content blocks ────────────────────────────────────────────────

  const verdictBanner = (
    <div style={{
      background: 'linear-gradient(135deg, rgba(48,209,88,0.10), rgba(48,209,88,0.03))',
      border: '1px solid rgba(48,209,88,0.25)',
      borderRadius: 'var(--radius-xl)',
      padding: isMobile ? '16px 18px' : '22px 28px',
      marginBottom: isMobile ? '0' : '36px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: '12px',
      animation: 'fadeIn 0.4s ease forwards',
    }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
          <span style={{ fontSize: isMobile ? '18px' : '22px' }}>{isBuyBetter ? '🏠' : '🔑'}</span>
          <h2 style={{
            fontSize: isMobile ? '17px' : '20px',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: 'var(--green-400)',
          }}>
            {isBuyBetter ? 'Buying looks better' : 'Renting looks better'}
          </h2>
        </div>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', letterSpacing: '-0.01em' }}>
          {isBuyBetter
            ? `Buying builds ${formatCurrency(netWorthDiff)} more net worth over ${inputs.yearsToAnalyze} years`
            : `Renting leaves you ${formatCurrency(netWorthDiff)} better off over ${inputs.yearsToAnalyze} years`}
        </p>
      </div>
      {result.breakevenYear && (
        <div style={{
          background: 'rgba(255,255,255,0.05)',
          borderRadius: 'var(--radius-md)',
          padding: '8px 16px',
          textAlign: 'center',
          flexShrink: 0,
        }}>
          <div style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>
            Yr {result.breakevenYear}
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Breakeven
          </div>
        </div>
      )}
    </div>
  )

  const costCards = (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
      {[
        { label: 'Monthly Buying Cost', value: result.monthlyBuyTotal, sub: `${formatCurrencyFull(result.monthlyMortgage)} P&I`, color: 'var(--orange-500)', icon: '🏠' },
        { label: 'Monthly Rent', value: result.monthlyRentTotal, sub: 'Current monthly', color: 'var(--amber-500)', icon: '🔑' },
      ].map((card) => (
        <div key={card.label} style={{
          background: 'var(--surface-1)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: isMobile ? '16px' : '22px',
          boxShadow: 'var(--shadow-card)',
        }}>
          <div style={{ fontSize: '16px', marginBottom: '6px' }}>{card.icon}</div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '5px' }}>
            {card.label}
          </div>
          <div style={{ fontSize: isMobile ? '24px' : '30px', fontWeight: 700, letterSpacing: '-0.03em', color: card.color, lineHeight: 1, marginBottom: '5px' }}>
            {formatCurrencyFull(card.value)}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{card.sub}</div>
        </div>
      ))}
    </div>
  )

  const netWorthCards = (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
      {[
        { label: `Buy Net Worth (Yr ${inputs.yearsToAnalyze})`, value: result.buyNetWorthFinal, sub: 'Home equity after selling costs', better: isBuyBetter, icon: '🏠' },
        { label: `Rent Net Worth (Yr ${inputs.yearsToAnalyze})`, value: result.rentNetWorthFinal, sub: 'Invested down payment + savings', better: !isBuyBetter, icon: '📈' },
      ].map((card) => (
        <div key={card.label} style={{
          background: card.better ? 'linear-gradient(135deg, rgba(48,209,88,0.08), var(--surface-1))' : 'var(--surface-1)',
          border: `1px solid ${card.better ? 'rgba(48,209,88,0.28)' : 'var(--border)'}`,
          borderRadius: 'var(--radius-lg)',
          padding: isMobile ? '16px' : '22px',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-card)',
        }}>
          {card.better && (
            <div style={{
              position: 'absolute', top: '10px', right: '10px',
              fontSize: '9px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase',
              color: 'var(--green-500)', background: 'rgba(48,209,88,0.12)',
              padding: '3px 7px', borderRadius: '20px',
            }}>
              Better
            </div>
          )}
          <div style={{ fontSize: '16px', marginBottom: '6px' }}>{card.icon}</div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '5px' }}>
            {card.label}
          </div>
          <div style={{ fontSize: isMobile ? '22px' : '30px', fontWeight: 700, letterSpacing: '-0.03em', color: card.better ? 'var(--green-400)' : 'var(--text-secondary)', lineHeight: 1, marginBottom: '5px' }}>
            {formatCurrency(card.value)}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{card.sub}</div>
        </div>
      ))}
    </div>
  )

  const chart = (
    <div style={{
      background: 'var(--surface-1)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-xl)',
      padding: isMobile ? '16px' : '24px',
      boxShadow: 'var(--shadow-card)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <h3 style={{ fontSize: isMobile ? '15px' : '18px', fontWeight: 600, letterSpacing: '-0.02em' }}>
          {activeTab === 'networth' ? 'Net Worth Over Time' : 'True Costs Over Time'}
        </h3>
        <div style={{ display: 'flex', gap: '6px' }}>
          {(['networth', 'costs'] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              padding: isMobile ? '5px 10px' : '6px 14px',
              borderRadius: '20px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '11px',
              fontWeight: 500,
              background: activeTab === tab ? 'var(--blue-500)' : 'var(--surface-3)',
              color: activeTab === tab ? '#000000' : 'var(--text-secondary)',
              transition: 'all 0.2s ease',
              letterSpacing: '-0.01em',
            }}>
              {tab === 'networth' ? 'Net Worth' : 'True Costs'}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={isMobile ? 220 : 300}>
        <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id="buyGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ff9f0a" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#ff9f0a" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="rentGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#5ac8fa" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#5ac8fa" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="year" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => `Yr ${v}`} />
          <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => formatCurrency(v)} width={isMobile ? 58 : 70} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: '11px', color: 'var(--text-secondary)', paddingTop: '12px' }} iconType="circle" iconSize={7} />
          {activeTab === 'networth' ? (
            <>
              <Area type="monotone" dataKey="Buy Net Worth" stroke="#ff9f0a" strokeWidth={2} fill="url(#buyGrad)" dot={false} />
              <Area type="monotone" dataKey="Rent Net Worth" stroke="#5ac8fa" strokeWidth={2} fill="url(#rentGrad)" dot={false} />
            </>
          ) : (
            <>
              <Area type="monotone" dataKey="Unrecoverable (Buy)" stroke="#ff9f0a" strokeWidth={2} fill="url(#buyGrad)" dot={false} />
              <Area type="monotone" dataKey="Rent Paid" stroke="#5ac8fa" strokeWidth={2} fill="url(#rentGrad)" dot={false} />
            </>
          )}
        </AreaChart>
      </ResponsiveContainer>

      {activeTab === 'costs' && (
        <div style={{
          marginTop: '12px',
          padding: '10px 12px',
          background: 'rgba(229,229,234,0.04)',
          border: '1px solid rgba(229,229,234,0.10)',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          gap: '8px',
          alignItems: 'flex-start',
        }}>
          <span style={{ fontSize: '12px', flexShrink: 0 }}>ℹ️</span>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.65, letterSpacing: '-0.01em' }}>
            <strong style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Buying</strong> shows only unrecoverable expenses — interest, taxes, insurance, and maintenance. Principal payments are excluded because they build equity you get back when you sell. <strong style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Renting</strong> shows all rent paid, which is fully unrecoverable. The <strong style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Net Worth</strong> view accounts for equity and invested savings for a complete comparison.
          </p>
        </div>
      )}
    </div>
  )

  const costBreakdown = (
    <div style={{
      background: 'var(--surface-1)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-xl)',
      padding: isMobile ? '16px' : '24px',
      boxShadow: 'var(--shadow-card)',
    }}>
      <h3 style={{ fontSize: isMobile ? '15px' : '18px', fontWeight: 600, letterSpacing: '-0.02em', marginBottom: '16px' }}>
        Monthly Cost Breakdown (Buying)
      </h3>
      {[
        { label: 'Principal & Interest', value: result.monthlyMortgage, pct: result.monthlyMortgage / result.monthlyBuyTotal },
        { label: 'Property Tax', value: (inputs.homePrice * inputs.propertyTaxRate / 100) / 12, pct: (inputs.homePrice * inputs.propertyTaxRate / 100) / 12 / result.monthlyBuyTotal },
        { label: 'Insurance', value: inputs.homeInsurance / 12, pct: (inputs.homeInsurance / 12) / result.monthlyBuyTotal },
        { label: 'Maintenance', value: (inputs.homePrice * inputs.maintenancePct / 100) / 12, pct: (inputs.homePrice * inputs.maintenancePct / 100) / 12 / result.monthlyBuyTotal },
        ...(inputs.hoaMonthly > 0 ? [{ label: 'HOA', value: inputs.hoaMonthly, pct: inputs.hoaMonthly / result.monthlyBuyTotal }] : []),
      ].map((item) => (
        <div key={item.label} style={{ marginBottom: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', letterSpacing: '-0.01em' }}>{item.label}</span>
            <span style={{ fontSize: '13px', fontWeight: 500 }}>{formatCurrencyFull(item.value)}/mo</span>
          </div>
          <div style={{ height: '3px', background: 'var(--surface-3)', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ width: `${item.pct * 100}%`, height: '100%', background: 'var(--blue-500)', borderRadius: '2px', transition: 'width 0.4s ease' }} />
          </div>
        </div>
      ))}
    </div>
  )

  const disclaimer = (
    <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.7, padding: '0 4px', letterSpacing: '-0.01em' }}>
      This calculator provides estimates for educational purposes only. It does not account for closing costs, PMI (if down payment &lt; 20%), tax deductions, local market conditions, or other factors. Consult a licensed mortgage professional before making financial decisions.
    </p>
  )

  const inputsContent = (
    <>
      {/* Info button + Reset */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button
            onClick={() => setShowInfo(v => !v)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              color: 'var(--blue-500)',
              fontSize: '12px',
              letterSpacing: '-0.01em',
            }}
          >
            <InfoIcon />
            Using U.S. national averages
          </button>
          <button
            onClick={reset}
            style={{
              background: 'none',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              padding: '4px 10px',
              color: 'var(--text-muted)',
              fontSize: '11px',
              letterSpacing: '-0.01em',
              transition: 'border-color 0.15s ease, color 0.15s ease',
            }}
            onMouseEnter={e => { (e.target as HTMLButtonElement).style.color = 'var(--text-secondary)'; (e.target as HTMLButtonElement).style.borderColor = 'var(--border-hover)' }}
            onMouseLeave={e => { (e.target as HTMLButtonElement).style.color = 'var(--text-muted)'; (e.target as HTMLButtonElement).style.borderColor = 'var(--border)' }}
          >
            Reset
          </button>
        </div>
        {showInfo && (
          <div style={{
            marginTop: '10px',
            padding: '12px 14px',
            background: 'rgba(229,229,234,0.05)',
            border: '1px solid rgba(229,229,234,0.15)',
            borderRadius: 'var(--radius-md)',
            animation: 'fadeIn 0.2s ease',
          }}>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.65, letterSpacing: '-0.01em' }}>
              Default values reflect current U.S. national averages (2024–2025): median home price $420K and average down payment 13% per NAR; 30-yr fixed mortgage rate 6.9% per Freddie Mac; median monthly rent $1,850 per Zillow; homeowners insurance $2,200/yr per Insurance.com; 1.1% property tax per Tax Foundation. Actual figures vary significantly by market.
            </p>
          </div>
        )}
      </div>

      <Section title="Home Details" color="var(--orange-500)">
        <InputSlider label="Home Price" value={inputs.homePrice} min={100000} max={2000000} step={5000} format={(v) => formatCurrency(v)} onChange={set('homePrice')} />
        <InputSlider label="Down Payment" value={inputs.downPaymentPct} min={3} max={50} step={0.5} format={(v) => `${v}% · ${formatCurrency(inputs.homePrice * v / 100)}`} onChange={set('downPaymentPct')} />
        <InputSlider label="Mortgage Rate" value={inputs.mortgageRate} min={2} max={12} step={0.05} format={(v) => `${v.toFixed(2)}%`} onChange={set('mortgageRate')} />
        <InputSlider label="Loan Term" value={inputs.loanTermYears} min={10} max={30} step={5} format={(v) => `${v} yrs`} onChange={set('loanTermYears')} />
      </Section>

      <Section title="Ongoing Costs" color="var(--orange-500)">
        <InputSlider label="Property Tax Rate" value={inputs.propertyTaxRate} min={0.3} max={3.5} step={0.05} format={(v) => `${v.toFixed(2)}%/yr`} onChange={set('propertyTaxRate')} />
        <InputSlider label="Home Insurance" value={inputs.homeInsurance} min={500} max={5000} step={100} format={(v) => `${formatCurrency(v)}/yr`} onChange={set('homeInsurance')} />
        <InputSlider label="Maintenance" value={inputs.maintenancePct} min={0.5} max={3} step={0.1} format={(v) => `${v.toFixed(1)}%/yr`} onChange={set('maintenancePct')} hint="Annual maintenance as % of home value" />
        <InputSlider label="HOA Fees" value={inputs.hoaMonthly} min={0} max={1000} step={25} format={(v) => v === 0 ? 'None' : `${formatCurrency(v)}/mo`} onChange={set('hoaMonthly')} />
      </Section>

      <Section title="Renting" color="var(--amber-500)">
        <InputSlider label="Monthly Rent" value={inputs.monthlyRent} min={500} max={10000} step={50} format={(v) => `${formatCurrency(v)}/mo`} onChange={set('monthlyRent')} />
        <InputSlider label="Annual Rent Increase" value={inputs.rentIncrease} min={0} max={10} step={0.25} format={(v) => `${v.toFixed(2)}%/yr`} onChange={set('rentIncrease')} />
      </Section>

      <Section title="Assumptions">
        <InputSlider label="Home Appreciation" value={inputs.homeAppreciation} min={0} max={8} step={0.25} format={(v) => `${v.toFixed(2)}%/yr`} onChange={set('homeAppreciation')} />
        <InputSlider label="Investment Return" value={inputs.investmentReturn} min={2} max={12} step={0.25} format={(v) => `${v.toFixed(2)}%/yr`} onChange={set('investmentReturn')} hint="If renting, down payment is invested here" />
        <InputSlider label="Years to Analyze" value={inputs.yearsToAnalyze} min={1} max={30} step={1} format={(v) => `${v} yrs`} onChange={set('yearsToAnalyze')} />
      </Section>
    </>
  )

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: '100vh', background: '#000000' }}>
      {/* Header */}
      <header style={{
        borderBottom: '1px solid var(--border)',
        background: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          height: isMobile ? '52px' : '60px',
          padding: isMobile ? '0 16px' : '0 40px',
          justifyContent: 'space-between',
        }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '28px', height: '28px',
              background: 'linear-gradient(135deg, var(--blue-600), var(--blue-500))',
              borderRadius: '8px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '14px',
            }}>🏠</div>
            <span style={{ fontSize: isMobile ? '15px' : '17px', fontWeight: 600, letterSpacing: '-0.02em' }}>
              Rent <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>vs</span> Buy
            </span>
          </div>

          {/* Desktop subtitle / Mobile verdict chip */}
          {isMobile ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              background: 'rgba(48,209,88,0.10)',
              border: '1px solid rgba(48,209,88,0.25)',
              borderRadius: '20px',
              padding: '4px 10px',
            }}>
              <span style={{ fontSize: '12px' }}>{isBuyBetter ? '🏠' : '🔑'}</span>
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--green-400)', letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>
                {isBuyBetter ? 'Buy' : 'Rent'} · {formatCurrency(netWorthDiff)} ahead
              </span>
            </div>
          ) : (
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', letterSpacing: '-0.01em' }}>
              Make the right call for your situation
            </p>
          )}
        </div>

        {/* Mobile tab bar */}
        {isMobile && (
          <div style={{ display: 'flex', borderTop: '1px solid var(--border)' }}>
            {(['results', 'inputs'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setMobileTab(tab)}
                style={{
                  flex: 1,
                  height: '42px',
                  background: 'none',
                  border: 'none',
                  borderBottom: `2px solid ${mobileTab === tab ? 'var(--green-500)' : 'transparent'}`,
                  color: mobileTab === tab ? 'var(--text-primary)' : 'var(--text-muted)',
                  fontSize: '13px',
                  fontWeight: mobileTab === tab ? 600 : 400,
                  cursor: 'pointer',
                  letterSpacing: '-0.01em',
                  transition: 'color 0.2s ease, border-color 0.2s ease',
                }}
              >
                {tab === 'results' ? 'Results' : 'Inputs'}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* ── Mobile layout ── */}
      {isMobile ? (
        <main style={{ padding: '16px 16px 48px' }}>
          {mobileTab === 'results' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {verdictBanner}
              {costCards}
              {netWorthCards}
              {chart}
              {costBreakdown}
              {/* CTA to inputs */}
              <button
                onClick={() => { setMobileTab('inputs'); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                style={{
                  width: '100%',
                  padding: '14px',
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)',
                  color: 'var(--text-secondary)',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  letterSpacing: '-0.01em',
                }}
              >
                ⚙️  Adjust inputs
              </button>
              {disclaimer}
            </div>
          ) : (
            <div>
              <div style={{
                background: 'var(--surface-1)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-xl)',
                padding: '20px',
                marginBottom: '12px',
                boxShadow: 'var(--shadow-card)',
              }}>
                {inputsContent}
              </div>
              {/* CTA to results */}
              <button
                onClick={() => { setMobileTab('results'); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                style={{
                  width: '100%',
                  padding: '14px',
                  background: 'var(--green-500)',
                  border: 'none',
                  borderRadius: 'var(--radius-lg)',
                  color: '#000000',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  letterSpacing: '-0.01em',
                }}
              >
                View Results →
              </button>
            </div>
          )}
        </main>
      ) : (

        /* ── Desktop layout ── */
        <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '48px 40px 80px' }}>
          {/* Hero */}
          <div style={{
            textAlign: 'center',
            marginBottom: '48px',
            animation: 'fadeInUp 0.6s ease forwards',
          }}>
            <h1 style={{
              fontSize: 'clamp(36px, 5vw, 56px)',
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: '-0.04em',
              marginBottom: '14px',
              background: 'linear-gradient(to right, var(--text-primary) 50%, var(--blue-400))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              Should you rent or buy?
            </h1>
            <p style={{ fontSize: '16px', color: 'var(--text-secondary)', maxWidth: '480px', margin: '0 auto', letterSpacing: '-0.01em' }}>
              Adjust the numbers below and get a clear answer based on your actual situation.
            </p>
          </div>

          {verdictBanner}

          {/* Main Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(300px, 380px) 1fr',
            gap: '20px',
            alignItems: 'start',
          }}>
            {/* Left: Inputs */}
            <div style={{
              background: 'var(--surface-1)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-xl)',
              padding: '24px',
              position: 'sticky',
              top: '80px',
              boxShadow: 'var(--shadow-card)',
            }}>
              {inputsContent}
            </div>

            {/* Right: Results */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {costCards}
              {netWorthCards}
              {chart}
              {costBreakdown}
              {disclaimer}
            </div>
          </div>
        </main>
      )}
    </div>
  )
}
