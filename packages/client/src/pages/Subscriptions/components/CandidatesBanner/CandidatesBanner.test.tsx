// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest'
import { render } from '../../../../test/testUtils'
import CandidatesBanner from '.'

const NOW = Date.now()

const makeSub = (i: number) => ({
  _id: `sub-${i}`,
  name: `Netflix ${i}`,
  logoUrl: undefined,
  amount: 9.99,
  cycle: 1,
  nextPaymentDate: NOW
})

const makeCandidate = (i: number) => ({
  _id: `cand-${i}`,
  transactionId: {
    _id: `tx-${i}`,
    date: NOW - i * 86400000,
    amount: 9.99 + i,
    category: { _id: 'cat-1', name: 'Ocio' },
    account: { _id: 'acc-1', name: 'Mi cuenta', bank: 'BBVA' },
    note: ''
  },
  subscriptionIds: [makeSub(i)],
  createdAt: new Date().toISOString()
})

describe('CandidatesBanner', () => {
  // ── Estado vacío ─────────────────────────────────────────────────────────
  it('renders nothing when candidates list is empty', () => {
    const { container } = render(
      <CandidatesBanner candidates={[]} onAssign={vi.fn()} onDismiss={vi.fn()} />
    )
    expect(container.firstChild).toBeNull()
  })

  // ── Filas de candidatos ───────────────────────────────────────────────────
  it('renders one row per candidate', () => {
    const { getAllByRole } = render(
      <CandidatesBanner
        candidates={[makeCandidate(1), makeCandidate(2)]}
        onAssign={vi.fn()}
        onDismiss={vi.fn()}
      />
    )
    // Cada candidato tiene un botón de descartar con aria-label "No es una suscripción"
    expect(getAllByRole('button', { name: /no es una suscripción/i }).length).toBe(2)
  })

  // ── Callbacks ─────────────────────────────────────────────────────────────
  it('calls onDismiss with the candidate id when dismiss button is clicked', async () => {
    const onDismiss = vi.fn().mockResolvedValue({})
    const { getAllByRole } = render(
      <CandidatesBanner
        candidates={[makeCandidate(1)]}
        onAssign={vi.fn()}
        onDismiss={onDismiss}
      />
    )
    getAllByRole('button', { name: /no es una suscripción/i })[0].click()
    expect(onDismiss).toHaveBeenCalledWith('cand-1')
  })

  it('calls onAssign with candidateId and subscriptionId when a suggestion is clicked', async () => {
    const onAssign = vi.fn().mockResolvedValue({})
    const candidate = makeCandidate(1)
    const { getByText } = render(
      <CandidatesBanner
        candidates={[candidate]}
        onAssign={onAssign}
        onDismiss={vi.fn()}
      />
    )
    // La caja de suscripción contiene el texto del nombre; hacer clic en ella
    getByText('Netflix 1').click()
    expect(onAssign).toHaveBeenCalledWith('cand-1', 'sub-1')
  })
})
