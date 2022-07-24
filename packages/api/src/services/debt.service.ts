import { IDebt, DebtModel } from '@soker90/finper-models'

export interface IDebtService {
    addDebt(debt: IDebt): Promise<IDebt>

    editDebt({ id, value }: { id: string, value: IDebt }): Promise<IDebt>

    getDebts(userId: string): Promise<IDebt[]>

    getDebtsFrom({ user, from }: { user: string, from: string }): Promise<IDebt[]>

    deleteDebt(id: string): Promise<void>

}

export default class DebtService implements IDebtService {
  async addDebt (debt: IDebt): Promise<IDebt> {
    return DebtModel.create(debt)
  }

  async editDebt ({ id, value }: { id: string, value: IDebt }): Promise<IDebt> {
    return DebtModel.findByIdAndUpdate(id, value, { new: true }) as unknown as IDebt
  }

  async getDebts (userId: string): Promise<IDebt[]> {
    return DebtModel.find({ user: userId })
  }

  async getDebtsFrom ({ user, from }: { user: string, from: string }): Promise<IDebt[]> {
    return DebtModel.find({ from, user })
  }

  async deleteDebt (id: string): Promise<void> {
    await DebtModel.findByIdAndDelete(id)
  }
}
