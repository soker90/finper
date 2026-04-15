import { useState } from 'react'
import { Supply, SupplyReading, SupplyReadingInput } from 'types'

export type ModalState =
  | { type: 'add' }
  | { type: 'edit'; data: SupplyReading }
  | { type: 'delete'; data: SupplyReading }
  | { type: 'editSupply' }

interface Params {
  supply: Supply | null | undefined
  createReading: (data: SupplyReadingInput) => Promise<unknown>
  updateReading: (id: string, data: SupplyReadingInput) => Promise<unknown>
}

export const useSupplyDetailModals = ({ supply, createReading, updateReading }: Params) => {
  const [activeModal, setActiveModal] = useState<ModalState | null>(null)

  const closeModal = () => setActiveModal(null)

  const handleReadingSubmit = async (data: Omit<SupplyReadingInput, 'supplyId'>): Promise<{ error?: string }> => {
    if (!supply) return { error: 'No hay suministro seleccionado.' }
    const payload: SupplyReadingInput = { ...data, supplyId: supply._id }
    try {
      if (activeModal?.type === 'edit') {
        await updateReading(activeModal.data._id, payload)
      } else {
        await createReading(payload)
      }
      return {}
    } catch (e: any) {
      return { error: e?.message || 'Error al guardar la lectura.' }
    }
  }

  return { activeModal, setActiveModal, closeModal, handleReadingSubmit }
}
