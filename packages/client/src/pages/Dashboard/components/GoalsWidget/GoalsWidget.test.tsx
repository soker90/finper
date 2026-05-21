// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { SWRConfig } from 'swr'
import { Grid } from '@mui/material'
import { server } from '../../../../mock/server'
import { render } from '../../../../test/testUtils'
import GoalsWidget from './index'

const renderFresh = () =>
  render(
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
      <Grid container>
        <GoalsWidget />
      </Grid>
    </SWRConfig>
  )

describe('GoalsWidget', () => {
  it('renders nothing while goals are loading', () => {
    const { container } = renderFresh()
    expect(container.textContent).not.toContain('Metas de ahorro')
  })

  it('renders nothing when there are no goals', async () => {
    server.use(
      http.get('/goals', () => HttpResponse.json([]))
    )
    const { container, queryByText } = renderFresh()
    // Settle SWR: trigger one tick before asserting
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(queryByText('Metas de ahorro')).toBeNull()
    expect(container.textContent).toBe('')
  })

  it('renders a card per goal with name, current amount and progress', async () => {
    server.use(
      http.get('/goals', () => HttpResponse.json([
        { _id: 'g1', name: 'Coche', targetAmount: 10000, currentAmount: 2500, color: '#2196F3', icon: 'CarOutlined' },
        { _id: 'g2', name: 'Vacaciones', targetAmount: 1000, currentAmount: 500, color: '#4CAF50', icon: 'RocketOutlined' }
      ]))
    )
    const { findByText } = renderFresh()
    expect(await findByText('Metas de ahorro')).toBeDefined()
    expect(await findByText('Coche')).toBeDefined()
    expect(await findByText('Vacaciones')).toBeDefined()
    expect(await findByText(/25% completado/)).toBeDefined()
    expect(await findByText(/50% completado/)).toBeDefined()
  })

  it('caps progress at 100% when current exceeds target', async () => {
    server.use(
      http.get('/goals', () => HttpResponse.json([
        { _id: 'g1', name: 'Coche', targetAmount: 100, currentAmount: 500, color: '#2196F3', icon: 'CarOutlined' }
      ]))
    )
    const { findByText } = renderFresh()
    expect(await findByText(/100% completado/)).toBeDefined()
  })
})
