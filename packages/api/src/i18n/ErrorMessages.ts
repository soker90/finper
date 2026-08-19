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
    PARENT_NOT_FOUND: 'La categoría padre no existe',
    HAS_CHILDREN: 'No se puede eliminar una categoría que tiene subcategorías'
  },
  TRANSACTION: {
    NOT_FOUND: 'No existe el movimiento'
  },
  YIELD: {
    NOT_FOUND: 'El rendimiento no existe',
    SETTLEMENT_NOT_FOUND: 'La liquidación no existe o no pertenece a este rendimiento',
    TRANSACTION_IDS_REQUIRED: 'Selecciona al menos un movimiento para enlazar',
    ALREADY_EXISTS: 'Ya existe un rendimiento de este tipo para esta cuenta',
    TAX_CATEGORY_ONLY_FOR_CASHBACK: 'La categoría de impuesto solo aplica a rendimientos de tipo cashback',
    TAX_CATEGORY_NOT_TRACKED: 'La categoría de impuesto debe ser una de las categorías del rendimiento'
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
  STOCK: {
    NOT_FOUND: 'La acción no existe'
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
  },
  TICKET: {
    MODULE_NOT_CONFIGURED: 'El módulo de tickets no está configurado'
  },
  GOAL: {
    NOT_FOUND: 'La meta no existe',
    EXCEEDS_BALANCE: 'El total asignado a todas las metas supera el balance de las cuentas',
    INVALID_AMOUNT: 'La cantidad debe ser mayor que 0',
    INSUFFICIENT_FUNDS: 'No se puede retirar más dinero del asignado a la meta'
  },
  CREDIT_CARD: {
    NOT_FOUND: 'La tarjeta de crédito no existe',
    MOVEMENT_NOT_FOUND: 'El movimiento de tarjeta no existe',
    INVALID_PAYMENT: 'No hay movimientos pendientes para pagar o los parámetros son inválidos',
    ALREADY_PAID: 'Este movimiento ya ha sido pagado',
    HAS_PAID_MOVEMENTS: 'No se puede eliminar la tarjeta porque tiene movimientos ya pagados'
  },
  PASSKEY: {
    NOT_FOUND: 'No hay huella registrada para este usuario',
    INVALID_CHALLENGE: 'El reto de verificación ha caducado o no es válido',
    VERIFICATION_FAILED: 'No se ha podido verificar la huella',
    ALREADY_REGISTERED: 'Esta huella ya está registrada'
  }
}
