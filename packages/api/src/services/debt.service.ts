import { IDebt, DebtModel, DEBT, DebtDocument } from '@soker90/finper-models'
import Boom from '@hapi/boom'
import { ERROR_MESSAGE } from '../i18n'

export interface IDebtService {
  addDebt(debt: IDebt): Promise<DebtDocument>

  editDebt({ id, value }: { id: string, value: IDebt }): Promise<DebtDocument>

  getDebts(userId: string): Promise<{ to: DebtDocument[], from: DebtDocument[], debtsByPerson: { _id: string, amount: number }[] }>

  getDebtsFrom({ user, from }: { user: string, from: string }): Promise<DebtDocument[]>

  deleteDebt(id: string): Promise<void>

  payDebt({ id, amount }: { id: string, amount: number }): Promise<DebtDocument | null>

}

export default class DebtService implements IDebtService {
  public async addDebt (debt: IDebt): Promise<DebtDocument> {
    return DebtModel.create(debt)
  }

  public async editDebt ({ id, value }: { id: string, value: IDebt }): Promise<DebtDocument> {
    const updated = await DebtModel.findByIdAndUpdate<DebtDocument>(id, value, { returnDocument: 'after' })
    /* istanbul ignore next — validator validateDebtExist runs before this method via route */
    if (!updated) throw Boom.notFound(ERROR_MESSAGE.DEBT.NOT_FOUND).output
    return updated
  }

  public async getDebts (userId: string): Promise<{ to: DebtDocument[], from: DebtDocument[], debtsByPerson: { _id: string, amount: number }[] }> {
    const debtsByPerson = await DebtModel.aggregate([
      {
        $match: {
          user: userId
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
      from: debts.filter((debt: DebtDocument) => debt.type === DEBT.FROM),
      to: debts.filter((debt: DebtDocument) => debt.type === DEBT.TO),
      debtsByPerson
    }
  }

  public async getDebtsFrom ({ user, from }: { user: string, from: string }): Promise<DebtDocument[]> {
    return DebtModel.find({ from, user })
  }

  public async deleteDebt (id: string): Promise<void> {
    const deleted = await DebtModel.findByIdAndDelete(id)
    /* istanbul ignore next — validator validateDebtExist runs before this method via route */
    if (!deleted) throw Boom.notFound(ERROR_MESSAGE.DEBT.NOT_FOUND).output
  }

  public async payDebt ({ id, amount }: { id: string, amount: number }): Promise<DebtDocument | null> {
    const debt = await DebtModel.findById<DebtDocument>(id)

    const remaining = debt!.amount - amount
    if (remaining <= 0) {
      await DebtModel.findByIdAndDelete(id)
      return null
    }

    return DebtModel.findByIdAndUpdate<DebtDocument>(id, { amount: remaining }, { returnDocument: 'after' })
  }
}
