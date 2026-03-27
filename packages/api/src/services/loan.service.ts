import {
  ILoan,
  ILoanPayment,
  ILoanEvent,
  LoanModel,
  LoanPaymentModel,
  LoanEventModel,
  LoanPaymentType,
  AccountModel,
  TransactionModel,
  TransactionType
} from '@soker90/finper-models'
import { roundNumber } from '../utils/roundNumber'
import {
  buildAmortizationTable,
  calcExtraInterest,
  calcMonthlyPayment,
  calcRemainingMonths,
  daysBetween,
  LoanEventInput,
  round2
} from './utils/calcLoanProjection'

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

export interface ILoanService {
  getLoans(user: string): Promise<(ILoan & { _id: string })[]>
  getLoanDetail(id: string, user: string): Promise<LoanDetail>
  createLoan(data: ILoan & { payments?: Partial<ILoanPayment>[] }): Promise<ILoan & { _id: string }>
  editLoan(id: string, data: Partial<ILoan>): Promise<ILoan & { _id: string }>
  deleteLoan(id: string): Promise<void>
  payOrdinary(id: string, user: string, params?: { date?: number, amount?: number }): Promise<ILoanPayment>
  payExtraordinary(id: string, amount: number, mode: 'reduceQuota' | 'reduceTerm', user: string, addMovement?: boolean, date?: number): Promise<ILoanPayment>
  addEvent(loanId: string, data: Omit<ILoanEvent, 'loan'>): Promise<ILoanEvent>
  deletePayment(loanId: string, paymentId: string, user: string): Promise<void>
  importPayment(id: string, data: { date: number, amount: number, type: string }, user: string): Promise<ILoanPayment>
  editPayment(loanId: string, paymentId: string, data: { date?: number, amount?: number, interest?: number, principal?: number, type?: string }, user: string): Promise<ILoanPayment>
}

export default class LoanService implements ILoanService {
  async getLoans (user: string): Promise<(ILoan & { _id: string })[]> {
    return LoanModel.find({ user }).lean() as unknown as (ILoan & { _id: string })[]
  }

  async getLoanDetail (id: string, user: string): Promise<LoanDetail> {
    const loan = await LoanModel.findOne({ _id: id, user }).lean() as unknown as ILoan & { _id: string }
    const payments = await LoanPaymentModel.find({ loan: id, user }).sort({ date: 1 }).lean() as unknown as (ILoanPayment & { _id: string })[]
    const events = await LoanEventModel.find({ loan: id, user }).sort({ date: 1 }).lean() as unknown as ILoanEvent[]

    // Current rate/payment: last event or loan defaults
    const lastEvent = events[events.length - 1]
    const currentRate = lastEvent?.newRate ?? loan.interestRate
    const currentPayment = lastEvent?.newPayment ?? loan.monthlyPayment

    const eventInputs: LoanEventInput[] = events.map(e => ({
      date: e.date,
      newRate: e.newRate,
      newPayment: e.newPayment
    }))

    const table = buildAmortizationTable(
      payments,
      loan.pendingAmount,
      currentRate,
      currentPayment,
      eventInputs,
      loan.startDate
    )

    // --- Stats ---
    const realRows = table.filter(r => !r.isProjected)
    const projectedRows = table.filter(r => r.isProjected)

    const ordinaryPayments = realRows.filter(r => r.type === LoanPaymentType.ORDINARY)
    const extraordinaryPayments = realRows.filter(r => r.type === LoanPaymentType.EXTRAORDINARY)

    const paidPrincipal = round2(realRows.reduce((s, r) => s + r.principal, 0))
    const paidInterest = round2(realRows.reduce((s, r) => s + r.interest, 0))
    const pendingPrincipal = loan.pendingAmount
    const estimatedPendingInterest = round2(projectedRows.reduce((s, r) => s + r.interest, 0))
    const totalCostToDate = round2(realRows.reduce((s, r) => s + r.amount, 0))
    const estimatedTotalCost = round2(totalCostToDate + projectedRows.reduce((s, r) => s + r.amount, 0))

    const totalOrdinaryAmount = round2(ordinaryPayments.reduce((s, r) => s + r.amount, 0))
    const totalExtraordinaryAmount = round2(extraordinaryPayments.reduce((s, r) => s + r.amount, 0))

    const savedByExtraordinary = round2((loan.initialEstimatedCost ?? 0) - estimatedTotalCost)

    const lastProjected = projectedRows[projectedRows.length - 1]
    const estimatedEndDate = lastProjected?.date ?? null

    const stats: LoanStats = {
      paidPrincipal,
      paidInterest,
      pendingPrincipal,
      estimatedPendingInterest,
      totalCostToDate,
      estimatedTotalCost,
      ordinaryPaymentsCount: ordinaryPayments.length,
      extraordinaryPaymentsCount: extraordinaryPayments.length,
      totalOrdinaryAmount,
      totalExtraordinaryAmount,
      savedByExtraordinary,
      estimatedEndDate,
      currentPayment,
      currentRate
    }

    return { ...loan, stats, amortizationTable: table }
  }

