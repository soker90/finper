import Joi from 'joi'
import Boom from '@hapi/boom'
import { TransactionType } from '@soker90/finper-models'
import { validateCategoryExist } from './validate-category-exist'
import { ERROR_MESSAGE } from '../../i18n'

export const validateCategoryCreateParams = async (params: Record<string, string>) => {
  if (params.parent) {
    await validateCategoryExist({ id: params.parent, message: ERROR_MESSAGE.CATEGORY.PARENT_NOT_FOUND })
  }

  const schema = Joi.object({
    name: Joi.string().required(),
    type: Joi.string().valid(TransactionType.Income, TransactionType.Expense, TransactionType.NotComputable).required(),
    parent: Joi.string()
  })

  const { error, value } = schema.validate(params)

  if (error) {
    throw Boom.badData(error.message).output
  }

  return value
}
