import { TransactionModel } from '@soker90/finper-models'

export const getTransactionsSumByMonth = async ({
  user,
  year,
  month
}: { user: string, year: number, month?: number }) => {
  return TransactionModel.aggregate([
    {
      $match: {
        user,
        date: {
          $gte: new Date(year, month || 0).getTime(),
          $lt: new Date(Number(month ? year : year + 1), Number(month ? month + 1 : 0)).getTime()
        }
      }
    },
    {
      $group: {
        _id: {
          month: {
            $month: { date: { $toDate: '$date' }, timezone: 'Europe/Madrid' }
          },
          category: '$category'
        },
        total: { $sum: '$amount' }
      }
    },
    { $sort: { '_id.month': 1 } }
  ])
}
