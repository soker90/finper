import Joi from 'joi'
import Boom from '@hapi/boom'
export const GOAL_COLORS = [
  '#4CAF50', '#2196F3', '#9C27B0', '#FF9800', '#F44336',
  '#00BCD4', '#795548', '#607D8B', '#E91E63', '#FFC107'
] as const

export const GOAL_ICONS = [
  'DollarOutlined', 'HomeOutlined', 'CarOutlined', 'LaptopOutlined',
  'HeartOutlined', 'RocketOutlined', 'GiftOutlined', 'BankOutlined',
  'TrophyOutlined', 'StarOutlined'
] as const
import { ERROR_MESSAGE } from '../../i18n'
import { isValidId } from '../../utils'
import { goalsRepository } from './goals.repository'

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

  delete value.user
  return value
}

export const validateGoalExist = async ({ id, user }: { id: string, user: string }) => {
  if (!isValidId(id)) {
    throw Boom.badRequest(ERROR_MESSAGE.COMMON.INVALID_ID).output
  }
  const existing = goalsRepository.findById(id, user)
  if (!existing) {
    throw Boom.notFound(ERROR_MESSAGE.GOAL.NOT_FOUND).output
  }
}

export const validateGoalEditParams = async ({
  params,
  body,
  user
}: { params: Record<string, string>, body: Record<string, unknown>, user: string }): Promise<{ id: string, user: string, value: Record<string, unknown> }> => {
  await validateGoalExist({ id: params.id, user })

  const schema = Joi.object({
    name: Joi.string(),
    targetAmount: Joi.number().positive(),
    deadline: Joi.date().iso().allow(null),
    color: Joi.string().valid(...GOAL_COLORS),
    icon: Joi.string().valid(...GOAL_ICONS)
  })

  const { error, value } = schema.validate(body)

  if (error) {
    throw Boom.badData(error.message).output
  }

  return { id: params.id, user, value }
}

export const validateGoalFundParams = async ({
  params,
  body,
  user
}: { params: Record<string, string>, body: Record<string, unknown>, user: string }): Promise<{ id: string, user: string, amount: number }> => {
  await validateGoalExist({ id: params.id, user })

  const schema = Joi.object({
    amount: Joi.number().positive().required()
  })

  const { error, value } = schema.validate(body)

  if (error) {
    throw Boom.badData(error.message).output
  }

  return { id: params.id, user, amount: value.amount }
}
