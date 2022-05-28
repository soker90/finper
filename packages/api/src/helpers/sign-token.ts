import jwt from 'jsonwebtoken';

import config from '../config';

export default (params: Record<string, unknown>): string => (
  jwt.sign(params, config.jwt.saltRounds)
);