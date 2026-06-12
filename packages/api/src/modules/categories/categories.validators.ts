import Joi from 'joi'
import Boom from '@hapi/boom'
import { TRANSACTION } from '@soker90/finper-db'
import { isValidId } from '../../utils'
import { ERROR_MESSAGE } from '../../i18n'
import { categoriesRepository } from './categories.repository'

// Recupera la estructura del viejo (validators/category/*): la validación de
// existencia y de params vive en los validators; el service asume existencia.
// Diferencia con el viejo: el repositorio SQLite es síncrono, así que estos
// validators son síncronos (sin await).

const createSchema = Joi.object({
  name: Joi.string().required(),
  type: Joi.string().valid(TRANSACTION.Income, TRANSACTION.Expense, TRANSACTION.NotComputable).required(),
  parent: Joi.string(),
  budgetRuleClass: Joi.string().valid('needs', 'wants', 'savings', 'none').default('none')
})

const editSchema = Joi.object({
  name: Joi.string().required(),
  type: Joi.string().valid(TRANSACTION.Income, TRANSACTION.Expense, TRANSACTION.NotComputable).required(),
  parent: Joi.string(),
  budgetRuleClass: Joi.string().valid('needs', 'wants', 'savings', 'none')
})

export const validateCategoryExist = ({ id, message, user }: { id: string, message?: string, user: string }): void => {
  if (!isValidId(id)) {
    throw Boom.badRequest(ERROR_MESSAGE.COMMON.INVALID_ID).output
  }
  const exist = categoriesRepository.findById(id, user)
  if (!exist) {
    throw Boom.notFound(message ?? ERROR_MESSAGE.CATEGORY.NOT_FOUND).output
  }
}

export const validateCategoryCreateParams = ({ body, user }: { body: Record<string, any>, user: string }): Record<string, any> => {
  if (body.parent) {
    validateCategoryExist({ id: body.parent, message: ERROR_MESSAGE.CATEGORY.PARENT_NOT_FOUND, user })
  }

  const { error, value } = createSchema.validate(body)
  if (error) {
    throw Boom.badData(error.message).output
  }
  return value
}

export const validateCategoryEditParams = ({ params, body, user }: {
  params: Record<string, string>, body: Record<string, any>, user: string
}): { id: string, value: Record<string, any> } => {
  validateCategoryExist({ id: params.id, user })

  if (body.parent) {
    validateCategoryExist({ id: body.parent, message: ERROR_MESSAGE.CATEGORY.PARENT_NOT_FOUND, user })
  }

  const { error, value } = editSchema.validate(body)
  if (error) {
    throw Boom.badData(error.message).output
  }
  return { id: params.id, value }
}
