// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { SWRConfig } from 'swr'
import { waitFor, fireEvent } from '@testing-library/react'
import { server } from '../../mock/server'
import { render } from '../../test/testUtils'
import Supplies from './index'
import { PROPERTIES_LIST, PROPERTY_ID, SUPPLY_WATER_ID } from '../../mock/handlers/supplies'

const renderFresh = () =>
  render(
    <SWRConfig value={{ provider: () => new Map() }}>
      <Supplies />
    </SWRConfig>
  )

// ── Initial state and list ────────────────────────────────────────────────────
describe('Supplies — initial state and list', () => {
  it('shows loading state while fetching data', () => {
    const { getByText } = render(<Supplies />)
    expect(getByText(/cargando suministros/i)).toBeDefined()
  })

  it('shows empty state when there are no properties', async () => {
    server.use(http.get('/supplies', () => HttpResponse.json([])))
    const { findByText } = renderFresh()
    expect(await findByText(/aún no tienes inmuebles/i)).toBeDefined()
  })

  it('renders the property name after data loads', async () => {
    const { findByText } = renderFresh()
    expect(await findByText('Casa Principal')).toBeDefined()
  })

  it('renders supply type chips inside the supply cards', async () => {
    const { findByText } = renderFresh()
    expect(await findByText('Agua')).toBeDefined()
    expect(await findByText('Electricidad')).toBeDefined()
  })

  it('renders the reading preview when readings exist in the card', async () => {
    const { findByText } = renderFresh()
    expect(await findByText('Últimas lecturas')).toBeDefined()
  })

  it('"Nuevo inmueble" button opens PropertyForm', async () => {
    const { findByText, findByRole } = renderFresh()
    await findByText('Casa Principal')
    ;(await findByRole('button', { name: /nuevo inmueble/i })).click()
    expect(await findByText('Nuevo inmueble')).toBeDefined()
  })
})

// ── Flow: property CRUD ───────────────────────────────────────────────────────
describe('Flow: property CRUD', () => {
  it('create property → appears in the list', async () => {
    const newProp = { _id: 'prop-new', name: 'Apartamento Playa', supplies: [] }
    server.use(
      http.post('/supplies/properties', async () => HttpResponse.json(newProp)),
      http.get('/supplies', () => HttpResponse.json([...PROPERTIES_LIST, newProp]))
    )
    const { findByText, findByRole } = renderFresh()
    await findByText('Casa Principal')

    ;(await findByRole('button', { name: /nuevo inmueble/i })).click()
    await findByText('Nuevo inmueble')

    fireEvent.change(document.querySelector('input[name="name"]')!, { target: { value: 'Apartamento Playa' } })
    fireEvent.submit(document.querySelector('form')!)

    await waitFor(() => expect(document.body.textContent).toContain('Apartamento Playa'))
  })

  it('edit property → name is updated in the list', async () => {
    const { findByText, findByRole } = renderFresh()
    // Wait for initial load before overriding the handler
    await findByText('Casa Principal')

    const updated = { ...PROPERTIES_LIST[0], name: 'Casa Renovada' }
    server.use(
      http.put(`/supplies/properties/${PROPERTY_ID}`, async () => HttpResponse.json(updated)),
      http.get('/supplies', () => HttpResponse.json([updated]))
    )

    ;(await findByRole('button', { name: /editar inmueble/i })).click()
    await findByText('Editar inmueble')

    const nameInput = document.querySelector('input[name="name"]')!
    fireEvent.change(nameInput, { target: { value: 'Casa Renovada' } })
    fireEvent.submit(document.querySelector('form')!)

    await waitFor(() => expect(document.body.textContent).toContain('Casa Renovada'))
  })

  it('delete property → disappears from the list', async () => {
    const { findByText, findByRole, queryByText } = renderFresh()
    // Wait for initial load before overriding the handler
    await findByText('Casa Principal')

    server.use(
      http.delete(`/supplies/properties/${PROPERTY_ID}`, () => new HttpResponse(null, { status: 204 })),
      http.get('/supplies', () => HttpResponse.json([]))
    )

    ;(await findByRole('button', { name: /eliminar inmueble/i })).click()
    await findByText('¿Eliminar inmueble?')
    ;(await findByRole('button', { name: /^Eliminar$/ })).click()

    await waitFor(() => expect(queryByText('Casa Principal')).toBeNull())
  })

  it('delete property error → property remains in the list', async () => {
    server.use(
      http.delete('/supplies/properties/:id', () => HttpResponse.json({}, { status: 500 }))
    )
    const { findByText, findByRole } = renderFresh()
    await findByText('Casa Principal')

    ;(await findByRole('button', { name: /eliminar inmueble/i })).click()
    await findByText('¿Eliminar inmueble?')
    ;(await findByRole('button', { name: /^Eliminar$/ })).click()

    await waitFor(() => expect(document.body.textContent).toContain('Casa Principal'))
  })
})

// ── Flow: supply CRUD from PropertyCard ───────────────────────────────────────
describe('Flow: supply CRUD from PropertyCard', () => {
  it('add supply → new supply card is visible', async () => {
    const newSupply = { _id: 'supply-gas-new', type: 'gas', propertyId: PROPERTY_ID }
    const updatedProp = { ...PROPERTIES_LIST[0], supplies: [...PROPERTIES_LIST[0].supplies, newSupply] }
    server.use(
      http.post('/supplies', async () => HttpResponse.json(newSupply)),
      http.get('/supplies', () => HttpResponse.json([updatedProp]))
    )
    const { findByText, findByRole } = renderFresh()
    await findByText('Casa Principal')

    ;(await findByRole('button', { name: /añadir suministro/i })).click()
    await findByText('Nuevo suministro')

    // SupplyForm uses NativeSelect — select type 'gas'
    const selects = document.querySelectorAll('select')
    fireEvent.change(selects[0], { target: { value: 'gas' } })
    fireEvent.submit(document.querySelector('form')!)

    await waitFor(() => expect(document.body.textContent).toContain('Gas'))
  })

  it('delete supply → supply card disappears', async () => {
    const updatedProp = { ...PROPERTIES_LIST[0], supplies: [PROPERTIES_LIST[0].supplies[1]] }
    server.use(
      http.delete(`/supplies/${SUPPLY_WATER_ID}`, () => new HttpResponse(null, { status: 204 })),
      http.get('/supplies', () => HttpResponse.json([updatedProp]))
    )
    const { findByText, findAllByRole, findByRole, queryByText } = renderFresh()
    await findByText('Casa Principal')

    // SupplyCardHeader has aria-label='Eliminar' on the delete button
    const deleteSupplyBtns = await findAllByRole('button', { name: /^Eliminar$/i })
    deleteSupplyBtns[0].click()

    // RemoveModal opens — its confirm button has text "Eliminar" and is the only visible one
    await findByText('¿Eliminar suministro?')
    ;(await findByRole('button', { name: /^Eliminar$/ })).click()

    await waitFor(() => expect(queryByText('Agua')).toBeNull())
  })
})
