// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { SWRConfig } from 'swr'
import { server } from '../../mock/server'
import { render } from '../../test/testUtils'
import Yields from './index'
import { YIELDS_LIST } from '../../mock/handlers/yields'
import { calcTotalNet } from './utils'
import { format } from 'utils'

const renderFresh = () =>
  render(
    <SWRConfig value={{ provider: () => new Map() }}>
      <Yields />
    </SWRConfig>
  )

describe('Yields', () => {
  it('renders skeleton while loading', () => {
    const { container } = render(<Yields />)
    expect(container.querySelector('.MuiSkeleton-root')).not.toBeNull()
  })

  it('renders empty state when there are no yields', async () => {
    server.use(
      http.get('/yields', () => HttpResponse.json([]))
    )
    const { findByText } = renderFresh()
    expect(await findByText(/todavía no tienes ningún rendimiento/i)).toBeDefined()
  })

  it('renders yield cards after data loads', async () => {
    const { findAllByText } = renderFresh()
    const cards = await findAllByText(/Intereses Cuenta Naranja|Cashback recibos luz|Intereses MyInvestor/)
    expect(cards.length).toBeGreaterThanOrEqual(1)
  })

  it('renders summary KPI cards', async () => {
    const { findByText } = renderFresh()
    expect(await findByText('Neto acumulado')).toBeDefined()
    expect(await findByText('Rendimientos')).toBeDefined()
    expect(await findByText('Movimientos enlazados')).toBeDefined()
  })

  it('KPI "Rendimientos" reflects the number of yields', async () => {
    const { findByText } = renderFresh()
    expect(await findByText(String(YIELDS_LIST.length))).toBeDefined()
  })

  it('KPI "Neto acumulado" reflects the sum of all yields', async () => {
    const { findAllByText } = renderFresh()
    const total = calcTotalNet(YIELDS_LIST as any)
    const expected = format.euro(total).replace(/\s/g, '\\s')
    const matches = await findAllByText(new RegExp(expected))
    expect(matches.length).toBeGreaterThanOrEqual(1)
  })

  it('shows Nuevo button in the header', async () => {
    const { findByText } = renderFresh()
    expect(await findByText('Nuevo')).toBeDefined()
  })

  it('click "Nuevo" opens YieldForm in creation mode', async () => {
    const { findByText } = renderFresh()
    const btn = await findByText('Nuevo')
    btn.click()
    expect(await findByText('Nuevo rendimiento')).toBeDefined()
  })

  it('click the search icon opens the link-transactions modal', async () => {
    const { findAllByLabelText, findByText } = renderFresh()
    await findByText(YIELDS_LIST[0].name)
    const buttons = await findAllByLabelText('Enlazar movimientos')
    buttons[0].click()
    expect(await findByText(/Movimientos de/)).toBeDefined()
  })
})
