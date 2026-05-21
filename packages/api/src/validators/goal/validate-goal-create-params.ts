import Joi from 'joi'
import Boom from '@hapi/boom'
import { GOAL_COLORS, GOAL_ICONS } from '@soker90/finper-models'

export const validateGoalCreateParams = async (data: Record<string, unknown>) => {
  const schema = Joi.object({
    name: Joi.string().required(),
    targetAmount: Joi.number().positive().required(),
    currentAmount: Joi.number().min(0).default(0),
    deadline: Joi.date().iso().allow(null),
    color: Joi.string().valid(...GOAL_COLORS).required(),
    icon: Joi.string().valid(...GOAL_ICONS).required(),
    user: Joi.string().required()
  })

  const { error, value } = schema.validate(data)

  if (error) {
    throw Boom.badData(error.message).output
  }

  return value
}
