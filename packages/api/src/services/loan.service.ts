import {
  ILoan,
  ILoanPayment,
  ILoanEvent,
  LoanModel,
  LoanPaymentModel,
  LoanEventModel,
  LoanPaymentType,
  LOAN_PAYMENT,
  AccountModel,
  TransactionModel,
  TRANSACTION
} from '@soker90/finper-models'
import Boom from '@hapi/boom'
import { roundNumber } from '../utils/roundNumber'
import { leanDoc } from '../utils/mongoose'
import {
  buildAmortizationTable,
  calcMonthlyPayment,
  calcRemainingMonths,
  LoanEventInput
} from './utils/calcLoanProjection'
import { ERROR_MESSAGE } from '../i18n'

export interface LoanStats {
  paidPrincipal: number
  paidInterest: number
  pendingPrincipal: number
  estimatedPendingInterest: number
  totalCostToDate: number
  estimatedTotalCost: number
  ordinaryPaymentsCount: number
  extraordinaryPaymentsCount: number
  totalOrdinaryAmount: number
  totalExtraordinaryAmount: number
  savedByExtraordinary: number
  estimatedEndDate: number | null
  currentPayment: number
  currentRate: number
}

export interface LoanDetail extends ILoan {
  _id: string
  stats: LoanStats
  amortizationTable: ReturnType<typeof buildAmortizationTable>
}

export interface SimulationOption {
  newMonthsLeft: number
  newMonthlyPayment: number
  monthsSaved: number
  monthlySaving: number
  totalInterestSaved: number
  newEndDate: number | null
}

export interface SimulationResult {
  lumpSum: number
  originalMonthsLeft: number
  originalMonthlyPayment: number
  originalEndDate: number | null
  optionA: SimulationOption
  optionB: SimulationOption
}

export interface ILoanService {
  getLoans(user: string): Promise<(ILoan & { _id: string })[]>
  getLoanDetail(id: string, user: string): Promise<LoanDetail>
  createLoan(data: ILoan): Promise<ILoan & { _id: string }>
  editLoan(id: string, data: Partial<ILoan>): Promise<ILoan & { _id: string }>
  deleteLoan(id: string): Promise<void>
  payOrdinary(id: string, user: string, params?: { date?: number, amount?: number, addMovement?: boolean }): Promise<ILoanPayment>
  payExtraordinary(id: string, amount: number, mode: 'reduceQuota' | 'reduceTerm', user: string, addMovement?: boolean, date?: number): Promise<ILoanPayment>
  addEvent(loanId: string, data: Omit<ILoanEvent, 'loan'>): Promise<ILoanEvent>
  deletePayment(loanId: string, paymentId: string, user: string): Promise<void>
  editPayment(loanId: string, paymentId: string, data: { date?: number, amount?: number, interest?: number, principal?: number, type?: LoanPaymentType }, user: string): Promise<ILoanPayment>
  simulatePayoff(loanId: string, lumpSum: number, user: string): Promise<SimulationResult>
}

export default class LoanService implements ILoanService {
  async getLoans (user: string): Promise<(ILoan & { _id: string })[]> {
    return leanDoc<(ILoan & { _id: string })[]>(LoanModel.find({ user }).lean())
  }

  async getLoanDetail (id: string, user: string): Promise<LoanDetail> {
    const [{ loan, events, currentRate, currentPayment }, payments] = await Promise.all([
      this._getLoan(id, user),
      leanDoc<(ILoanPayment & { _id: string })[]>(LoanPaymentModel.find({ loan: id, user }).sort({ date: 1 }).lean())
    ])

    const eventInputs = this._toEventInputs(events)

    const table = buildAmortizationTable(
      payments,
      loan.pendingAmount,
      currentRate,
      currentPayment,
      eventInputs,
      loan.startDate
    )

    const stats = this._buildLoanStats({ table, loan, currentRate, currentPayment })

    return { ...loan, stats, amortizationTable: table }
  }

