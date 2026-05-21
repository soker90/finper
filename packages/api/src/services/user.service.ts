import {
  UserModel
} from '@soker90/finper-models'
import Boom from '@hapi/boom'
import { ERROR_MESSAGE } from '../i18n'

export interface IUserService {
  createUser({ username, password }: Record<string, string>): Promise<Record<string, string>>
}

export default class UserService implements IUserService {
  private UserModel

  constructor () {
    this.UserModel = UserModel
  }

  private async doesUserNameExist (username: string): Promise<void> {
    const credentialDocument = await this.UserModel.findOne({ username })

    if (credentialDocument) {
      /* istanbul ignore else — credentialDocument.username always equals username since we find by username */
      if (credentialDocument.username === username) {
        throw Boom.conflict(ERROR_MESSAGE.USER.ALREADY_EXISTS).output
      }
    }
  }

  async createUser ({ username, password }: Record<string, string>): Promise<Record<string, string>> {
    await this.doesUserNameExist(username)

    const query = { username, password }

    const { _id } = await this.UserModel.create(query)

    return { username, _id: _id as any }
  }
}
