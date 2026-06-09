import Boom from '@hapi/boom'
import { supplyReadingRepository } from '../../repositories/supply-reading.repository'
import { ERROR_MESSAGE } from '../../i18n'

export const validateReadingExist = async ({ id, message, user }: { id: string, message?: string, user: string }) => {
  const reading = supplyReadingRepository.findById(id, user)
  if (!reading) {
    throw Boom.notFound(message || ERROR_MESSAGE.SUPPLY_READING.NOT_FOUND).output
  }
}
