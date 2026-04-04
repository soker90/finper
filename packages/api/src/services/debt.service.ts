import { IDebt, DebtModel, DebtType, DebtDocument } from '@soker90/finper-models'

export interface IDebtService {
  addDebt(debt: IDebt): Promise<DebtDocument>

  editDebt({ id, value }: { id: string, value: IDebt }): Promise<DebtDocument>

  getDebts(userId: string): Promise<{ to: DebtDocument[], from: DebtDocument[], debtsByPerson: { _id: string, amount: number }[] }>

  getDebtsFrom({ user, from }: { user: string, from: string }): Promise<DebtDocument[]>

  deleteDebt(id: string): Promise<void>

}

export default class DebtService implements IDebtService {
  async addDebt (debt: IDebt): Promise<DebtDocument> {
    return DebtModel.create(debt)
  }

  async editDebt ({ id, value }: { id: string, value: IDebt }): Promise<DebtDocument> {
    return DebtModel.findByIdAndUpdate(id, value, { new: true }) as unknown as DebtDocument
  }

  async getDebts (userId: string): Promise<{ to: DebtDocument[], from: DebtDocument[], debtsByPerson: { _id: string, amount: number }[] }> {
    const debtsByPerson = await DebtModel.aggregate([
      {
        $match: {
          user: userId,
          paymentDate: { $exists: false }
        }
      },
      {
        $project:
                    {
                      from: 1,
                      amountWithSign:
                            {
                              $cond: {
                                if: { $eq: ['$type', 'from'] },
                                then: '$amount',
                                else: { $multiply: ['$amount', -1] }
                              }
                            }
                    }
      },
      {
        $group: {
          _id: '$from',
          total: { $sum: '$amountWithSign' }
        }
      },
      {
        $sort: {
          _id: 1
        }
      }
    ])
      .collation({ locale: 'es' })
      .exec()
    const debts = await DebtModel.find({ user: userId })
    return {
      from: debts.filter((debt: DebtDocument) => debt.type === DebtType.FROM),
      to: debts.filter((debt: DebtDocument) => debt.type === DebtType.TO),
      debtsByPerson
    }
  }

  async getDebtsFrom ({ user, from }: { user: string, from: string }): Promise<DebtDocument[]> {
    return DebtModel.find({ from, user })
  }

  async deleteDebt (id: string): Promise<void> {
    await DebtModel.findByIdAndDelete(id)
  }
}
