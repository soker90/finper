import { SubscriptionModel } from '@soker90/finper-models'
import Boom from '@hapi/boom'
import { ERROR_MESSAGE } from '../../i18n'

export const validateSubscriptionExist = async (id: string, user: string) => {
  const exist = await SubscriptionModel.exists({ _id: id, user })
  if (!exist) {
    throw Boom.notFound(ERROR_MESSAGE.SUBSCRIPTION.NOT_FOUND).output
  }
}
