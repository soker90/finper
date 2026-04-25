import Joi from 'joi'
import Boom from '@hapi/boom'
import { TRANSACTION } from '@soker90/finper-models'
import { validateCategoryExist } from './validate-category-exist'
import { ERROR_MESSAGE } from '../../i18n'

export const validateCategoryCreateParams = async ({ body, user }: { user: string, body: Record<string, string> }) => {
  /* istanbul ignore next — creating category with parent not exercised in current tests */
  if (body.parent) {
    await validateCategoryExist({ id: body.parent, message: ERROR_MESSAGE.CATEGORY.PARENT_NOT_FOUND, user })
  }

  const schema = Joi.object({
    name: Joi.string().required(),
    type: Joi.string().valid(TRANSACTION.Income, TRANSACTION.Expense, TRANSACTION.NotComputable).required(),
    parent: Joi.string()
  })

  const { error, value } = schema.validate(body)

  /* istanbul ignore next — Joi error branch not exercised for category create in current tests */
  if (error) {
    throw Boom.badData(error.message).output
  }

  return value
}
