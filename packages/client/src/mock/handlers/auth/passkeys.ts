import { http, HttpResponse } from 'msw'

export const PASSKEY_USERNAMES = {
  hasCredential: 'haspasskey',
  noCredential: 'nopasskey'
} as const

const SESSION_TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InRlc3QiLCJpYXQiOjE2NTc0MDg5NDEsImV4cCI6MjA1NzQxMjU0MX0.rkv9hF9TF0f9ebqgzEUJlsetHTFPdvzA9oyps1SF1l4'

export const passkeysHandlers = [
  http.post('/auth/webauthn/registration-options', () =>
    HttpResponse.json({ options: { challenge: 'reg-challenge' }, challengeToken: 'reg-challenge-token' })
  ),

  http.post('/auth/webauthn/registration-verify', () => new HttpResponse(null, { status: 204 })),

  http.post('/auth/webauthn/authentication-options', async ({ request }) => {
    const { username } = await request.json() as { username: string }

    if (username === PASSKEY_USERNAMES.noCredential) {
      return HttpResponse.json(
        { statusCode: 404, error: 'Not Found', message: 'No hay huella registrada para este usuario' },
        { status: 404 }
      )
    }

    return HttpResponse.json({ options: { challenge: 'auth-challenge' }, challengeToken: 'auth-challenge-token' })
  }),

  http.post('/auth/webauthn/authentication-verify', () => HttpResponse.json({ token: SESSION_TOKEN }))
]
