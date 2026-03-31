import { buildAmortizationTable, calcMonthlyPayment } from '../../src/services/utils/calcLoanProjection'
import { LoanPaymentType } from '@soker90/finper-models'

describe('buildAmortizationTable', () => {
  const START_DATE = new Date('2020-01-15').getTime()

  describe('when payment does not cover interest (MAX_PERIODS cap)', () => {
    // pendingAmount=100000, annualRate=24% → monthlyRate=2%
    // monthlyInterest = 100000 * 0.02 = 2000
    // payment=1000 < interest=2000 → principal never decreases → cap at 600 rows
    const pendingAmount = 100000
    const interestRate = 24
    const insufficientPayment = 1000

    test('projected table contains exactly MAX_PERIODS rows', () => {
      const table = buildAmortizationTable(
        [],
        pendingAmount,
        interestRate,
        insufficientPayment,
        [],
        START_DATE
      )

      const projected = table.filter(r => r.isProjected)
      expect(projected).toHaveLength(600)
    })

    test('all projected rows have pendingCapital >= original pendingAmount (debt grows)', () => {
      const table = buildAmortizationTable(
        [],
        pendingAmount,
        interestRate,
        insufficientPayment,
        [],
        START_DATE
      )

      const projected = table.filter(r => r.isProjected)
      projected.forEach(row => {
        expect(row.pendingCapital).toBeGreaterThanOrEqual(pendingAmount)
      })
    })

    test('no real rows are present when there are no payments', () => {
      const table = buildAmortizationTable(
        [],
        pendingAmount,
        interestRate,
        insufficientPayment,
        [],
        START_DATE
      )

      const real = table.filter(r => !r.isProjected)
      expect(real).toHaveLength(0)
    })
  })

  describe('when payment covers interest (normal amortisation)', () => {
    // 10000 at 3% annual, 200/month → ~52 months
    const pendingAmount = 10000
    const interestRate = 3
    const monthlyPayment = calcMonthlyPayment(pendingAmount, interestRate, 52)

    test('projected table has fewer than MAX_PERIODS rows', () => {
      const table = buildAmortizationTable(
        [],
        pendingAmount,
        interestRate,
        monthlyPayment,
        [],
        START_DATE
      )

      const projected = table.filter(r => r.isProjected)
      expect(projected.length).toBeGreaterThan(0)
      expect(projected.length).toBeLessThan(600)
    })

    test('last projected row has pendingCapital close to 0', () => {
      const table = buildAmortizationTable(
        [],
        pendingAmount,
        interestRate,
        monthlyPayment,
        [],
        START_DATE
      )

      const projected = table.filter(r => r.isProjected)
      const last = projected[projected.length - 1]
      expect(last.pendingCapital).toBeLessThan(0.01)
    })

    test('all rows are projected when there are no real payments', () => {
      const table = buildAmortizationTable(
        [],
        pendingAmount,
        interestRate,
        monthlyPayment,
        [],
        START_DATE
      )

      expect(table.every(r => r.isProjected)).toBe(true)
    })

    test('real payments have isProjected=false', () => {
      const realPayment = {
        _id: 'abc123',
        loan: 'loan1' as any,
        date: START_DATE,
        amount: monthlyPayment,
        interest: 25,
        principal: monthlyPayment - 25,
        accumulatedPrincipal: monthlyPayment - 25,
        pendingCapital: pendingAmount - (monthlyPayment - 25),
        type: LoanPaymentType.ORDINARY,
        user: 'user1'
      }

      const table = buildAmortizationTable(
        [realPayment],
        pendingAmount - (monthlyPayment - 25),
        interestRate,
        monthlyPayment,
        [],
        START_DATE
      )

      const real = table.filter(r => !r.isProjected)
      expect(real).toHaveLength(1)
      expect(real[0]._id).toBe('abc123')
    })
  })
})
