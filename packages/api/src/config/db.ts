const models = require('@soker90/finper-models')

interface IConnect {
    user: string,
    pass: string,
    host: string[],
    databaseName: string,
    options: Record<string, unknown>,
    mongoUri?: string;
}

export default {
  connect: ({ user, pass, host, databaseName, mongoUri, options = {} }: IConnect): void => {
    const userPass = user && pass ? `${user}:${pass}@` : ''

    const hostProperty = ([] as string[]).concat(host)
    const hosts = hostProperty.reduce((s, h, i) => `${s}${i > 0 ? ',' : ''}${h}`, '')

    let uri = mongoUri || `mongodb://${userPass}${hosts}/${databaseName}`
    uri += '?retryWrites=true&w=majority'

    if (process.env.NODE_ENV !== 'test') {
      models.connect(uri, options)
    }
  }
}
