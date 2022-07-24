import { DebtModel } from '@soker90/finper-models'
import Boom from '@hapi/boom'
import { ERROR_MESSAGE } from '../../i18n'

export const validateDebtExist = async ({ id, message, user }: { id: string, message?: string, user: string }) => {
  const exist = await DebtModel.exists({ _id: id, user })
  if (!exist) {
    throw Boom.notFound(message || ERROR_MESSAGE.DEBT.NOT_FOUND).output
  }
}
