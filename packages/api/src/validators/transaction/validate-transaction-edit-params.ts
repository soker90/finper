import Joi from 'joi'
import Boom from '@hapi/boom'
import { ITransaction, TransactionType } from '@soker90/finper-models'
import { validateTransactionExist } from './validate-transaction-exist'

export const validateTransactionEditParams = async ({
  params,
  body,
  user
}: { params: Record<string, string>, body: Record<string, string>, user: string }): Promise<{ id: string, value: ITransaction }> => {
  if (params.id) {
    await validateTransactionExist(params.id, user)
  }

  const schema = Joi.object({
    date: Joi.number().required(),
    category: Joi.string().required(),
    amount: Joi.number().required(),
    type: Joi.string().valid(TransactionType.Income, TransactionType.Expense, TransactionType.NotComputable).required(),
    account: Joi.string().required(),
    note: Joi.string(),
    store: Joi.string()
  })

  const { error, value } = schema.validate(body)

  if (error) {
    throw Boom.badData(error.message).output
  }

  return { id: params.id, value }
}
