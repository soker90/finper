// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest'
import { SWRConfig } from 'swr'
import { render } from '../../test/testUtils'
import YieldDetail from './index'
import { YIELDS_LIST } from '../../mock/handlers/yields'

vi.mock('recharts', async (importOriginal) => {
  const original = await importOriginal<typeof import('recharts')>()
  return {
    ...original,
    ResponsiveContainer: ({ children }: any) => <div className='recharts-responsive-container'>{children}</div>
  }
})

vi.mock('react-router', async (importOriginal) => {
  const original = await importOriginal<typeof import('react-router')>()
  return {
    ...original,
    useParams: () => ({ id: YIELDS_LIST[0]._id }),
    useNavigate: () => vi.fn()
  }
})

const renderFresh = () =>
  render(
    <SWRConfig value={{ provider: () => new Map() }}>
      <YieldDetail />
    </SWRConfig>
  )

describe('YieldDetail', () => {
  it('renders loading spinner while loading', () => {
    const { container } = render(<YieldDetail />)
    expect(container.querySelector('.MuiCircularProgress-root')).not.toBeNull()
  })

  it('renders yield detail elements after loading', async () => {
    const { findByText, container } = renderFresh()

    // 1. Renders detail header with name
    expect(await findByText(YIELDS_LIST[0].name)).toBeDefined()

    // 2. Renders statistics cards
    expect(await findByText('Saldo actual cuenta')).toBeDefined()
    expect(await findByText('Neto acumulado')).toBeDefined()
    expect(await findByText('Último mes')).toBeDefined()
    expect(await findByText('Movimientos enlazados')).toBeDefined()

    // 3. Renders chart container
    expect(container.querySelector('.recharts-responsive-container')).not.toBeNull()

    // 4. Renders table with calendar month and movements
    expect(await findByText('2026-07')).toBeDefined()
    expect(await findByText('Detalle por Mes')).toBeDefined()
  })
})
