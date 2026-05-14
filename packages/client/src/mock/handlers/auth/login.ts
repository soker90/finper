import { http, HttpResponse } from 'msw'

export const LOGIN_USERNAMES = {
  success: 'success',
} as const

type LoginUsernames = typeof LOGIN_USERNAMES[keyof typeof LOGIN_USERNAMES]

interface LoginRequest {
  username: LoginUsernames,
  password: string
}

const LOGIN_RESPONSE: Record<LoginUsernames, { token: string }> = {
  [LOGIN_USERNAMES.success]: {
    token:
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InRlc3QiLCJpYXQiOjE2NTc0MDg5NDEsImV4cCI6MjA1NzQxMjU0MX0.rkv9hF9TF0f9ebqgzEUJlsetHTFPdvzA9oyps1SF1l4'
  }
}

export const loginHandlers = [
  http.post('/auth/login', async ({ request }) => {
    const body = await request.json()
    const { username } = body as LoginRequest

    return HttpResponse.json(LOGIN_RESPONSE[username])
  })
]
