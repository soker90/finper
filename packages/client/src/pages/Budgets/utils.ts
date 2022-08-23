export const isSameDate = (year?: string, month?: string): boolean => {
  const now = new Date()
  return (year === now.getFullYear().toString() && month === now.getMonth().toString())
}

export const getUrlMonth = (year?: string, month?: number) => `/presupuestos/${year}/${month}`
