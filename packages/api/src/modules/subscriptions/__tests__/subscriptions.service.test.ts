import { advanceDate } from '../subscriptions.service'

describe('Subscriptions Service', () => {
  describe('advanceDate', () => {
    it('advances whole months', () => {
      const jan15 = new Date(2025, 0, 15).getTime()
      const feb15 = new Date(2025, 1, 15).getTime()
      expect(advanceDate(jan15, 1)).toBe(feb15)
    })

    it('clamps to end of month on overflow (Jan 31 + 1 -> Feb 28)', () => {
      const jan31 = new Date(2025, 0, 31).getTime()
      const feb28 = new Date(2025, 1, 28).getTime()
      expect(advanceDate(jan31, 1)).toBe(feb28)
    })

    it('bimonthly -> advances 2 months', () => {
      const jan15 = new Date(2025, 0, 15).getTime()
      const mar15 = new Date(2025, 2, 15).getTime()
      expect(advanceDate(jan15, 2)).toBe(mar15)
    })

    it('quarterly -> advances 3 months', () => {
      const jan15 = new Date(2025, 0, 15).getTime()
      const apr15 = new Date(2025, 3, 15).getTime()
      expect(advanceDate(jan15, 3)).toBe(apr15)
    })

    it('semi-annually -> advances 6 months', () => {
      const jan15 = new Date(2025, 0, 15).getTime()
      const jul15 = new Date(2025, 6, 15).getTime()
      expect(advanceDate(jan15, 6)).toBe(jul15)
    })

    it('annually -> advances 1 year', () => {
      const jan15 = new Date(2025, 0, 15).getTime()
      const jan15Next = new Date(2026, 0, 15).getTime()
      expect(advanceDate(jan15, 12)).toBe(jan15Next)
    })

    it('annually edge case: Feb 29 leap year -> Feb 28 next year', () => {
      const feb29 = new Date(2024, 1, 29).getTime()
      const feb28Next = new Date(2025, 1, 28).getTime()
      expect(advanceDate(feb29, 12)).toBe(feb28Next)
    })
  })
})
