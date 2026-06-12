export const accountSummarySerializer = (account: any) => ({
  _id: account.id,
  name: account.name,
  bank: account.bank,
  balance: account.balance
})

export const accountFullSerializer = (account: any) => ({
  _id: account.id,
  name: account.name,
  bank: account.bank,
  balance: account.balance,
  isActive: account.isActive,
  user: account.user
})
