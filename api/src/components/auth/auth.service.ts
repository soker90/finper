import {sign, verify} from 'jsonwebtoken';
import config from '../../config';

const {secret, timeout} = config.session;
/**
 * Creates a JWT token
 */
export const signToken = (user: string) => sign({user}, secret, {expiresIn: timeout});

/**
 * Verifies a JWT token
 */
export const verifyToken = async (token: string) => verify(token, secret);

