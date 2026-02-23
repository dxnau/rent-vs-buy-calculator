export interface Inputs {
  homePrice: number
  downPaymentPct: number
  mortgageRate: number
  loanTermYears: number
  propertyTaxRate: number
  homeInsurance: number
  maintenancePct: number
  hoaMonthly: number
  homeAppreciation: number
  monthlyRent: number
  rentIncrease: number
  investmentReturn: number
  yearsToAnalyze: number
}

export interface YearlySnapshot {
  year: number
  cumulativeBuyCost: number
  cumulativeRentCost: number
  cumulativeTrueBuyCost: number  // interest + tax + insurance + maintenance + HOA only (excludes principal)
  buyNetWorth: number
  rentNetWorth: number
}

export interface CalculationResult {
  monthlyMortgage: number
  monthlyBuyTotal: number
  monthlyRentTotal: number
  breakevenYear: number | null
  yearlyData: YearlySnapshot[]
  totalBuyCost: number
  totalRentCost: number
  buyNetWorthFinal: number
  rentNetWorthFinal: number
  recommendation: 'buy' | 'rent' | 'neutral'
  downPayment: number
}

export function calculate(inputs: Inputs): CalculationResult {
  const {
    homePrice,
    downPaymentPct,
    mortgageRate,
    loanTermYears,
    propertyTaxRate,
    homeInsurance,
    maintenancePct,
    hoaMonthly,
    homeAppreciation,
    monthlyRent,
    rentIncrease,
    investmentReturn,
    yearsToAnalyze,
  } = inputs

  const downPayment = homePrice * (downPaymentPct / 100)
  const loanAmount = homePrice - downPayment
  const monthlyRate = mortgageRate / 100 / 12
  const numPayments = loanTermYears * 12

  // Monthly mortgage payment (P&I)
  const monthlyMortgage =
    monthlyRate === 0
      ? loanAmount / numPayments
      : (loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments))) /
        (Math.pow(1 + monthlyRate, numPayments) - 1)

  // Initial monthly buy costs
  const monthlyPropertyTax = (homePrice * (propertyTaxRate / 100)) / 12
  const monthlyInsurance = homeInsurance / 12
  const monthlyMaintenance = (homePrice * (maintenancePct / 100)) / 12
  const monthlyBuyTotal = monthlyMortgage + monthlyPropertyTax + monthlyInsurance + monthlyMaintenance + hoaMonthly

  const yearlyData: YearlySnapshot[] = []
  let cumulativeBuyCost = downPayment // Opportunity cost of down payment
  let cumulativeRentCost = 0
  let cumulativeTrueBuyCost = 0  // only unrecoverable spend
  let remainingBalance = loanAmount
  let currentHomeValue = homePrice
  let currentRent = monthlyRent
  let rentSavings = 0 // If renting is cheaper, invest the difference
  let buySavings = 0  // If buying is cheaper, invest the difference

  let breakevenYear: number | null = null

  for (let year = 1; year <= yearsToAnalyze; year++) {
    const annualAppreciation = homeAppreciation / 100
    const annualInvestment = investmentReturn / 100
    const annualRentIncrease = rentIncrease / 100

    // Year's buy costs
    for (let month = 0; month < 12; month++) {
      const interestPayment = remainingBalance * monthlyRate
      const principalPayment = monthlyMortgage - interestPayment
      remainingBalance = Math.max(0, remainingBalance - principalPayment)

      const totalMonthlyBuy =
        monthlyMortgage +
        monthlyPropertyTax +
        monthlyInsurance +
        (currentHomeValue * (maintenancePct / 100)) / 12 +
        hoaMonthly

      const totalMonthlyRent = currentRent

      cumulativeBuyCost += totalMonthlyBuy
      cumulativeRentCost += totalMonthlyRent

      // True cost: only money that won't be recovered (no principal)
      // interestPayment is already computed above before remainingBalance was updated
      const trueMonthlyCost = interestPayment +
        monthlyPropertyTax +
        monthlyInsurance +
        (currentHomeValue * (maintenancePct / 100)) / 12 +
        hoaMonthly
      cumulativeTrueBuyCost += trueMonthlyCost

      // Invest the difference
      const diff = totalMonthlyBuy - totalMonthlyRent
      if (diff > 0) {
        rentSavings += diff * (1 + annualInvestment / 12)
      } else {
        buySavings += (-diff) * (1 + annualInvestment / 12)
      }
    }

    // Grow home value
    currentHomeValue *= 1 + annualAppreciation
    // Grow rent
    currentRent *= 1 + annualRentIncrease

    // Grow investment accounts
    rentSavings *= 1 + annualInvestment
    buySavings *= 1 + annualInvestment

    // Net worth calculations
    const closingCostsSell = currentHomeValue * 0.06 // 6% to sell
    const homeEquity = currentHomeValue - remainingBalance - closingCostsSell
    const buyNetWorth = homeEquity + buySavings - downPayment * Math.pow(1 + annualInvestment, year)
    // Renter invested down payment
    const investedDownPayment = downPayment * Math.pow(1 + annualInvestment, year)
    const rentNetWorth = investedDownPayment + rentSavings - downPayment

    yearlyData.push({
      year,
      cumulativeBuyCost,
      cumulativeRentCost,
      cumulativeTrueBuyCost,
      buyNetWorth: homeEquity,
      rentNetWorth: investedDownPayment + rentSavings,
    })

    if (breakevenYear === null && homeEquity > investedDownPayment + rentSavings) {
      breakevenYear = year
    }
  }

  const finalData = yearlyData[yearlyData.length - 1]
  const buyBetter = finalData.buyNetWorth > finalData.rentNetWorth

  return {
    monthlyMortgage,
    monthlyBuyTotal,
    monthlyRentTotal: monthlyRent,
    breakevenYear,
    yearlyData,
    totalBuyCost: cumulativeBuyCost,
    totalRentCost: cumulativeRentCost,
    buyNetWorthFinal: finalData.buyNetWorth,
    rentNetWorthFinal: finalData.rentNetWorth,
    recommendation: buyBetter ? 'buy' : 'rent',
    downPayment,
  }
}

export function formatCurrency(n: number): string {
  if (Math.abs(n) >= 1_000_000) {
    return `$${(n / 1_000_000).toFixed(2)}M`
  }
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}

export function formatCurrencyFull(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}