  async createLoan (data: ILoan & { payments?: Partial<ILoanPayment>[] }): Promise<ILoan & { _id: string }> {
    const { payments, ...loanData } = data
    if (!loanData.pendingAmount) loanData.pendingAmount = loanData.initialAmount

    const initialProjection = buildAmortizationTable(
      [],
      loanData.initialAmount,
      loanData.interestRate,
      loanData.monthlyPayment,
      [],
      loanData.startDate
    )
    loanData.initialEstimatedCost = round2(initialProjection.reduce((s, r) => s + r.amount, 0))
    const loan = await LoanModel.create(loanData) as unknown as ILoan & { _id: string }

    // Import historical payments if provided
    if (payments && payments.length > 0) {
      let accumulatedPrincipal = 0
      let pending = loan.initialAmount

      const toInsert = payments
        .sort((a: Partial<ILoanPayment>, b: Partial<ILoanPayment>) => (a.date ?? 0) - (b.date ?? 0))
        .map((p: Partial<ILoanPayment>) => {
          const principal = p.principal ?? round2(p.amount! - (p.interest ?? 0))
          accumulatedPrincipal = round2(accumulatedPrincipal + principal)
          pending = round2(pending - principal)
          return {
            loan: loan._id,
            date: p.date,
            amount: p.amount,
            interest: p.interest ?? 0,
            principal,
            accumulatedPrincipal,
            pendingCapital: pending,
            type: p.type ?? LoanPaymentType.ORDINARY,
            user: loan.user
          }
        })

      await LoanPaymentModel.insertMany(toInsert)
      await LoanModel.updateOne({ _id: loan._id }, { pendingAmount: pending })
      loan.pendingAmount = pending
    }

    return loan
  }

  async editLoan (id: string, data: Partial<ILoan>): Promise<ILoan & { _id: string }> {
    return LoanModel.findByIdAndUpdate(id, data, { new: true }).lean() as unknown as ILoan & { _id: string }
  }

  async deleteLoan (id: string): Promise<void> {
    await Promise.all([
      LoanModel.findByIdAndDelete(id),
      LoanPaymentModel.deleteMany({ loan: id }),
      LoanEventModel.deleteMany({ loan: id })
    ])
  }

  async payOrdinary (id: string, user: string, params?: { date?: number, amount?: number }): Promise<ILoanPayment> {
    const loan = await LoanModel.findOne({ _id: id, user }).lean() as unknown as ILoan & { _id: string }
    const events = await LoanEventModel.find({ loan: id, user }).sort({ date: 1 }).lean() as unknown as ILoanEvent[]
    const lastPayment = await LoanPaymentModel.findOne({ loan: id, user }).sort({ date: -1 }).lean() as unknown as ILoanPayment | null

    const lastEvent = events[events.length - 1]
    const currentRate = lastEvent?.newRate ?? loan.interestRate
    const currentPayment = lastEvent?.newPayment ?? loan.monthlyPayment

    const r = currentRate / 100 / 12
    const baseInterest = round2(loan.pendingAmount * r)
    const extraInterest = round2(loan.pendingExtraInterest ?? 0)

    // El principal siempre es el calculado normalmente (currentPayment - interés base).
    // Si el usuario pasa un importe concreto, la diferencia respecto al estándar son los intereses.
    const principalPart = round2(Math.min(currentPayment - baseInterest, loan.pendingAmount))
    const amount = params?.amount ?? round2(baseInterest + extraInterest + principalPart)
    const interestPart = round2(amount - principalPart)

    const lastAcc = lastPayment?.accumulatedPrincipal ?? 0
    const accumulatedPrincipal = round2(lastAcc + principalPart)
    const pendingCapital = round2(loan.pendingAmount - principalPart)

    const payment = await LoanPaymentModel.create({
      loan: id,
      date: params?.date ?? Date.now(),
      amount,
      interest: interestPart,
      principal: principalPart,
      accumulatedPrincipal,
      pendingCapital,
      type: LoanPaymentType.ORDINARY,
      user
    })

    await LoanModel.updateOne({ _id: id }, { pendingAmount: pendingCapital, pendingExtraInterest: 0 })
    await this._deductFromAccount(loan.account.toString(), amount)

    if (loan.category) {
      await TransactionModel.create({
        date: payment.date,
        category: loan.category,
        amount,
        type: TransactionType.Expense,
        account: loan.account,
        user
      })
    }

    return payment as unknown as ILoanPayment
  }

