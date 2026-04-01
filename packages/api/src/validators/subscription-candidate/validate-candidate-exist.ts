import { SubscriptionCandidateModel } from '@soker90/finper-models'
import Boom from '@hapi/boom'
import { ERROR_MESSAGE } from '../../i18n'

export const validateCandidateExist = async (id: string, user: string) => {
  const exist = await SubscriptionCandidateModel.exists({ _id: id, user })
  if (!exist) {
    throw Boom.notFound(ERROR_MESSAGE.SUBSCRIPTION_CANDIDATE.NOT_FOUND).output
  }
}
