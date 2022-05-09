class InvalidLogin extends Error {
  private code: number = 401;
  /**
   * Create an instance
   *
   * @param {string} [msg=user invalid login] Message for the error
   */
  constructor(msg = 'Usuario o contraseña incorrecto') {
    super(msg);
    this.name = this.constructor.name;
  }
}

class UserNotFound extends Error {
  private code: number = 401;
  /**
   * Create an instance
   *
   * @param {string} [msg=System user not found] Message for the error
   */
  constructor(msg = 'Usuario no encontrado') {
    super(msg);
    this.name = this.constructor.name;
  }
}

class UserExist extends Error {
  private code: number = 401;
  /**
   * Create instance
   * @param {String} msg
   */
  constructor(msg = 'El usuario ya existe') {
    super(msg);
    this.name = this.constructor.name;
  }
}

class InvalidPassword extends Error {
  /**
   * Create instance
   * @param {String} msg
   */
  constructor(msg = 'La contraseña no es válida') {
    super(msg);
    this.name = this.constructor.name;
  }
}

class ExpiredToken extends Error {
  private code: number = 401;

  /**
   * Create instance
   * @param {String} msg
   */
  constructor(msg = 'El token ha expirado') {
    super(msg);
    this.name = this.constructor.name;
  }
}

class InvalidToken extends Error {
  private code: number = 401;

  /**
   * Create instance
   * @param {String} msg
   */
  constructor(msg = 'El token no es válido') {
    super(msg);
    this.name = this.constructor.name;
  }
}

export default {
  InvalidLogin,
  UserNotFound,
  UserExist,
  ExpiredToken,
  InvalidToken,
  InvalidPassword,
};
