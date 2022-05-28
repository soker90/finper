import bcrypt from 'bcrypt';

import config from '../config';

export default (password: string): string => (
  bcrypt.hashSync(password, Number(config.jwt.saltRounds))
);