import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import Login from './index'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { setupServer } from 'msw/node'
import { rest } from 'msw'

const user = userEvent.setup()

const server = setupServer(
  rest.post('/api/login', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InRlc3QiLCJpYXQiOjE2NTc0MDg5NDEsImV4cCI6MjA1NzQxMjU0MX0.rkv9hF9TF0f9ebqgzEUJlsetHTFPdvzA9oyps1SF1l4' }))
  })
)

describe('Login', () => {
  beforeAll(() => server.listen())
  afterAll(() => server.close())
  afterEach(() => server.resetHandlers())

  it.skip('should redirect to dashboard', async () => {
    const { getByPlaceholderText, findByText } = render(<Login/>)
    const inputUsername = getByPlaceholderText('Introduce tu nombre de usuario')
    const inputPassword = getByPlaceholderText('Introduce tu contraseña')

    await user.type(inputUsername, 'test')
    await user.type(inputPassword, 'password')

    // const dashboardText = await findByText('Dashboard')
    expect(3).toBe(2)
  })
})
