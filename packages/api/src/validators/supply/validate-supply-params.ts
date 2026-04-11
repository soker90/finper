import Joi from 'joi'
import Boom from '@hapi/boom'
import { ISupply, SUPPLY_TYPE } from '@soker90/finper-models'
import { validateSupplyExist } from './validate-supply-exist'
import { validatePropertyExist } from '../property/validate-property-exist'
import { ERROR_MESSAGE } from '../../i18n'

export const validateSupplyParams = async ({ params, body, user }: { params?: Record<string, string>, body: Record<string, string>, user: string }): Promise<{ id?: string, value: ISupply }> => {
  if (params?.id) {
    await validateSupplyExist({ id: params.id, user })
  }

  if (body.propertyId) {
    await validatePropertyExist({ id: body.propertyId, user, message: ERROR_MESSAGE.PROPERTY.NOT_FOUND })
  }

  const schema = Joi.object({
    name: Joi.string().required(),
    type: Joi.string().valid(SUPPLY_TYPE.ELECTRICITY, SUPPLY_TYPE.WATER, SUPPLY_TYPE.GAS).required(),
    propertyId: Joi.string().required()
  })

  const { error, value } = schema.validate(body, { stripUnknown: true })

  if (error) {
    throw Boom.badData(error.message).output
  }

  return { id: params?.id, value: value as ISupply }
}
