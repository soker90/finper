export const roundMoney = (value: number): number =>
  Math.sign(value) * Math.round((Math.abs(value) + Number.EPSILON) * 100) / 100
