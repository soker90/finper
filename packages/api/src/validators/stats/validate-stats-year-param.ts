import Joi from 'joi'
import Boom from '@hapi/boom'

export const validateStatsYearParam = (year: number) => {
  const schema = Joi.number().integer().min(1900).max(2200).required()
  const { error } = schema.validate(year)

  if (error) {
    throw Boom.badData(error.message).output
  }
}
