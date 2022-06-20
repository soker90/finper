import Joi from 'joi'
import Boom from '@hapi/boom'
import { TransactionType } from '@soker90/finper-models'

export const validateTransactionGetParams = async (query: Record<string, string>) => {
  const schema = Joi.object({
    date: Joi.number(),
    category: Joi.string(),
    amount: Joi.number(),
    type: Joi.string().valid(TransactionType.Income, TransactionType.Expense, TransactionType.NotComputable),
    account: Joi.string(),
    note: Joi.string(),
    store: Joi.string()
  })

  const { error, value } = schema.validate(query)

  if (error) {
    throw Boom.badData(error.message).output
  }

  return value
}
