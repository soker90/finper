db.getCollection('categories').aggregate([
    {
        $match: {
            parent: { $exists: true }
        }
    },
  {
    $lookup: {
      from: "budgets",
      localField: "_id",
      foreignField: "budget.category",
      as: "budgetsList"
    }
  },
  {
    $project: {
        name: 1,
        type: 1,
        _id: 1,
      budgetsList: {
          $map: {
              input: {
                      $filter: {
                        input: '$budgetsList.budget',
                        as: 'budget',
                        cond: [{
                            $and : [
                            {$ne: { $size: "$$budget" }, 0]},
                          { $eq: [
                            '$_id',
                            '$$budget.category'
                          ]}
                        }
                       ]
                    }
                  
                  
              },
              as: 'budgets',
              in: {
                  amount: '$$budget.amount'
              }
                  
                  
          }
      }
    }
  }
])