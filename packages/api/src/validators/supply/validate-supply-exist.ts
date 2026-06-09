import Boom from '@hapi/boom'
import { supplyRepository } from '../../repositories/supply.repository'
import { ERROR_MESSAGE } from '../../i18n'

export const validateSupplyExist = async ({ id, message, user }: { id: string, message?: string, user: string }) => {
  const supply = supplyRepository.findById(id, user)
  if (!supply) {
    throw Boom.notFound(message || ERROR_MESSAGE.SUPPLY.NOT_FOUND).output
  }
}
