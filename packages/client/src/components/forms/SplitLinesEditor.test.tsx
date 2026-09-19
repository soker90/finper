// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { useForm, type Control } from 'react-hook-form'
import { render } from '../../test/testUtils'
import SplitLinesEditor from './SplitLinesEditor'

describe('SplitLinesEditor', () => {
  const TestEditor = ({ fields }: { fields: any[] }) => {
    const { control, register, formState: { errors } } = useForm({
      defaultValues: {
        splits: fields
      }
    })
    return (
      <SplitLinesEditor
        fields={fields}
        categories={[]}
        availableTags={[]}
        control={control as unknown as Control<any>}
        register={register as any}
        errors={errors}
        remaining={0}
        onAdd={vi.fn()}
        onRemove={vi.fn()}
        onAssignRemaining={vi.fn()}
        onDisableSplitMode={vi.fn()}
      />
    )
  }

  it('enables the add button when fewer than 5 fields exist', () => {
    const fields = [
      { id: '1', category: 'cat1', amount: 50, tags: [] },
      { id: '2', category: 'cat2', amount: 50, tags: [] }
    ]

    render(<TestEditor fields={fields} />)
    const addButton = screen.getByRole('button', { name: /añadir categoría/i })
    expect(addButton.hasAttribute('disabled')).toBe(false)
  })

  it('disables the add button when 5 fields are reached', () => {
    const fields = [
      { id: '1', category: 'cat1', amount: 20, tags: [] },
      { id: '2', category: 'cat2', amount: 20, tags: [] },
      { id: '3', category: 'cat3', amount: 20, tags: [] },
      { id: '4', category: 'cat4', amount: 20, tags: [] },
      { id: '5', category: 'cat5', amount: 20, tags: [] }
    ]

    render(<TestEditor fields={fields} />)
    const addButton = screen.getByRole('button', { name: /añadir categoría/i })
    expect(addButton.hasAttribute('disabled')).toBe(true)
  })
})
