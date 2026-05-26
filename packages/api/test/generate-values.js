"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateUsername = void 0;
const faker_1 = require("@faker-js/faker");
const inputs_1 = require("../src/config/inputs");
const generateUsername = () => faker_1.faker.internet.username().slice(0, inputs_1.MAX_USERNAME_LENGTH).toLowerCase();
exports.generateUsername = generateUsername;
