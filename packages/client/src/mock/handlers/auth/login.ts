import { rest, RestContext, RestRequest } from 'msw'

export enum LoginUsernames {
    success = 'success',
}

interface LoginRequest extends RestRequest{
    body: {
        username: LoginUsernames,
        password: string
    }
}

const LOGIN_RESPONSE: Record<LoginUsernames, { token: string }> = {
  [LoginUsernames.success]: {
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InRlc3QiLCJpYXQiOjE2NTc0MDg5NDEsImV4cCI6MjA1NzQxMjU0MX0.rkv9hF9TF0f9ebqgzEUJlsetHTFPdvzA9oyps1SF1l4'
  }
}

export const loginHandlers = [
  rest.post('/auth/login', (req: LoginRequest, res: any, ctx: RestContext) => {
    const { username } = req.body

    return res(
      ctx.status(200),
      ctx.json(LOGIN_RESPONSE[username]))
  })
]
