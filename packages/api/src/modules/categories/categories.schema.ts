import Joi from 'joi'
import Boom from '@hapi/boom'
import { TRANSACTION } from '@soker90/finper-models'

// Joi puro (sin lookup a BD). La validación de existencia del parent la hace
// el service contra el repositorio SQLite (igual que pensions.schema.ts).
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

export const validateCategoryCreateParams = (body: Record<string, any>) => {
  const { error, value } = createSchema.validate(body)
  if (error) {
    throw Boom.badData(error.message).output
  }
  return value
}

export const validateCategoryEditParams = (body: Record<string, any>) => {
  const { error, value } = editSchema.validate(body)
  if (error) {
    throw Boom.badData(error.message).output
  }
  return value
}