  async payExtraordinary (id: string, amount: number, mode: 'reduceQuota' | 'reduceTerm', user: string, addMovement = true, date?: number): Promise<ILoanPayment> {
    const loan = await LoanModel.findOne({ _id: id, user }).lean() as unknown as ILoan & { _id: string }
    const events = await LoanEventModel.find({ loan: id, user }).sort({ date: 1 }).lean() as unknown as ILoanEvent[]
    const lastPayment = await LoanPaymentModel.findOne({ loan: id, user }).sort({ date: -1 }).lean() as unknown as ILoanPayment | null

    const lastEvent = events[events.length - 1]
    const currentRate = lastEvent?.newRate ?? loan.interestRate
    const currentPayment = lastEvent?.newPayment ?? loan.monthlyPayment

    // Interés de días acumulados desde la última cuota ordinaria hasta la fecha de la amortización.
    // Se almacena en pendingExtraInterest del préstamo y se suma en la siguiente cuota ordinaria.
    const lastOrdinaryPayment = await LoanPaymentModel.findOne({ loan: id, user, type: LoanPaymentType.ORDINARY }).sort({ date: -1 }).lean() as unknown as ILoanPayment | null
    const lastOrdinaryDate = lastOrdinaryPayment?.date ?? loan.startDate
    const amortizationDate = date ?? Date.now()
    const days = daysBetween(lastOrdinaryDate, amortizationDate)
    const extraInterest = calcExtraInterest(amount, currentRate, days)

    // La amortización extraordinaria aplica íntegramente a capital (interest = 0)
    const principal = round2(amount)
    const lastAcc = lastPayment?.accumulatedPrincipal ?? 0
    const accumulatedPrincipal = round2(lastAcc + principal)
    const pendingCapital = round2(loan.pendingAmount - principal)

    const payment = await LoanPaymentModel.create({
      loan: id,
      date: amortizationDate,
      amount: principal,
      interest: 0,
      principal,
      accumulatedPrincipal,
      pendingCapital,
      type: LoanPaymentType.EXTRAORDINARY,
      user
    })

    let newPayment = currentPayment
    if (mode === 'reduceQuota') {
      const remaining = calcRemainingMonths(pendingCapital, currentRate, currentPayment)
      newPayment = round2(calcMonthlyPayment(pendingCapital, currentRate, remaining))
    }
    // For 'reduceTerm', keep same payment, fewer months → no update needed

    await LoanModel.updateOne(
      { _id: id },
      { pendingAmount: pendingCapital, monthlyPayment: newPayment }
    )

    if (extraInterest > 0) {
      await LoanModel.updateOne({ _id: id }, { $inc: { pendingExtraInterest: extraInterest } })
    }

    if (addMovement) {
      await this._deductFromAccount(loan.account.toString(), amount)

      if (loan.category) {
        await TransactionModel.create({
          date: payment.date,
          category: loan.category,
          amount,
          type: TransactionType.Expense,
          account: loan.account,
          user
        })
      }
    }

    return payment as unknown as ILoanPayment
  }

  async addEvent (loanId: string, data: Omit<ILoanEvent, 'loan'>): Promise<ILoanEvent> {
    const event = await LoanEventModel.create({ ...data, loan: loanId })
    // Update loan's current rate and payment
    await LoanModel.updateOne(
      { _id: loanId },
      { interestRate: data.newRate, monthlyPayment: data.newPayment }
    )
    return event as unknown as ILoanEvent
  }

  async deletePayment (loanId: string, paymentId: string, user: string): Promise<void> {
    const payment = await LoanPaymentModel.findOne({ _id: paymentId, loan: loanId, user }).lean() as unknown as ILoanPayment
    if (!payment) return

    const loan = await LoanModel.findOne({ _id: loanId, user }).lean() as unknown as ILoan & { _id: string }
    if (!loan) return

    // Reverse the account deduction using the correct account from the loan
    await this._deductFromAccount(loan.account.toString(), -payment.amount)

    // Delete the associated expense transaction (only ordinary payments generate one)
    if (payment.type === LoanPaymentType.ORDINARY) {
      await TransactionModel.findOneAndDelete({
        user,
        account: loan.account,
        amount: payment.amount,
        date: payment.date
      })
    }

    // Restore pendingAmount
    await LoanModel.updateOne(
      { _id: loanId },
      { $inc: { pendingAmount: payment.principal } }
    )

    await LoanPaymentModel.findByIdAndDelete(paymentId)
  }

