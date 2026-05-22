export const LOAN_PAYMENT = {
  ORDINARY: 'ordinary',
  EXTRAORDINARY: 'extraordinary',
} as const

export type LoanPaymentType = typeof LOAN_PAYMENT[keyof typeof LOAN_PAYMENT]
