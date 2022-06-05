import LokiTransport from 'winston-loki'
import morgan, { StreamOptions } from 'morgan'
import TransportStream from 'winston-transport'
import { NextFunction, Request, Response, Application } from 'express'
import { createLogger, format, Logger, transports } from 'winston'

import config from '../config'

const { combine, prettyPrint } = format

export default (app: Application): void => {
  const transportList: TransportStream[] = [
    new transports.Console({
      silent: process.env.LOG !== '1',
      format: combine(
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
        format.colorize({ all: true }),
        format.printf(
          (info) => `${info.timestamp} ${info.level}: ${info.message}`
        )
      )
    })
  ]

  if (process.env.NODE_ENV === 'prod') {
    transportList.push(new LokiTransport({
      format: prettyPrint(),
      host: config.logger.loki.host,
      silent: config.logger.loki.isActive,
      labels: { job: config.logger.loki.job },
      basicAuth: `${config.logger.loki.user}:${config.logger.loki.password}`
    }))
  }

  const logger: Logger = createLogger({
    exitOnError: true,
    transports: transportList
  })

  const morganOptions: StreamOptions = {
    write: function (message: string) {
      logger.info(message)
    }
  }

  function initLogger (req: Request, res: Response, next: NextFunction) {
    /* eslint-disable no-useless-call */
    console.log = (args) => logger.info.call(logger, args)
    console.info = (args) => logger.info.call(logger, args)
    console.warn = (args) => logger.warn.call(logger, args)
    console.error = (args) => logger.error.call(logger, args)
    console.debug = (args) => logger.debug.call(logger, args)
    /* eslint-enable */

    next()
  }

  app.use(morgan('tiny', { stream: morganOptions }))
  app.use(initLogger)
}