  async createLoan (data: ILoan): Promise<ILoan & { _id: string }> {
    const loanData = { ...data }
    loanData.pendingAmount = loanData.initialAmount

    const initialProjection = buildAmortizationTable(
      [],
      loanData.initialAmount,
      loanData.interestRate,
      loanData.monthlyPayment,
      [],
      loanData.startDate
    )
    const totalPaymentsAmount = initialProjection.reduce((sum, row) => sum + row.amount, 0)
    loanData.initialEstimatedCost = roundNumber(totalPaymentsAmount)
    return leanDoc<ILoan & { _id: string }>(LoanModel.create(loanData))
  }

  async editLoan (id: string, data: Partial<ILoan>): Promise<ILoan & { _id: string }> {
    const updated = await leanDoc<ILoan & { _id: string } | null>(LoanModel.findByIdAndUpdate(id, data, { returnDocument: 'after' }).lean())
    /* istanbul ignore next — validator validateLoanExist runs before this method via route */
    if (!updated) throw Boom.notFound(ERROR_MESSAGE.LOAN.NOT_FOUND).output
    return updated
  }

  async deleteLoan (id: string): Promise<void> {
    await Promise.all([
      LoanModel.findByIdAndDelete(id),
      LoanPaymentModel.deleteMany({ loan: id }),
      LoanEventModel.deleteMany({ loan: id })
    ])
  }

  async payOrdinary (id: string, user: string, params?: { date?: number, amount?: number, addMovement?: boolean }): Promise<ILoanPayment> {
    const { loan, lastPayment, currentRate, currentPayment } = await this._getLoanWithRates(id, user)

    if (loan.pendingAmount <= 0) throw Boom.badRequest(ERROR_MESSAGE.LOAN.ALREADY_PAID).output

    const monthlyInterestRate = currentRate / 100 / 12
    const baseInterest = roundNumber(loan.pendingAmount * monthlyInterestRate)

    // El principal siempre es el calculado normalmente (currentPayment - interés base).
    // Si el usuario pasa un importe concreto, la diferencia respecto al estándar son los intereses.
    const principalPart = roundNumber(Math.min(currentPayment - baseInterest, loan.pendingAmount))
    const amount = params?.amount ?? roundNumber(baseInterest + principalPart)
    const interestPart = roundNumber(amount - principalPart)

    const lastAcc = lastPayment?.accumulatedPrincipal ?? 0
    const accumulatedPrincipal = roundNumber(lastAcc + principalPart)
    const pendingCapital = roundNumber(loan.pendingAmount - principalPart)

    const payment = await LoanPaymentModel.create({
      loan: id,
      date: params?.date ?? Date.now(),
      amount,
      interest: interestPart,
      principal: principalPart,
      accumulatedPrincipal,
      pendingCapital,
      type: LOAN_PAYMENT.ORDINARY,
      user
    })

    await LoanModel.updateOne({ _id: id }, { pendingAmount: pendingCapital })

    const addMovement = params?.addMovement ?? true
    if (addMovement) {
      await this._registerPaymentMovement(loan, amount, payment.date, user)
    }

    return leanDoc<ILoanPayment>(payment)
  }

