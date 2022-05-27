import bcrypt from 'bcrypt';
import Boom from '@hapi/boom';
import jwt from 'jsonwebtoken';

import { UserModel } from '@soker90/finper-models';

export interface IAccountService {
  getSignedToken(username: string): string
  createAccountIfUserAndEmailNotExist({ username, password }: Record<string, string>): Promise<Record<string, string>>
}

export default class AccountService implements IAccountService {
  private jwtConfig;

  private CredentialModel;

  constructor(jwtConfig: Record<string, string|number>) {
    this.jwtConfig = jwtConfig;
    this.CredentialModel = UserModel;
  }

  async _doesUserNameOrPasswordExist(username: string): Promise<void> {
    const credentialDocument = await this.CredentialModel.findOne({ username });

    if (credentialDocument) {
      if (credentialDocument.username === username) {
        throw Boom.conflict('The username already exists').output;
      }
    }
  }

  getSignedToken(username: string): string {
    return jwt.sign({ username }, this.jwtConfig.secret as string, { expiresIn: this.jwtConfig.timeout });
  }

  async createAccountIfUserAndEmailNotExist({ username, password }: Record<string, string>): Promise<Record<string, string>> {
    await this._doesUserNameOrPasswordExist(username);

    const query = { username, password };

    const { _id } = await this.CredentialModel.create(query);

    return { username, _id };
  }
}
