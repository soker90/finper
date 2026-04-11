import Boom from '@hapi/boom'
import { PropertyModel } from '@soker90/finper-models'
import { ERROR_MESSAGE } from '../../i18n'

export const validatePropertyExist = async ({ id, message, user }: { id: string, message?: string, user: string }) => {
  const property = await PropertyModel.findOne({ _id: id, user })

  if (!property) {
    throw Boom.notFound(message || ERROR_MESSAGE.PROPERTY.NOT_FOUND).output
  }
}
