import supertest from 'supertest';
import {
  mongoose,
  UserModel,
} from '@soker90/finper-models';
import { faker } from '@faker-js/faker';

import { server } from '../../src/server';
import { insertCredentials } from '../insert-data-to-model';
import { MAX_USERNAME_LENGTH, MIN_PASSWORD_LENGTH } from '../../src/config/inputs';

const testDatabase = require('../test-db')(mongoose);

function getUsername(): string {
  return faker.internet.userName().slice(0, MAX_USERNAME_LENGTH);
}

describe('Account', () => {
  beforeAll(() => testDatabase.connect());

  afterAll(() => testDatabase.close());

  describe('POST /register', () => {
    const path = '/api/account/register';

    test('when no params provided, it should response an error with status code 422', async () => {
      await supertest(server.app).post(path).expect(422);
    });

    test('when no username param provided, it should response an error with status code 422', async () => {
      await supertest(server.app)
        .post(path)
        .send({
          password: faker.internet.password(MIN_PASSWORD_LENGTH),
        })
        .expect(422);
    });

    test('when username\'s length is less than 3 characters, it should response an error with status code 422', async () => {
      await supertest(server.app)
        .post(path)
        .send({
          username: 't',
          password: faker.internet.password(MIN_PASSWORD_LENGTH),
        })
        .expect(422);
    });

    test('when username\'s length is more than 15 characters, it should response an error with status code 422', async () => {
      await supertest(server.app)
        .post(path)
        .send({
          username: 'aaaaaaaaaaaaaaaa',
          password: faker.internet.password(MIN_PASSWORD_LENGTH),
        })
        .expect(422);
    });

    test('when no password param provided, it should response an error with status code 422', async () => {
      await supertest(server.app)
        .post(path)
        .send({
          username: faker.internet.userName(),
        })
        .expect(422);
    });

    test('when password\'s length is less than 5 characters, it should response an error with status code 422', async () => {
      await supertest(server.app)
        .post(path)
        .send({
          username: faker.internet.userName(),
          password: faker.internet.password(MIN_PASSWORD_LENGTH - 1),
        })
        .expect(422);
    });

    describe('when trying to create another account with an existing username', () => {
      let response: supertest.Response;

      const username = faker.internet.userName();

      beforeAll(async () => {
        await insertCredentials({ username });

        response = await supertest(server.app)
          .post(path)
          .send({
            username,
            password: faker.internet.password(MIN_PASSWORD_LENGTH)});
      });

      afterAll(() => CredentialModel.deleteMany({}));

      test('it should response an error of 409', () => {
        expect(response.statusCode).toBe(409);
      });
    });

    describe('when success creating an account', () => {
      let response: supertest.Response;

      beforeAll(async () => {
        await insertCredentials();

        response = await supertest(server.app)
          .post(path)
          .send({
            username: getUsername(),
            password: faker.internet.password(MIN_PASSWORD_LENGTH),
          });
      });

      afterAll(() => Promise.all([
        UserModel.deleteMany(),
        CredentialModel.deleteMany(),
      ]));

      test('it should response an status code of 200', () => {
        expect(response.statusCode).toBe(200);
      });

      test('it should response with the jwt token', () => {
        expect(response.body.token).toBeDefined();
      });

      test('it should be stored 2 documents', async () => {
        const documentCounter = await CredentialModel.countDocuments();
        expect(documentCounter).toBe(2);
      });
    });
  });

  describe('POST /login', () => {
    const path = '/api/account/login';

    test('when no params provided, it should response with a status code of 422', async () => {
      await supertest(server.app).post(path).expect(422);
    });

    test('when no user param provided, it should response an error with status code 422', async () => {
      await supertest(server.app)
        .post(path)
        .send({ password: faker.internet.password(MIN_PASSWORD_LENGTH) })
        .expect(422);
    });

    test('when no password param provided, it should response an error with status code 422', async () => {
      await supertest(server.app)
        .post(path)
        .send({ user: faker.internet.userName() })
        .expect(422);
    });

    describe('when trying to login but username doesn\'t exist', () => {
      let response: supertest.Response;

      beforeAll(async () => {
        await insertCredentials();

        response = await supertest(server.app)
          .post(path)
          .send({
            user: faker.internet.userName(),
            password: faker.internet.password(MIN_PASSWORD_LENGTH),
          });
      });

      afterAll(() => CredentialModel.deleteMany());

      test('it should response a status code of 401', () => {
        expect(response.statusCode).toBe(401);
      });
    });

    describe('when account is not active', () => {
      let response: supertest.Response;

      const password = faker.internet.password(MIN_PASSWORD_LENGTH);
      const username = faker.internet.userName();

      beforeAll(async () => {
        await insertCredentials({ password , username});
        response = await supertest(server.app).post(path).send({ username, password });
      });

      afterAll(() => CredentialModel.deleteMany());

      test('it should response an error with status code of 403', () => {
        expect(response.statusCode).toBe(403);
      });
    });

    describe('when password is not the same', () => {
      let response: supertest.Response;

      const email = faker.internet.email();
      const password = faker.internet.password(MIN_PASSWORD_LENGTH);

      beforeAll(async () => {
        await insertCredentials({ email, isAccountActive: true });
        response = await supertest(server.app).post(path).send({ user: email, password });
      });

      afterAll(() => CredentialModel.deleteMany());

      test('it should response an error code of 401', () => {
        expect(response.statusCode).toBe(401);
      });
    });

    describe('when login with email and password success and account is active', () => {
      let response: supertest.Response;

      const email = faker.internet.email();
      const password = faker.internet.password(MIN_PASSWORD_LENGTH);

      beforeAll(async () => {
        await insertCredentials({ email, password, isAccountActive: true });
        response = await supertest(server.app).post(path).send({ user: email, password });
      });

      afterAll(() => CredentialModel.deleteMany());

      test('it should response a status code of 200', () => {
        expect(response.statusCode).toBe(200);
      });
    });

    describe('when login with username and password success', () => {
      let response: supertest.Response;

      const username = getUsername();
      const password = faker.internet.password(MIN_PASSWORD_LENGTH);

      beforeAll(async () => {
        await insertCredentials({
          username,
          password,
          isAccountActive: true,
        });

        response = await supertest(server.app).post(path).send({ user: username, password });
      });

      afterAll(() => CredentialModel.deleteMany());

      test('it should response a status code of 200', () => {
        expect(response.statusCode).toBe(200);
      });
    });
  });
});