  async importPayment (id: string, data: { date: number, amount: number, type: string }, user: string): Promise<ILoanPayment> {
    const loan = await LoanModel.findOne({ _id: id, user }).lean() as unknown as ILoan & { _id: string }
    const lastPayment = await LoanPaymentModel.findOne({ loan: id, user }).sort({ date: -1 }).lean() as unknown as ILoanPayment | null

    let interest: number
    let principal: number
    if (data.type === LoanPaymentType.EXTRAORDINARY) {
      interest = 0
      principal = data.amount
    } else {
      const pendingAmount = lastPayment?.pendingCapital ?? loan.pendingAmount
      interest = round2(pendingAmount * (loan.interestRate / 100 / 12))
      principal = round2(data.amount - interest)
    }

    const lastAcc = lastPayment?.accumulatedPrincipal ?? 0
    const accumulatedPrincipal = round2(lastAcc + principal)
    const pendingCapital = round2((lastPayment?.pendingCapital ?? loan.pendingAmount) - principal)

    const payment = await LoanPaymentModel.create({
      loan: id,
      date: data.date,
      amount: data.amount,
      interest,
      principal,
      accumulatedPrincipal,
      pendingCapital,
      type: data.type,
      user
    })

    await LoanModel.updateOne({ _id: id }, { pendingAmount: pendingCapital })

    return payment as unknown as ILoanPayment
  }

  async editPayment (loanId: string, paymentId: string, data: { date?: number, amount?: number, interest?: number, principal?: number, type?: string }, user: string): Promise<ILoanPayment> {
    const payment = await LoanPaymentModel.findOne({ _id: paymentId, loan: loanId, user }).lean() as unknown as ILoanPayment & { _id: string }
    if (!payment) throw new Error('Payment not found')

    const loan = await LoanModel.findOne({ _id: loanId, user }).lean() as unknown as ILoan & { _id: string }
    if (!loan) throw new Error('Loan not found')

    // Capture original values before applying changes
    const originalAmount = payment.amount
    const originalDate = payment.date
    const originalType = payment.type

    // Apply field updates to the target payment
    const updatedFields: Partial<ILoanPayment> = {}
    if (data.date !== undefined) updatedFields.date = data.date
    if (data.amount !== undefined) updatedFields.amount = data.amount
    if (data.interest !== undefined) updatedFields.interest = data.interest
    if (data.principal !== undefined) updatedFields.principal = data.principal
    if (data.type !== undefined) updatedFields.type = data.type as LoanPaymentType

    await LoanPaymentModel.updateOne({ _id: paymentId }, updatedFields)

    // Recalculate in chain: sort all payments by date, recompute accumulatedPrincipal and pendingCapital
    const allPayments = await LoanPaymentModel.find({ loan: loanId, user }).sort({ date: 1 }).lean() as unknown as (ILoanPayment & { _id: string })[]

    let accumulated = 0
    let pending = loan.initialAmount

    const bulkOps = allPayments.map(p => {
      // Use updated values for the edited payment
      const principal = p._id.toString() === paymentId ? (data.principal ?? p.principal) : p.principal
      accumulated = round2(accumulated + principal)
      pending = round2(pending - principal)
      return {
        updateOne: {
          filter: { _id: p._id },
          update: { accumulatedPrincipal: accumulated, pendingCapital: pending }
        }
      }
    })

    if (bulkOps.length > 0) {
      await LoanPaymentModel.bulkWrite(bulkOps)
    }

    await LoanModel.updateOne({ _id: loanId }, { pendingAmount: pending })

    // Adjust account balance by the difference in amount
    const newAmount = data.amount ?? originalAmount
    const amountDiff = round2(newAmount - originalAmount)
    if (amountDiff !== 0) {
      await this._deductFromAccount(loan.account.toString(), amountDiff)
    }

    // Update the linked expense transaction if the payment is/was ordinary
    const effectiveType = (data.type as LoanPaymentType | undefined) ?? originalType
    if (effectiveType === LoanPaymentType.ORDINARY || originalType === LoanPaymentType.ORDINARY) {
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

    const updated = await LoanPaymentModel.findById(paymentId).lean() as unknown as ILoanPayment
    return updated
  }

  private async _deductFromAccount (accountId: string, amount: number): Promise<void> {
    const account = await AccountModel.findById(accountId)
    if (!account) return
    await AccountModel.updateOne(
      { _id: accountId },
      { balance: roundNumber(account.balance - amount) }
    )
  }
}
