import express, { Request, Response, NextFunction } from 'express'
import supertest from 'supertest'
import handleError from '../handle-error'

// Mock logger to avoid test console spam
jest.mock('../../utils/logger', () => {
  return () => ({
    logError: jest.fn()
  })
})

const buildApp = (thrown: unknown) => {
  const app = express()
  app.get('/boom', (_req: Request, _res: Response, next: NextFunction) => {
    next(thrown)
  })
  // Cast needed because express types expect 4-arity for error handlers, which handleError has
  app.use(handleError)
  return app
}

describe('handleError middleware', () => {
  it('responds 500 on a generic thrown error (no payload/statusCode)', async () => {
    const res = await supertest(buildApp(new Error('DB failure'))).get('/boom').expect(500)
    expect(res.body.statusCode).toBe(500)
    expect(res.body.error).toBe('Internal Server Error')
  })

  it('respects a controlled error status code (does not turn it into 500)', async () => {
    const controlledError = {
      statusCode: 404,
      payload: { statusCode: 404, error: 'Not Found', message: 'Not found' },
      error: { code: 'NOT_FOUND_CODE' }
    }

    const res = await supertest(buildApp(controlledError)).get('/boom').expect(404)
    expect(res.body.statusCode).toBe(404)
    expect(res.body.message).toBe('Not found')
    expect(res.body.errorCode).toBe('NOT_FOUND_CODE')
  })
})
