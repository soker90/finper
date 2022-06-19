import Joi from 'joi'
import Boom from '@hapi/boom'
import { TransactionType } from '@soker90/finper-models'
import { validateCategoryExist } from '../category'
import { validateAccountExist } from '../account'

export const validateTransactionCreateParams = async (params: Record<string, string>) => {
  await validateCategoryExist({ id: params.category })
  await validateAccountExist(params.account, params.user)

  const schema = Joi.object({
    date: Joi.number().required(),
    category: Joi.string().required(),
    amount: Joi.number().required(),
    type: Joi.string().valid(TransactionType.Income, TransactionType.Expense, TransactionType.NotComputable).required(),
    account: Joi.string().required(),
    note: Joi.string(),
    store: Joi.string()
  })

  const { error, value } = schema.validate(params)

  if (error) {
    throw Boom.badData(error.message).output
  }

  return value
}
