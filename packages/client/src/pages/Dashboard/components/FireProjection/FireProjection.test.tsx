// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { SWRConfig } from 'swr'
import { Grid } from '@mui/material'
import { server } from '../../../../mock/server'
import { render } from '../../../../test/testUtils'
import { MOCK_FIRE_PROJECTION_RESULT } from '../../../../mock/fixtures/fire-projection'
import FireProjection from './index'

const renderFresh = () =>
  render(
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
      <Grid container>
        <FireProjection chartHeight={300} />
      </Grid>
    </SWRConfig>
  )

describe('FireProjection', () => {
  it('renders the section title', () => {
    const { getByText } = renderFresh()
    expect(getByText('Proyección FIRE')).toBeDefined()
  })

  it('renders the chart card title', () => {
    const { getByText } = renderFresh()
    expect(getByText('Proyección de independencia financiera')).toBeDefined()
  })

  it('renders monthly contribution and annual return rate inputs', () => {
    const { getAllByRole } = renderFresh()
    const inputs = getAllByRole('spinbutton')
    expect(inputs.length).toBeGreaterThanOrEqual(2)
  })

  it('renders fire projection data when loaded', async () => {
    server.use(
      http.get('/wealth/fire-projection', () => HttpResponse.json(MOCK_FIRE_PROJECTION_RESULT))
    )
    const { findByText } = renderFresh()
    expect(await findByText('Patrimonio neto')).toBeDefined()
    expect(await findByText('Objetivo FIRE')).toBeDefined()
    expect(await findByText('Años para FIRE')).toBeDefined()
    expect(await findByText('Tasa de retiro')).toBeDefined()
  })

  it('shows years to fire when projection is loaded', async () => {
    server.use(
      http.get('/wealth/fire-projection', () => HttpResponse.json(MOCK_FIRE_PROJECTION_RESULT))
    )
    const { findByText } = renderFresh()
    expect(await findByText(`${MOCK_FIRE_PROJECTION_RESULT.yearsToFire} años`)).toBeDefined()
  })

  it('shows error alert when request fails', async () => {
    server.use(
      http.get('/wealth/fire-projection', () => HttpResponse.error())
    )
    const { findByText } = renderFresh()
    expect(await findByText('Error al cargar la proyección FIRE')).toBeDefined()
  })

  it('shows > 40 años when yearsToFire is null', async () => {
    server.use(
      http.get('/wealth/fire-projection', () =>
        HttpResponse.json({ ...MOCK_FIRE_PROJECTION_RESULT, yearsToFire: null })
      )
    )
    const { findByText } = renderFresh()
    expect(await findByText('> 40 años')).toBeDefined()
  })
})
