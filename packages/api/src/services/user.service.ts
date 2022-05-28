import {
    UserModel,
} from '@soker90/finper-models';
import Boom from "@hapi/boom";

export interface IUserService {
    createUser({username, password}: Record<string, string>): Promise<Record<string, string>>
}

export default class UserService {
    private UserModel;

    constructor() {
        this.UserModel = UserModel;
    }

    private async doesUserNameExist(username: string): Promise<void> {
        const credentialDocument = await this.UserModel.findOne({username});

        if (credentialDocument) {
            if (credentialDocument.username === username) {
                throw Boom.conflict('The username already exists').output;
            }
        }
    }

    async createUser({username, password}: Record<string, string>): Promise<Record<string, string>> {
        await this.doesUserNameExist(username);

        const query = {username, password};

        const {_id} = await this.UserModel.create(query);

        return {username, _id};
    }
}


