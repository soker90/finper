import { ILoan, LoanModel } from '@soker90/finper-models'

export interface ILoanService {
    getLoans(filters: { user: string }): Promise<ILoan[]>

}

export default class LoanService implements ILoanService {
  public async getLoans (filters: { user: string }): Promise<ILoan[]> {
    return LoanModel.find(filters)
      .collation({ locale: 'es' })
      .sort({ name: 1 })
  }
}