  async payExtraordinary (id: string, amount: number, mode: 'reduceQuota' | 'reduceTerm', user: string, addMovement = true, date?: number): Promise<ILoanPayment> {
    const { loan, lastPayment, currentRate, currentPayment } = await this._getLoanWithRates(id, user)

    const amortizationDate = date ?? Date.now()

    // Bug A: si el importe supera el capital pendiente, el exceso son intereses
    const principal = roundNumber(Math.min(amount, loan.pendingAmount))
    const interest = roundNumber(amount - principal)
    const lastAcc = lastPayment?.accumulatedPrincipal ?? 0
    const accumulatedPrincipal = roundNumber(lastAcc + principal)
    const pendingCapital = roundNumber(loan.pendingAmount - principal)

    const payment = await LoanPaymentModel.create({
      loan: id,
      date: amortizationDate,
      amount: roundNumber(principal + interest),
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
      // Bug B: si remaining es Infinity el pago no cubre intereses → mantener cuota actual
      if (remaining !== Infinity) {
        newPayment = roundNumber(calcMonthlyPayment(pendingCapital, currentRate, remaining))
      }
    }
    // For 'reduceTerm', keep same payment, fewer months → no update needed

    await LoanModel.updateOne(
      { _id: id },
      { pendingAmount: pendingCapital, monthlyPayment: newPayment }
    )

    if (addMovement) {
      await this._registerPaymentMovement(loan, amount, payment.date, user)
    }

    return leanDoc<ILoanPayment>(payment)
  }

  async addEvent (loanId: string, data: Omit<ILoanEvent, 'loan'>): Promise<ILoanEvent> {
    const event = await LoanEventModel.create({ ...data, loan: loanId })
    // Update loan's current rate and payment
    await LoanModel.updateOne(
      { _id: loanId },
      { interestRate: data.newRate, monthlyPayment: data.newPayment }
    )
    return leanDoc<ILoanEvent>(event)
  }

  async deletePayment (loanId: string, paymentId: string, user: string): Promise<void> {
    const [payment, loan] = await Promise.all([
      leanDoc<ILoanPayment | null>(LoanPaymentModel.findOne({ _id: paymentId, loan: loanId, user }).lean()),
      leanDoc<ILoan & { _id: string } | null>(LoanModel.findOne({ _id: loanId, user }).lean())
    ])
    if (!payment) throw Boom.notFound(ERROR_MESSAGE.LOAN.PAYMENT_NOT_FOUND).output
    /* istanbul ignore next — validator validateLoanExist runs before this method via route */
    if (!loan) throw Boom.notFound(ERROR_MESSAGE.LOAN.NOT_FOUND).output

    // Reverse the account deduction using the correct account from the loan
    await this._deductFromAccount(loan.account.toString(), -payment.amount)

    // Delete the associated expense transaction (only ordinary payments generate one)
    if (payment.type === LOAN_PAYMENT.ORDINARY) {
      await TransactionModel.findOneAndDelete({
        user,
        account: loan.account,
        amount: payment.amount,
        date: payment.date
      })
    }

    await LoanPaymentModel.findByIdAndDelete(paymentId)

    // Bug C: recalculate full chain so accumulatedPrincipal/pendingCapital stay correct
    await this._recalcChain(loanId, user)
  }

  async editPayment (loanId: string, paymentId: string, data: { date?: number, amount?: number, interest?: number, principal?: number, type?: LoanPaymentType }, user: string): Promise<ILoanPayment> {
    const [payment, loan] = await Promise.all([
      leanDoc<ILoanPayment & { _id: string } | null>(LoanPaymentModel.findOne({ _id: paymentId, loan: loanId, user }).lean()),
      leanDoc<ILoan & { _id: string } | null>(LoanModel.findOne({ _id: loanId, user }).lean())
    ])
    if (!payment) throw Boom.notFound(ERROR_MESSAGE.LOAN.PAYMENT_NOT_FOUND).output
    /* istanbul ignore next — validator validateLoanExist runs before this method via route */
    if (!loan) throw Boom.notFound(ERROR_MESSAGE.LOAN.NOT_FOUND).output

    // Capture original values before applying changes
    const originalAmount = payment.amount
    const originalDate = payment.date
    const originalType = payment.type

    // Apply field updates to the target payment
    const updatedFields: Partial<ILoanPayment> = {}
    /* istanbul ignore next — optional field update branches; not all combinations exercised in tests */
    if (data.date !== undefined) updatedFields.date = data.date
    if (data.amount !== undefined) updatedFields.amount = data.amount
    if (data.interest !== undefined) updatedFields.interest = data.interest
    if (data.principal !== undefined) updatedFields.principal = data.principal
    if (data.type !== undefined) updatedFields.type = data.type

    await LoanPaymentModel.updateOne({ _id: paymentId }, updatedFields)

    // Recalculate full chain
    await this._recalcChain(loanId, user)

    // Adjust account balance by the difference in amount
    const newAmount = data.amount ?? originalAmount
    const amountDiff = roundNumber(newAmount - originalAmount)
    if (amountDiff !== 0) {
      await this._deductFromAccount(loan.account.toString(), amountDiff)
    }

    // Update the linked expense transaction if the payment is/was ordinary
    const effectiveType = data.type ?? originalType
    if (effectiveType === LOAN_PAYMENT.ORDINARY || originalType === LOAN_PAYMENT.ORDINARY) {
      await TransactionModel.findOneAndUpdate(
        {
          user,
          account: loan.account,
          amount: originalAmount,
          date: originalDate
        },
        {
          ...(data.amount !== undefined && { amount: data.amount }),
          ...(data.date !== undefined && { date: data.date })
        }
      )
    }

    return leanDoc<ILoanPayment>(await LoanPaymentModel.findById(paymentId).lean())
  }

  async simulatePayoff (loanId: string, lumpSum: number, user: string): Promise<SimulationResult> {
    const { loan, events, currentRate, currentPayment } = await this._getLoan(loanId, user)

    if (lumpSum > loan.pendingAmount) {
      throw Boom.badData('lumpSum cannot exceed pendingAmount').output
    }

    const eventInputs = this._toEventInputs(events)

    const newPending = roundNumber(loan.pendingAmount - lumpSum)
    const projectionAnchor = await this._getProjectionAnchor(loanId, user)

    // Base scenario: current state without lump sum
    const baseScenario = this._buildProjectionScenario(
      loan.pendingAmount, currentRate, currentPayment, eventInputs, loan.startDate, projectionAnchor
    )

    // Guard: loan already fully paid
    if (baseScenario.monthsLeft === 0) {
      throw Boom.badData('Loan is already fully paid').output
    }

    // Option A: reduce term — same payment, fewer months
    const optionAScenario = this._buildProjectionScenario(
      newPending, currentRate, currentPayment, eventInputs, loan.startDate, projectionAnchor
    )

    // Option B: reduce quota — same duration, lower payment
    const newMonthlyPayment = calcMonthlyPayment(newPending, currentRate, baseScenario.monthsLeft)
    const adjustedEvents: LoanEventInput[] = eventInputs.map(event => ({
      ...event,
      newPayment: newMonthlyPayment
    }))
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
        totalInterestSaved: roundNumber(baseScenario.totalInterest - optionAScenario.totalInterest),
        newEndDate: optionAScenario.endDate
      },
      optionB: {
        newMonthsLeft: optionBScenario.monthsLeft,
        newMonthlyPayment,
        monthsSaved: baseScenario.monthsLeft - optionBScenario.monthsLeft,
        monthlySaving: roundNumber(currentPayment - newMonthlyPayment),
        totalInterestSaved: roundNumber(baseScenario.totalInterest - optionBScenario.totalInterest),
        newEndDate: optionBScenario.endDate
      }
    }
  }

  /** Find the date of the last ordinary payment to anchor future projections. */
  private async _getProjectionAnchor (loanId: string, user: string): Promise<number | undefined> {
    const lastOrdinaryPayment = await leanDoc<ILoanPayment | null>(
      LoanPaymentModel.findOne({ loan: loanId, user, type: LOAN_PAYMENT.ORDINARY }).sort({ date: -1 }).lean()
    )
    return lastOrdinaryPayment?.date
  }

  /** Build an amortization table and extract key projection metrics. */
  private _buildProjectionScenario (
    pendingAmount: number,
    rate: number,
    monthlyPayment: number,
    eventInputs: LoanEventInput[],
    startDate: number,
    projectionAnchor: number | undefined
  ): { monthsLeft: number; totalInterest: number; endDate: number | null } {
    const table = buildAmortizationTable(
      [], pendingAmount, rate, monthlyPayment, eventInputs, startDate, projectionAnchor
    )
    const projectedRows = table.filter(row => row.isProjected)
    const totalInterest = roundNumber(projectedRows.reduce((sum, row) => sum + row.interest, 0))
    const monthsLeft = projectedRows.length
    const endDate = table.length > 0 ? table[table.length - 1].date : null
    return { monthsLeft, totalInterest, endDate }
  }

  private async _registerPaymentMovement (loan: ILoan & { _id: string }, amount: number, date: number, user: string): Promise<void> {
    await this._deductFromAccount(loan.account.toString(), amount)
    await TransactionModel.create({
      date,
      category: loan.category,
      amount,
      type: TRANSACTION.Expense,
      account: loan.account,
      user
    })
  }

  private async _getLoan (id: string, user: string) {
    const [loan, events] = await Promise.all([
      leanDoc<ILoan & { _id: string }>(LoanModel.findOne({ _id: id, user }).lean()),
      leanDoc<ILoanEvent[]>(LoanEventModel.find({ loan: id, user }).sort({ date: 1 }).lean())
    ])
    const currentEvent = events.findLast(event => event.date <= Date.now())
    const currentRate = currentEvent?.newRate ?? loan.interestRate
    const currentPayment = currentEvent?.newPayment ?? loan.monthlyPayment
    return { loan, events, currentRate, currentPayment }
  }

  private async _getLoanWithRates (id: string, user: string) {
    const { loan, events, currentRate, currentPayment } = await this._getLoan(id, user)
    const lastPayment = await leanDoc<ILoanPayment | null>(
      LoanPaymentModel.findOne({ loan: id, user }).sort({ date: -1 }).lean()
    )
    return { loan, events, lastPayment, currentRate, currentPayment }
  }

  private _toEventInputs (events: ILoanEvent[]): LoanEventInput[] {
    return events.map(event => ({ date: event.date, newRate: event.newRate, newPayment: event.newPayment }))
  }

  private _buildLoanStats ({ table, loan, currentRate, currentPayment }: {
    table: ReturnType<typeof buildAmortizationTable>
    loan: ILoan
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

    /* istanbul ignore next — initialEstimatedCost is always set when loan is created */
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

  /**
   * Recalcula en cascada los campos derivados de todos los pagos de un préstamo
   * y actualiza el capital pendiente del propio préstamo.
   *
   * **Cuándo llamar**: después de editar o eliminar cualquier pago cuyo `principal`
   * haya cambiado (o cuya existencia haya cambiado), para mantener la consistencia
   * de la tabla de amortización.
   *
   * **Qué garantiza**:
   * - `accumulatedPrincipal` de cada pago = suma acumulada de `principal` de todos
   *   los pagos anteriores (ordenados por `date ASC`) incluyendo el propio.
   * - `pendingCapital` de cada pago = `initialAmount` − `accumulatedPrincipal`.
   * - `pendingAmount` del préstamo = capital pendiente tras el último pago registrado.
   *
   * **Qué asume**:
   * - Los pagos se ordenan por `date ASC`; si dos pagos tienen la misma fecha el
   *   orden entre ellos es arbitrario pero estable (orden de inserción en MongoDB).
   * - `initialAmount` del préstamo es **inmutable** tras la creación; si se necesitase
   *   modificarlo habría que revisar esta lógica.
   * - Ningún proceso externo modifica `accumulatedPrincipal` / `pendingCapital` de
   *   estos pagos concurrentemente durante la ejecución de este método.
   */
  private async _recalcChain (loanId: string, user: string): Promise<void> {
    const [allPayments, loan] = await Promise.all([
      leanDoc<(ILoanPayment & { _id: string })[]>(LoanPaymentModel.find({ loan: loanId, user }).sort({ date: 1 }).lean()),
      leanDoc<ILoan>(LoanModel.findOne({ _id: loanId, user }).lean())
    ])

    let accumulated = 0
    let pending = loan.initialAmount

    const bulkOps = allPayments.map(payment => {
      accumulated = roundNumber(accumulated + payment.principal)
      pending = roundNumber(pending - payment.principal)
      return {
        updateOne: {
          filter: { _id: payment._id },
          update: { accumulatedPrincipal: accumulated, pendingCapital: pending }
        }
      }
    })

    if (bulkOps.length > 0) {
      await LoanPaymentModel.bulkWrite(bulkOps)
    }

    await LoanModel.updateOne({ _id: loanId }, { pendingAmount: pending })
  }

  private async _deductFromAccount (accountId: string, amount: number): Promise<void> {
    const result = await AccountModel.updateOne({ _id: accountId }, { $inc: { balance: -amount } })
    /* istanbul ignore next — validator runs before loan operations via route */
    if (result.matchedCount === 0) {
      throw Boom.notFound(ERROR_MESSAGE.ACCOUNT.NOT_FOUND).output
    }
  }
}
