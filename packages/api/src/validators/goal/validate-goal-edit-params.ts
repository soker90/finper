import Joi from 'joi'
import Boom from '@hapi/boom'
import { GOAL_COLORS, GOAL_ICONS } from '@soker90/finper-models'
import { validateGoalExist } from './validate-goal-exist'

export const validateGoalEditParams = async ({
  params,
  body,
  user
}: { params: Record<string, string>, body: Record<string, unknown>, user: string }): Promise<{ id: string, value: Record<string, unknown> }> => {
  await validateGoalExist({ id: params.id, user })

  const schema = Joi.object({
    name: Joi.string(),
    targetAmount: Joi.number().positive(),
    currentAmount: Joi.number().min(0),
    deadline: Joi.date().iso().allow(null),
    color: Joi.string().valid(...GOAL_COLORS),
    icon: Joi.string().valid(...GOAL_ICONS)
  })

  const { error, value } = schema.validate(body)

  if (error) {
    throw Boom.badData(error.message).output
  }

  return { id: params.id, value }
}
