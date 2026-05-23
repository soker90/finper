export const TRANSACTION = {
  Expense: 'expense',
  Income: 'income',
  NotComputable: 'not_computable',
} as const

export const DEBT = {
  FROM: 'from',
  TO: 'to',
} as const

export const LOAN_PAYMENT = {
  ORDINARY: 'ordinary',
  EXTRAORDINARY: 'extraordinary',
} as const

export const SUPPLY_TYPE = {
  ELECTRICITY: 'electricity',
  WATER: 'water',
  GAS: 'gas',
  OTHER: 'other',
} as const

export const STOCK_TYPE = {
  Buy: 'buy',
  Sell: 'sell',
  Dividend: 'dividend',
} as const

export const GOAL_COLORS = [
  '#4CAF50',
  '#2196F3',
  '#9C27B0',
  '#FF9800',
  '#F44336',
  '#00BCD4',
  '#795548',
  '#607D8B',
  '#E91E63',
  '#FFC107',
] as const

export const GOAL_ICONS = [
  'DollarOutlined',
  'HomeOutlined',
  'CarOutlined',
  'LaptopOutlined',
  'HeartOutlined',
  'RocketOutlined',
  'GiftOutlined',
  'BankOutlined',
  'TrophyOutlined',
  'StarOutlined',
] as const
