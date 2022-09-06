import { test, expect, describe } from 'vitest'
import { dateShort, euro, monthToNumber } from 'utils/format'

test('date returned is valid', () => {
  const sDate = dateShort(new Date(2022, 0, 1).getTime())
  expect(sDate).eq('1 ene')
})

test('returned a valid formatted number', () => {
  const sEuro = euro(12345.678)
  expect(sEuro).eq('12.345,68 €')
})

describe('monthToNumber', () => {
  test('when month is 0, it should return Enero ', () => {
    const monthText = monthToNumber(0)
    expect(monthText).eq('Enero')
  })
  test('when month is 1, it should return Febrero ', () => {
    const monthText = monthToNumber(1)
    expect(monthText).eq('Febrero')
  })
  test('when month is 2, it should return Marzo ', () => {
    const monthText = monthToNumber(2)
    expect(monthText).eq('Marzo')
  })
  test('when month is 3, it should return Abril ', () => {
    const monthText = monthToNumber(3)
    expect(monthText).eq('Abril')
  })
  test('when month is 4, it should return Mayo ', () => {
    const monthText = monthToNumber(4)
    expect(monthText).eq('Mayo')
  })
  test('when month is 5, it should return Junio ', () => {
    const monthText = monthToNumber(5)
    expect(monthText).eq('Junio')
  })
  test('when month is 6, it should return Julio ', () => {
    const monthText = monthToNumber(6)
    expect(monthText).eq('Julio')
  })
  test('when month is 7, it should return Agosto ', () => {
    const monthText = monthToNumber(7)
    expect(monthText).eq('Agosto')
  })
  test('when month is 8, it should return Septiembre ', () => {
    const monthText = monthToNumber(8)
    expect(monthText).eq('Septiembre')
  })
  test('when month is 9, it should return Octubre ', () => {
    const monthText = monthToNumber(9)
    expect(monthText).eq('Octubre')
  })
  test('when month is 10, it should return Noviembre ', () => {
    const monthText = monthToNumber(10)
    expect(monthText).eq('Noviembre')
  })
  test('when month is 11, it should return Diciembre ', () => {
    const monthText = monthToNumber(11)
    expect(monthText).eq('Diciembre')
  })
})
