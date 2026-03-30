import { useForm } from 'react-hook-form'
import { mutate } from 'swr'

import { DateForm, InputForm, ModalGrid, SelectForm, SelectGroupForm } from 'components'
import { LOANS, LOAN_DETAIL } from 'constants/api-paths'
import { addLoan, editLoan } from 'services/apiService'
import { useAccounts, useGroupedCategories } from 'hooks'
import { Loan } from 'types'

import { useApiError } from '../../hooks'

interface Props {
  loan?: Partial<Loan>
  onClose: () => void
}

const LoanFormModal = ({ loan, onClose }: Props) => {
  const { setApiError, ApiErrorMessage } = useApiError()
  const isEdit = Boolean(loan?._id)
  const { accounts } = useAccounts()
  const { categories } = useGroupedCategories()

  const { register, handleSubmit, formState: { errors, isSubmitting }, control } = useForm({
    defaultValues: {
      name: loan?.name || '',
      initialAmount: loan?.initialAmount,
      interestRate: loan?.interestRate,
      startDate: loan?.startDate || null,
      monthlyPayment: loan?.monthlyPayment,
      account: loan?.account || '',
      category: loan?.category || ''
    }
  })

  const onSubmit = handleSubmit(async (params) => {
    const body = {
      name: params.name,
      initialAmount: Number(params.initialAmount),
      interestRate: Number(params.interestRate),
      monthlyPayment: Number(params.monthlyPayment),
      startDate: params.startDate ? new Date(params.startDate).getTime() : undefined,
      account: params.account,
      category: params.category
    }

    if (isEdit) {
      const { error } = await editLoan(loan!._id!, body)
      if (error) { setApiError(error); return }
      await mutate(LOAN_DETAIL(loan!._id!))
    } else {
      const { error } = await addLoan(body)
      if (error) { setApiError(error); return }
    }
    await mutate(LOANS)
    onClose()
  })

  return (
    <ModalGrid show onClose={onClose} title={isEdit ? 'Editar préstamo' : 'Nuevo préstamo'} action={onSubmit} actionDisabled={isSubmitting}>
      <InputForm
        id='name' label='Nombre' placeholder='Ej. Hipoteca'
        error={!!errors.name} errorText='Nombre requerido'
        {...register('name', { required: true })}
      />
      <InputForm
        id='initialAmount' label='Capital inicial' type='number'
        inputProps={{ step: 'any', min: 0 }}
        error={!!errors.initialAmount} errorText='Capital inicial requerido'
        {...register('initialAmount', { required: true, valueAsNumber: true })}
      />
      <InputForm
        id='interestRate' label='TIN anual (%)' type='number'
        inputProps={{ step: 'any', min: 0 }}
        error={!!errors.interestRate} errorText='TIN requerido'
        {...register('interestRate', { required: true, valueAsNumber: true })}
      />
      <InputForm
        id='monthlyPayment' label='Cuota mensual' type='number'
        inputProps={{ step: 'any', min: 0 }}
        error={!!errors.monthlyPayment} errorText='Cuota mensual requerida'
        {...register('monthlyPayment', { required: true, valueAsNumber: true })}
      />
      <DateForm
        id='startDate' label='Fecha primer pago'
        placeholder='Fecha primer pago'
        error={!!errors.startDate}
        control={control}
      />
      <SelectForm
        id='account' label='Cuenta vinculada'
        options={accounts}
        optionValue='_id'
        optionLabel='name'
        voidOption
        error={!!errors.account}
        errorText='Cuenta requerida'
        {...register('account', { required: true })}
      />
      <SelectGroupForm
        id='category' label='Categoría de transacciones'
        options={categories}
        optionValue='_id'
        optionLabel='name'
        voidOption
        error={!!errors.category}
        errorText='Categoría requerida'
        {...register('category', { required: true })}
      />
      {ApiErrorMessage}
    </ModalGrid>
  )
}

export default LoanFormModal
