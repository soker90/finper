import { test, expect } from 'vitest'
import { dateShort, euro } from 'utils/format'

test('date returned is valid', () => {
  const sDate = dateShort(new Date(2022, 0, 1).getTime())
  expect(sDate).eq('1 ene')
})

test('returned a valid formatted number', () => {
  const sEuro = euro(12345.678)
  expect(sEuro).eq('12.345,68 €')
})
