import { LOAN_PAYMENT } from '@soker90/finper-models'
import type { LoanPaymentType } from '@soker90/finper-types'
import { roundNumber } from '../../utils'
import { serializeLoan } from './loans.serializer'
import { LoanStats } from './loans.types'
import {
  buildAmortizationTable,
  LoanEventInput
} from './utils/calcLoanProjection'
import type { LoanRow, LoanPaymentRow, LoanEventRow } from './loans.repository'

type ILoansRepository = ReturnType<typeof import('./loans.repository').createLoansRepository>

export class LoansService {
  constructor (private repository: ILoansRepository) {}

  getLoans (user: string) {
    return this.repository.findByUser(user).map(serializeLoan)
  }

  getLoanDetail (id: string, user: string) {
    const { loan, events, currentRate, currentPayment } = this._getLoan(id, user)
    const payments = this.repository.findPaymentsByLoan(id, user)

    const table = buildAmortizationTable(
      this._toPaymentInputs(payments),
      loan.pendingAmount,
      currentRate,
      currentPayment,
      this._toEventInputs(events),
      loan.startDate
    )

    const stats = this._buildLoanStats({ table, loan, currentRate, currentPayment })
    return { ...serializeLoan(loan), stats, amortizationTable: table }
  }

  createLoan (data: Record<string, any>): ReturnType<typeof serializeLoan> {
    const pendingAmount = data.initialAmount

    const initialProjection = buildAmortizationTable(
      [],
      data.initialAmount,
      data.interestRate,
      data.monthlyPayment,
      [],
      data.startDate
    )
    const initialEstimatedCost = roundNumber(initialProjection.reduce((sum, row) => sum + row.amount, 0))

    const created = this.repository.create({
      name: data.name,
      initialAmount: data.initialAmount,
      pendingAmount,
      interestRate: data.interestRate,
      startDate: data.startDate,
      monthlyPayment: data.monthlyPayment,
      initialEstimatedCost,
      accountId: data.account,
      categoryId: data.category,
      user: data.user
    })
    return serializeLoan(created)
  }

  editLoan (id: string, data: Record<string, any>): ReturnType<typeof serializeLoan> {
    const updateData: Partial<LoanRow> = {}
    if (data.name !== undefined) updateData.name = data.name
    if (data.account !== undefined) updateData.accountId = data.account
    if (data.category !== undefined) updateData.categoryId = data.category

    const updated = this.repository.update(id, updateData)
    return serializeLoan(updated as LoanRow)
  }

  deleteLoan (id: string): void {
    this.repository.delete(id)
  }

  // --- helpers ---

  private _getLoan (id: string, user: string) {
    const loan = this.repository.findById(id, user) as LoanRow
    const events = this.repository.findEventsByLoan(id, user)
    const currentEvent = events.findLast(event => event.date <= Date.now())
    const currentRate = currentEvent?.newRate ?? loan.interestRate
    const currentPayment = currentEvent?.newPayment ?? loan.monthlyPayment
    return { loan, events, currentRate, currentPayment }
  }

  private _toEventInputs (events: LoanEventRow[]): LoanEventInput[] {
    return events.map(event => ({ date: event.date, newRate: event.newRate, newPayment: event.newPayment }))
  }

  // Adapta filas drizzle (id) a la forma que espera buildAmortizationTable (_id).
  private _toPaymentInputs (payments: LoanPaymentRow[]) {
    return payments.map(p => ({
      _id: p.id,
      date: p.date,
      amount: p.amount,
      interest: p.interest ?? 0,
      principal: p.principal,
      accumulatedPrincipal: p.accumulatedPrincipal,
      pendingCapital: p.pendingCapital,
      type: p.type as LoanPaymentType
    })) as any
  }

  private _buildLoanStats ({ table, loan, currentRate, currentPayment }: {
    table: ReturnType<typeof buildAmortizationTable>
    loan: LoanRow
    currentRate: number
    currentPayment: number
  }): LoanStats {
    const realRows = table.filter(row => !row.isProjected)
    const projectedRows = table.filter(row => row.isProjected)

    const { paidPrincipal, paidInterest, totalCostToDate } = realRows.reduce(
      (acc, row) => ({
        paidPrincipal: acc.paidPrincipal + row.principal,
        paidInterest: acc.paidInterest + row.interest,
        totalCostToDate: acc.totalCostToDate + row.amount
      }),
      { paidPrincipal: 0, paidInterest: 0, totalCostToDate: 0 }
    )

    const estimatedPendingInterest = roundNumber(projectedRows.reduce((sum, row) => sum + row.interest, 0))
    const estimatedTotalCost = roundNumber(totalCostToDate + projectedRows.reduce((sum, row) => sum + row.amount, 0))

    const { totalOrdinaryAmount, totalExtraordinaryAmount, ordinaryPaymentsCount, extraordinaryPaymentsCount } = realRows.reduce(
      (acc, row) => {
        if (row.type === LOAN_PAYMENT.ORDINARY) {
          acc.totalOrdinaryAmount += row.amount
          acc.ordinaryPaymentsCount++
        } else if (row.type === LOAN_PAYMENT.EXTRAORDINARY) {
          acc.totalExtraordinaryAmount += row.amount
          acc.extraordinaryPaymentsCount++
        }
        return acc
      },
      { totalOrdinaryAmount: 0, totalExtraordinaryAmount: 0, ordinaryPaymentsCount: 0, extraordinaryPaymentsCount: 0 }
    )

    const savedByExtraordinary = roundNumber((loan.initialEstimatedCost ?? 0) - estimatedTotalCost)
    const lastProjected = projectedRows[projectedRows.length - 1]
    const estimatedEndDate = lastProjected?.date ?? null

    return {
      paidPrincipal: roundNumber(paidPrincipal),
      paidInterest: roundNumber(paidInterest),
      pendingPrincipal: loan.pendingAmount,
      estimatedPendingInterest,
      totalCostToDate: roundNumber(totalCostToDate),
      estimatedTotalCost,
      ordinaryPaymentsCount,
      extraordinaryPaymentsCount,
      totalOrdinaryAmount: roundNumber(totalOrdinaryAmount),
      totalExtraordinaryAmount: roundNumber(totalExtraordinaryAmount),
      savedByExtraordinary,
      estimatedEndDate,
      currentPayment,
      currentRate
    }
  }
}
