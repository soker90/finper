import Boom from '@hapi/boom'

export const validateSubscriptionLinkParams = ({ id, transactionIds, user }: Record<string, any>) => {
  if (!Array.isArray(transactionIds) || transactionIds.length === 0) {
    throw Boom.badData('transactionIds must be a non-empty array').output
  }
  return { id, transactionIds, user }
}
