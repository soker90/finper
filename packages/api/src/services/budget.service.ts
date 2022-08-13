import { BudgetModel, CategoryModel } from '@soker90/finper-models'

export interface IBudgetService {
    getBudgets({ user, year, month }: { user: string, year: number, month: number }): Promise<any[]>
}

export default class BudgetService implements IBudgetService {
  public async getBudgets ({ user, year, month }: { user: string, year: number, month?: number }): Promise<any[]> {
    // return (await BudgetModel.find({
    //   user,
    //   year,
    //   ...(month && [month])
    // }, 'month budget').populate('budget.category', 'name type')) as IBudget[]

    // const c =  CategoryModel.find({
    //     user,
    //     parent: {$exists: false}
    // }, 'name type').populate('parent', 'name type root').then(categories => {
    // }

    console.log(typeof year)
    return BudgetModel.aggregate([
      {
        $match: {
          user
          // year,
          // ...(month && { month })
        }
      },
      {
        $lookup: {
          from: 'categories',
          localField: 'budget.category',
          foreignField: '_id',
          as: 'categoriesList'
        }
      },
      {
        $project: {
          user: 1,
          month: 1,
          budget: {
            $map: {
              input: '$budget',
              as: 'budget',
              in: {
                $mergeObjects: [
                  '$$budget',
                  {
                    $first: {
                      $filter: {
                        input: '$categoriesList',
                        cond: {
                          $eq: [
                            '$$this._id',
                            '$$budget.category'
                          ]
                        }
                      }
                    }
                  }
                ]
              }
            }
          }
        }
      }

      // {
      //   $lookup: {
      //     from: 'transactions',
      //     localField: 'budget.category',
      //     foreignField: 'category',
      //     as: 'transactions'
      //   }
      // }
      // { $sort: { name: 1, children: 1 } }
    ])
  }
}
