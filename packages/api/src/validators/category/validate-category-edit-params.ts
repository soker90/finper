import Joi from 'joi'
import Boom from '@hapi/boom'
import { ICategory, TransactionType } from '@soker90/finper-models'
import { validateCategoryExist } from './validate-category-exist'
import { ERROR_MESSAGE } from '../../i18n'

export const validateCategoryEditParams = async ({
  params,
  body,
  user
}: { params: Record<string, string>, body: Record<string, string>, user: string }): Promise<{ id: string, value: ICategory }> => {
  if (params.id) {
    await validateCategoryExist({ id: params.id, user })
  }

  if (params.parent) {
    await validateCategoryExist({ id: params.parent, message: ERROR_MESSAGE.CATEGORY.PARENT_NOT_FOUND, user })
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

  return { id: params.id, value }
}
