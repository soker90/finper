"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestLogin = void 0;
const faker_1 = require("@faker-js/faker");
const inputs_1 = require("../src/config/inputs");
const supertest_1 = __importDefault(require("supertest"));
const insert_data_to_model_1 = require("./insert-data-to-model");
const defaultCredentials = {
    username: faker_1.faker.internet.username().slice(0, inputs_1.MAX_USERNAME_LENGTH).toLowerCase(),
    password: faker_1.faker.internet.password({ length: inputs_1.MIN_PASSWORD_LENGTH - 1 })
};
const defaultApp = require('../src/server').app;
const requestLogin = (app = defaultApp, credentials = defaultCredentials) => {
    if (!credentials.password) {
        credentials.password = defaultCredentials.password;
    }
    return (0, insert_data_to_model_1.insertCredentials)(credentials).then(() => ((0, supertest_1.default)(app)
        .post('/api/auth/login')
        .send({
        username: credentials.username,
        password: credentials.password
    })
        .then(res => res.body.token)))
        .catch(/* istanbul ignore next */ (err) => {
        console.error(err);
        throw err;
    });
};
exports.requestLogin = requestLogin;
