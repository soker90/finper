import {
  type IPension,
  PensionModel
} from '@soker90/finper-models'

interface PensionsResponse {
    amount: number;
    units: number;
    employeeAmount: number;
    companyAmount: number;
    transactions: IPension[]
}

export interface IPensionService {
    getPensions(user: string): Promise<any>

    // editPension({ date, value, companyAmount, employeeAmount, employeeUnits, companyUnits }: IPension): Promise<IPension>
}

export default class PensionService implements IPensionService {
  public async getPensions (user: string): Promise<any> {
    const stats = await PensionModel.aggregate([
      {
        $match: {
          user
        }
      },
      {
        $group: {
          _id: '$user',
          amount: { $sum: { $sum: ['$employeeAmount', '$companyAmount'] } },
          units: { $sum: { $sum: ['$employeeUnits', '$companyUnits'] } },
          employeeAmount: { $sum: '$employeeAmount' },
          companyAmount: { $sum: '$companyAmount' }
        }
      },
      {
        $sort: {
          date: -1
        }
      }
    ])
      .collation({ locale: 'es' })
      .exec().then(res => {
        const firstElement = res?.[0]
        return {
          amount: firstElement?.amount ?? 0,
          units: firstElement?.units ?? 0,
          employeeAmount: firstElement?.employeeAmount ?? 0,
          companyAmount: firstElement?.companyAmount ?? 0
        }
      })
    const transactions = await PensionModel.find({ user }).sort({ date: -1 })

    return { ...stats, transactions, total: stats.amount * stats.units }
  }
}
