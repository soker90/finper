export const ERROR_MESSAGE = {
  ACCOUNT: {
    NOT_FOUND: 'La cuenta no existe'
  },
  COMMON: {
    NOT_VALID: 'Uno o más datos introducidos no son válidos',
    INVALID_ID: 'El id no es válido'
  },
  CATEGORY: {
    NOT_FOUND: 'La categoría no existe',
    PARENT_NOT_FOUND: 'La categoría padre no existe'
  },
  TRANSACTION: {
    NOT_FOUND: 'No existe el movimiento'
  },
  DEBT: {
    NOT_FOUND: 'La deuda no existe'
  },
  BUDGET: {
    INVALID_AMOUNT: 'La cantidad no es válida',
    YEAR_MONTH_INVALID: 'El año y/o el mes no son válidos'
  },
  PENSION: {
    NOT_FOUND: 'El movimiento de la pensión no existe'
  },
  LOAN: {
    NOT_FOUND: 'El préstamo no existe',
    PAYMENT_NOT_FOUND: 'El pago no existe',
    ALREADY_PAID: 'El préstamo ya está pagado'
  },
  USER: {
    ALREADY_EXISTS: 'El usuario ya existe'
  },
  SUBSCRIPTION: {
    NOT_FOUND: 'La suscripción no existe',
    TRANSACTION_IDS_REQUIRED: 'transactionIds debe ser un array no vacío'
  },
  SUBSCRIPTION_CANDIDATE: {
    NOT_FOUND: 'La candidata no existe'
  },
  PROPERTY: {
    NOT_FOUND: 'El inmueble no existe'
  },
  SUPPLY: {
    NOT_FOUND: 'El suministro no existe',
    ELECTRICITY_ONLY: 'La comparación de tarifas solo está disponible para suministros eléctricos',
    POWER_CONFIG_REQUIRED: 'El suministro debe tener configuradas las potencias contratadas (Punta y Valle)',
    PRICES_CONFIG_REQUIRED: 'El suministro debe tener configurados todos los precios actuales de energía y potencia'
  },
  SUPPLY_READING: {
    NOT_FOUND: 'La lectura del suministro no existe',
    NO_READINGS_FOR_COMPARISON: 'El suministro no tiene lecturas registradas para realizar la comparación',
    NO_READINGS_IN_LAST_YEAR: 'No se han encontrado lecturas en el último año para este suministro',
    INVALID_DATES: 'La fecha de fin debe ser posterior a la fecha de inicio'
  },
  TARIFF: {
    FETCH_ERROR: 'No se pudieron obtener las tarifas eléctricas'
  }
}
