export const labelOfRows = ({ from, to, count }: {from: number, to: number, count: number}) => `${from}-${
  to === -1 ? count : to
} de ${
  count !== -1
    ? count
    : `más de ${to}`
}`
