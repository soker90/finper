import Boom from '@hapi/boom'
import { propertyRepository } from '../../repositories/property.repository'
import { ERROR_MESSAGE } from '../../i18n'

export const validatePropertyExist = async ({ id, message, user }: { id: string, message?: string, user: string }) => {
  const property = propertyRepository.findById(id, user)
  if (!property) {
    throw Boom.notFound(message || ERROR_MESSAGE.PROPERTY.NOT_FOUND).output
  }
}
