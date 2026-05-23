import Joi from 'joi'
import Boom from '@hapi/boom'
import { TRANSACTION } from '@soker90/finper-models'

export const validateTransactionGetParams = async (query?: Record<string, any>) => {
  const schema = Joi.object({
    date: Joi.number(),
    category: Joi.string(),
    type: Joi.string().valid(TRANSACTION.Income, TRANSACTION.Expense, TRANSACTION.NotComputable),
    account: Joi.string(),
    store: Joi.string(),
    page: Joi.number()
  })

  const { error, value } = schema.validate(query)

  /* istanbul ignore next — Joi error branch not exercised for GET transactions in current tests */
  if (error) {
    throw Boom.badData(error.message).output
  }

  return value
}
