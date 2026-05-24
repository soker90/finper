# Clasificación de Campos Numéricos (Mongoose → Drizzle)

> **Justificación de la decisión técnica (REAL vs INTEGER céntimos):**
> Todos los importes monetarios se almacenan como `REAL`. La aplicación ya tiene una disciplina establecida de redondear (con `Math.round(x * 100) / 100` o equivalente) tras cada operación aritmética que produce un importe. Esta práctica se traslada a la capa de serialización con el helper `roundMoney`. Dado el contexto (app personal, un solo usuario, volumen bajo), `INTEGER` céntimos sería overhead innecesario sin beneficio práctico observable. La decisión es reversible en el futuro mediante una migración Drizzle aislada si las circunstancias cambian.

---

### Clasificación `REAL` (Todos los campos con decimales, incluido dinero y tasas)
*   `accounts.balance`
*   `budgets.amount`
*   `debts.amount`
*   `goals.targetAmount`, `goals.currentAmount`
*   `loan_events.newPayment`, `loan_events.newRate`
*   `loan_payments.amount`, `loan_payments.interest`, `loan_payments.principal`, `loan_payments.accumulatedPrincipal`, `loan_payments.pendingCapital`
*   `loans.initialAmount`, `loans.pendingAmount`, `loans.monthlyPayment`, `loans.initialEstimatedCost`, `loans.interestRate`
*   `pensions.employeeAmount`, `pensions.companyAmount`, `pensions.value`, `pensions.employeeUnits`, `pensions.companyUnits`
*   `stocks.shares`, `stocks.price`
*   `subscriptions.amount`
*   `supply_readings.amount`, `supply_readings.consumption`, `supply_readings.consumptionPeak`, `supply_readings.consumptionFlat`, `supply_readings.consumptionOffPeak`
*   `supplies.contractedPowerPeak`, `supplies.contractedPowerOffPeak`, `supplies.currentPricePowerPeak`, `supplies.currentPricePowerOffPeak`, `supplies.currentPriceEnergyPeak`, `supplies.currentPriceEnergyFlat`, `supplies.currentPriceEnergyOffPeak`
*   `transactions.amount`

### Clasificación `INTEGER` (Enteros sin decimales, contadores o periodos)
*   `budgets.year`, `budgets.month`
*   `subscriptions.cycle`

*(Nota: Las fechas se clasificarán de forma independiente como `INTEGER` con `mode: 'timestamp_ms'`)*
