import Boom from '@hapi/boom'
import { LOAN_PAYMENT, roundMoney } from '@soker90/finper-db'
import type { LoanPaymentType } from '@soker90/finper-types'
import { ERROR_MESSAGE } from '../../i18n'
import { serializeLoan, serializePayment, serializeEvent } from './loans.serializer'
import { LoanStats, SimulationResult } from './loans.types'
import {
  buildAmortizationTable,
  calcRemainingMonths,
  calcMonthlyPayment,
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
    const initialEstimatedCost = roundMoney(initialProjection.reduce((sum, row) => sum + row.amount, 0))

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
  // --- Parte B: pagos ---

  payOrdinary (id: string, user: string, params?: { date?: number, amount?: number, addMovement?: boolean }) {
    return this.repository.transaction(() => {
      const { loan, lastPayment, currentRate, currentPayment } = this._getLoanWithRates(id, user)

      if (loan.pendingAmount <= 0) throw Boom.badRequest(ERROR_MESSAGE.LOAN.ALREADY_PAID).output

      const monthlyInterestRate = currentRate / 100 / 12
      const baseInterest = roundMoney(loan.pendingAmount * monthlyInterestRate)

      const principalPart = roundMoney(Math.min(currentPayment - baseInterest, loan.pendingAmount))
      const amount = params?.amount ?? roundMoney(baseInterest + principalPart)
      const interestPart = roundMoney(amount - principalPart)

      const lastAcc = lastPayment?.accumulatedPrincipal ?? 0
      const accumulatedPrincipal = roundMoney(lastAcc + principalPart)
      const pendingCapital = roundMoney(loan.pendingAmount - principalPart)
      const date = params?.date ?? Date.now()

      const payment = this.repository.createPayment({
        loanId: id,
        date,
        amount,
        interest: interestPart,
        principal: principalPart,
        accumulatedPrincipal,
        pendingCapital,
        type: LOAN_PAYMENT.ORDINARY,
        user
      })

      this.repository.updateLoanFields(id, { pendingAmount: pendingCapital })

      if (params?.addMovement ?? true) this._registerPaymentMovement(loan, amount, date, user)

      return serializePayment(payment)
    })
  }

  payExtraordinary (id: string, amount: number, mode: 'reduceQuota' | 'reduceTerm', user: string, addMovement = true, date?: number) {
    return this.repository.transaction(() => {
      const { loan, lastPayment, currentRate, currentPayment } = this._getLoanWithRates(id, user)

      const amortizationDate = date ?? Date.now()

      // Si el importe supera el capital pendiente, el exceso son intereses (Bug A, 1:1).
      const principal = roundMoney(Math.min(amount, loan.pendingAmount))
      const interest = roundMoney(amount - principal)
      const lastAcc = lastPayment?.accumulatedPrincipal ?? 0
      const accumulatedPrincipal = roundMoney(lastAcc + principal)
      const pendingCapital = roundMoney(loan.pendingAmount - principal)

      const payment = this.repository.createPayment({
        loanId: id,
        date: amortizationDate,
        amount: roundMoney(principal + interest),
        interest,
        principal,
        accumulatedPrincipal,
        pendingCapital,
        type: LOAN_PAYMENT.EXTRAORDINARY,
        user
      })

      let newPayment = currentPayment
      if (mode === 'reduceQuota') {
        const remaining = calcRemainingMonths(pendingCapital, currentRate, currentPayment)
        // Si remaining es Infinity la cuota no cubre intereses → mantener cuota actual (Bug B, 1:1).
        if (remaining !== Infinity) {
          newPayment = roundMoney(calcMonthlyPayment(pendingCapital, currentRate, remaining))
        }
      }
      // 'reduceTerm': misma cuota, menos meses → sin cambio de cuota.

      this.repository.updateLoanFields(id, { pendingAmount: pendingCapital, monthlyPayment: newPayment })

      if (addMovement) this._registerPaymentMovement(loan, amount, payment.date, user)

      return serializePayment(payment)
    })
  }

  deletePayment (loanId: string, paymentId: string, user: string): void {
    const payment = this.repository.findPaymentById(paymentId, loanId, user)
    const loan = this.repository.findById(loanId, user)
    if (!payment) throw Boom.notFound(ERROR_MESSAGE.LOAN.PAYMENT_NOT_FOUND).output
    /* istanbul ignore next — validateLoanExist runs before via route */
    if (!loan) throw Boom.notFound(ERROR_MESSAGE.LOAN.NOT_FOUND).output

    this.repository.transaction(() => {
      // Revierte la deducción de la cuenta.
      this._deductFromAccount(loan.accountId, -payment.amount)

      // Sólo los pagos ordinarios generan movimiento.
      if (payment.type === LOAN_PAYMENT.ORDINARY) {
        this.repository.deleteMovementByMatch(user, loan.accountId, payment.amount, payment.date)
      }

      this.repository.deletePayment(paymentId)

      // Recalcula toda la cadena (Bug C).
      this._recalcChain(loanId, user)
    })
  }

  editPayment (loanId: string, paymentId: string, data: { date?: number, amount?: number, interest?: number, principal?: number, type?: LoanPaymentType }, user: string) {
    const payment = this.repository.findPaymentById(paymentId, loanId, user)
    const loan = this.repository.findById(loanId, user)
    if (!payment) throw Boom.notFound(ERROR_MESSAGE.LOAN.PAYMENT_NOT_FOUND).output
    /* istanbul ignore next — validateLoanExist runs before via route */
    if (!loan) throw Boom.notFound(ERROR_MESSAGE.LOAN.NOT_FOUND).output

    const originalAmount = payment.amount
    const originalDate = payment.date
    const originalType = payment.type

    const updatedFields: Partial<LoanPaymentRow> = {}
    if (data.date !== undefined) updatedFields.date = data.date
    if (data.amount !== undefined) updatedFields.amount = data.amount
    if (data.interest !== undefined) updatedFields.interest = data.interest
    if (data.principal !== undefined) updatedFields.principal = data.principal
    if (data.type !== undefined) updatedFields.type = data.type

    return this.repository.transaction(() => {
      this.repository.updatePayment(paymentId, updatedFields)
      this._recalcChain(loanId, user)

      const amountDiff = roundMoney((data.amount ?? originalAmount) - originalAmount)
      if (amountDiff !== 0) this._deductFromAccount(loan.accountId, amountDiff)

      const effectiveType = data.type ?? originalType
      if (effectiveType === LOAN_PAYMENT.ORDINARY || originalType === LOAN_PAYMENT.ORDINARY) {
        this.repository.updateMovementByMatch(
          { user, accountId: loan.accountId, amount: originalAmount, date: originalDate },
          {
            ...(data.amount !== undefined && { amount: data.amount }),
            ...(data.date !== undefined && { date: data.date })
          }
        )
      }

      return serializePayment(this.repository.findPaymentById(paymentId, loanId, user) as LoanPaymentRow)
    })
  }

  // --- Parte C: eventos / simulación ---

  addEvent (loanId: string, data: { date: number, newRate: number, newPayment: number, user: string }) {
    return this.repository.transaction(() => {
      const event = this.repository.createEvent({
        loanId, date: data.date, newRate: data.newRate, newPayment: data.newPayment, user: data.user
      })
      // Actualiza tasa y cuota "actuales" del préstamo.
      this.repository.updateLoanFields(loanId, { interestRate: data.newRate, monthlyPayment: data.newPayment })
      return serializeEvent(event)
    })
  }

  simulatePayoff (loanId: string, lumpSum: number, user: string): SimulationResult {
    const { loan, events, currentRate, currentPayment } = this._getLoan(loanId, user)

    if (lumpSum > loan.pendingAmount) {
      throw Boom.badData('lumpSum cannot exceed pendingAmount').output
    }

    const eventInputs = this._toEventInputs(events)
    const newPending = roundMoney(loan.pendingAmount - lumpSum)
    const projectionAnchor = this._getProjectionAnchor(loanId, user)

    const baseScenario = this._buildProjectionScenario(
      loan.pendingAmount, currentRate, currentPayment, eventInputs, loan.startDate, projectionAnchor
    )

    if (baseScenario.monthsLeft === 0) {
      throw Boom.badData('Loan is already fully paid').output
    }

    // Opción A: reduceTerm — misma cuota, menos meses.
    const optionAScenario = this._buildProjectionScenario(
      newPending, currentRate, currentPayment, eventInputs, loan.startDate, projectionAnchor
    )

    // Opción B: reduceQuota — misma duración, cuota menor.
    const newMonthlyPayment = calcMonthlyPayment(newPending, currentRate, baseScenario.monthsLeft)
    const adjustedEvents: LoanEventInput[] = eventInputs.map(event => ({ ...event, newPayment: newMonthlyPayment }))
    const optionBScenario = this._buildProjectionScenario(
      newPending, currentRate, newMonthlyPayment, adjustedEvents, loan.startDate, projectionAnchor
    )

    return {
      lumpSum,
      originalMonthsLeft: baseScenario.monthsLeft,
      originalMonthlyPayment: currentPayment,
      originalEndDate: baseScenario.endDate,
      optionA: {
        newMonthsLeft: optionAScenario.monthsLeft,
        newMonthlyPayment: currentPayment,
        monthsSaved: baseScenario.monthsLeft - optionAScenario.monthsLeft,
        monthlySaving: 0,
        totalInterestSaved: roundMoney(baseScenario.totalInterest - optionAScenario.totalInterest),
        newEndDate: optionAScenario.endDate
      },
      optionB: {
        newMonthsLeft: optionBScenario.monthsLeft,
        newMonthlyPayment,
        monthsSaved: baseScenario.monthsLeft - optionBScenario.monthsLeft,
        monthlySaving: roundMoney(currentPayment - newMonthlyPayment),
        totalInterestSaved: roundMoney(baseScenario.totalInterest - optionBScenario.totalInterest),
        newEndDate: optionBScenario.endDate
      }
    }
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

  private _getLoanWithRates (id: string, user: string) {
    const base = this._getLoan(id, user)
    const lastPayment = this.repository.findLastPayment(id, user)
    return { ...base, lastPayment }
  }

  // Descuenta del balance y registra el movimiento (gasto) del pago.
  private _registerPaymentMovement (loan: LoanRow, amount: number, date: number, user: string): void {
    this._deductFromAccount(loan.accountId, amount)
    this.repository.createMovement({ date, categoryId: loan.categoryId, amount, accountId: loan.accountId, user })
  }

  private _deductFromAccount (accountId: string, amount: number): void {
    const changes = this.repository.deductFromBalance(accountId, amount)
    /* istanbul ignore next — validateLoanExist runs before loan operations via route */
    if (changes === 0) throw Boom.notFound(ERROR_MESSAGE.ACCOUNT.NOT_FOUND).output
  }

  // Recalcula accumulatedPrincipal/pendingCapital de toda la cadena y fija pendingAmount del préstamo.
  private _recalcChain (loanId: string, user: string): void {
    const allPayments = this.repository.findPaymentsByLoan(loanId, user) // date asc
    const loan = this.repository.findById(loanId, user) as LoanRow

    let accumulated = 0
    let pending = loan.initialAmount

    for (const payment of allPayments) {
      accumulated = roundMoney(accumulated + payment.principal)
      pending = roundMoney(pending - payment.principal)
      this.repository.updatePayment(payment.id, { accumulatedPrincipal: accumulated, pendingCapital: pending })
    }

    this.repository.updateLoanFields(loanId, { pendingAmount: pending })
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

    const estimatedPendingInterest = roundMoney(projectedRows.reduce((sum, row) => sum + row.interest, 0))
    const estimatedTotalCost = roundMoney(totalCostToDate + projectedRows.reduce((sum, row) => sum + row.amount, 0))

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

    const savedByExtraordinary = roundMoney((loan.initialEstimatedCost ?? 0) - estimatedTotalCost)
    const lastProjected = projectedRows[projectedRows.length - 1]
    const estimatedEndDate = lastProjected?.date ?? null

    return {
      paidPrincipal: roundMoney(paidPrincipal),
      paidInterest: roundMoney(paidInterest),
      pendingPrincipal: loan.pendingAmount,
      estimatedPendingInterest,
      totalCostToDate: roundMoney(totalCostToDate),
      estimatedTotalCost,
      ordinaryPaymentsCount,
      extraordinaryPaymentsCount,
      totalOrdinaryAmount: roundMoney(totalOrdinaryAmount),
      totalExtraordinaryAmount: roundMoney(totalExtraordinaryAmount),
      savedByExtraordinary,
      estimatedEndDate,
      currentPayment,
      currentRate
    }
  }

  // Ancla de proyección: date del último pago ordinario.
  private _getProjectionAnchor (loanId: string, user: string): number | undefined {
    return this.repository.findLastOrdinaryPayment(loanId, user)?.date
  }

  // Construye una tabla de amortización proyectada y extrae las métricas clave.
  private _buildProjectionScenario (
    pendingAmount: number,
    rate: number,
    monthlyPayment: number,
    eventInputs: LoanEventInput[],
    startDate: number,
    projectionAnchor: number | undefined
  ): { monthsLeft: number, totalInterest: number, endDate: number | null } {
    const table = buildAmortizationTable([], pendingAmount, rate, monthlyPayment, eventInputs, startDate, projectionAnchor)
    const projectedRows = table.filter(row => row.isProjected)
    const totalInterest = roundMoney(projectedRows.reduce((sum, row) => sum + row.interest, 0))
    const monthsLeft = projectedRows.length
    const endDate = table.length > 0 ? table[table.length - 1].date : null
    return { monthsLeft, totalInterest, endDate }
  }
}
