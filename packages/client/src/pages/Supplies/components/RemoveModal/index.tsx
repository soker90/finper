import { ConfirmModal } from 'components'

type Props = {
  title: string
  description: string
  onClose: () => void
  onConfirm: () => Promise<unknown> | unknown
}

const RemoveModal = ({ title, description, onClose, onConfirm }: Props) => (
  <ConfirmModal
    title={title}
    description={description}
    onConfirm={onConfirm}
    onClose={onClose}
  />
)

export default RemoveModal
