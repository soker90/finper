import {
  UserModel,
} from '@soker90/finper-models';

export interface IUserService {
  createUser({ username }: Record<string, string>): Promise<void>
}

export default class UserService {
  private UserModel;

  constructor() {
    this.UserModel = UserModel;
  }

  async createUser({ username }: Record<string, string>): Promise<void> {
    await this.UserModel.create({ username });
  }
}


doesUserNameOrPasswordExist
