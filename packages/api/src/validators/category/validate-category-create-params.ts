import Joi from 'joi'
import Boom from '@hapi/boom'
import { TransactionType } from '@soker90/finper-models'
import { validateCategoryExist } from './validate-category-exist'
import { ERROR_MESSAGE } from '../../i18n'

export const validateCategoryCreateParams = async ({ body, user }: { user: string, body: Record<string, string> }) => {
  if (body.parent) {
    await validateCategoryExist({ id: body.parent, message: ERROR_MESSAGE.CATEGORY.PARENT_NOT_FOUND, user })
  }

  const schema = Joi.object({
    name: Joi.string().required(),
    type: Joi.string().valid(TransactionType.Income, TransactionType.Expense, TransactionType.NotComputable).required(),
    parent: Joi.string()
  })

  const { error, value } = schema.validate(body)

  if (error) {
    throw Boom.badData(error.message).output
  }

  return value
}
