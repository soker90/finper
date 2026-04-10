import Boom from '@hapi/boom'
import { ERROR_MESSAGE } from '../../i18n'

export const validateSubscriptionLinkParams = ({ id, transactionIds, user }: Record<string, any>) => {
  if (!Array.isArray(transactionIds) || transactionIds.length === 0) {
    throw Boom.badData(ERROR_MESSAGE.SUBSCRIPTION.TRANSACTION_IDS_REQUIRED).output
  }
  return { id, transactionIds, user }
}
