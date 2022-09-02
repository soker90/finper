export const getPreviousMonthYear = (month: number | string, year: number | string) => {
  if (month === 0 || month === '0') return { month: 11, year: +year - 1 }
  return { month: +month - 1, year: parseInt(year as string) }
}
