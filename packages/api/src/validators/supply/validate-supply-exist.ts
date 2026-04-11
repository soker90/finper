import Boom from '@hapi/boom'
import { SupplyModel } from '@soker90/finper-models'
import { ERROR_MESSAGE } from '../../i18n'

export const validateSupplyExist = async ({ id, message, user }: { id: string, message?: string, user: string }) => {
  const supply = await SupplyModel.findOne({ _id: id, user })

  if (!supply) {
    throw Boom.notFound(message || ERROR_MESSAGE.SUPPLY.NOT_FOUND).output
  }
}
