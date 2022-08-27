import { InputForm, ModalGrid } from 'components'

const ModalEdit = ({ onClose, budget }: any) => {
  return <ModalGrid title='Editar cantidad' onClose={onClose} show={Boolean(budget)}>
        <InputForm label='Cantidad' id={'pep'} placeholder={''} error={false} errorText={''}
                   defaultValue={budget.amount} autoFocus/>
    </ModalGrid>
}

export default ModalEdit
