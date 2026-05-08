import { type FireProjectionResult } from 'types/wealth'

const currentYear = new Date().getFullYear()

export const MOCK_FIRE_PROJECTION_RESULT: FireProjectionResult = {
  netWorth: 50000,
  fireTarget: 600000,
  yearsToFire: 22,
  projectionPoints: Array.from({ length: 27 }, (_, index) => {
    const yearIndex = index + 1
    const netWorth = Math.round(50000 * Math.pow(1.07, yearIndex) + 6000 * ((Math.pow(1.07, yearIndex) - 1) / 0.07))
    const contributions = 6000 * yearIndex
    const interest = netWorth - 50000 - contributions
    const isFireReached = netWorth >= 600000

    return {
      year: currentYear + yearIndex,
      netWorth,
      contributions,
      interest,
      fireTarget: 600000,
      isFireReached
    }
  })
}
