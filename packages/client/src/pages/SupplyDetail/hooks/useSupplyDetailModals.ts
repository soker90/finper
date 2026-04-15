import { useState } from 'react'
import { Supply, SupplyReading, SupplyReadingInput } from 'types'

export type ModalState =
  | { type: 'add' }
  | { type: 'edit'; data: SupplyReading }
  | { type: 'delete'; data: SupplyReading }
  | { type: 'editSupply' }

interface Params {
  supply: Supply | undefined
  createReading: (data: SupplyReadingInput) => Promise<unknown>
  updateReading: (id: string, data: SupplyReadingInput) => Promise<unknown>
}

export const useSupplyDetailModals = ({ supply, createReading, updateReading }: Params) => {
  const [activeModal, setActiveModal] = useState<ModalState | null>(null)

  const closeModal = () => setActiveModal(null)

  const handleReadingSubmit = (data: Omit<SupplyReadingInput, 'supplyId'>) => {
    const payload: SupplyReadingInput = { ...data, supplyId: supply!._id }
    return activeModal?.type === 'edit'
      ? updateReading(activeModal.data._id, payload)
      : createReading(payload)
  }

  return { activeModal, setActiveModal, closeModal, handleReadingSubmit }
}
