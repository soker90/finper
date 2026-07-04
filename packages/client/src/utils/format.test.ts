import { test, expect, describe } from 'vitest'
import { dateShort, euro, monthToNumber, runwayTime } from 'utils/format'

test('date returned is valid', () => {
  const sDate = dateShort(new Date(2022, 0, 1).getTime())
  expect(sDate).eq('1 ene')
})

test('returned a valid formatted number', () => {
  const sEuro = euro(12345.678)
  expect(sEuro).eq('12.345,68 €')
})

describe('runwayTime', () => {
  test('handles 0 or negative values', () => {
    expect(runwayTime(0)).eq('0 días')
    expect(runwayTime(-1.5)).eq('0 días')
  })

  test('formats days only', () => {
    expect(runwayTime(0.1)).eq('3 días')
    expect(runwayTime(0.5)).eq('15 días')
  })

  test('formats months only', () => {
    expect(runwayTime(3)).eq('3 meses')
    expect(runwayTime(1)).eq('1 mes')
  })

  test('formats years only', () => {
    expect(runwayTime(12)).eq('1 año')
    expect(runwayTime(24)).eq('2 años')
  })

  test('formats combination of years, months, and days', () => {
    expect(runwayTime(13.5)).eq('1 año, 1 mes y 15 días')
    expect(runwayTime(3.5)).eq('3 meses y 15 días')
    expect(runwayTime(12.1)).eq('1 año y 3 días')
    expect(runwayTime(24.033)).eq('2 años y 1 día')
  })
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
