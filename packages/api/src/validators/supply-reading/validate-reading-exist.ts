import Boom from '@hapi/boom'
import { SupplyReadingModel } from '@soker90/finper-models'
import { ERROR_MESSAGE } from '../../i18n'

export const validateReadingExist = async ({ id, message, user }: { id: string, message?: string, user: string }) => {
  const reading = await SupplyReadingModel.findOne({ _id: id, user })

  if (!reading) {
    throw Boom.notFound(message || ERROR_MESSAGE.SUPPLY_READING.NOT_FOUND).output
  }
}
