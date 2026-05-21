import { Types, AccountModel } from '@soker90/finper-models'
import Boom from '@hapi/boom'
import { ERROR_MESSAGE } from '../../i18n'

export const validateAccountTransferExist = async (params: { user: string, sourceId: string, destinationId: string, amount: number }) => {
  const { user, sourceId, destinationId, amount } = params

  if (!Types.ObjectId.isValid(sourceId) || !Types.ObjectId.isValid(destinationId)) {
    throw Boom.badRequest(ERROR_MESSAGE.COMMON.INVALID_ID).output
  }

  const sourceAccount = await AccountModel.findOne({ _id: sourceId, user }, 'balance')
  if (!sourceAccount) {
    throw Boom.notFound(ERROR_MESSAGE.ACCOUNT.NOT_FOUND).output
  }

  const destinationAccount = await AccountModel.exists({ _id: destinationId, user })
  if (!destinationAccount) {
    throw Boom.notFound(ERROR_MESSAGE.ACCOUNT.NOT_FOUND).output
  }

  if (sourceAccount.balance < amount) {
    throw Boom.badRequest('Insufficient balance').output
  }

  return params
}
