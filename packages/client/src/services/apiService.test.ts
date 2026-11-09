import { beforeEach, describe, expect, it, vi } from 'vitest'

const { post } = vi.hoisted(() => ({
  post: vi.fn()
}))

vi.mock('axios', () => ({
  default: { post }
}))

import { transferPensionAssets } from './apiService'

describe('transferPensionAssets', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    post.mockResolvedValue({})
  })

  it('sends the manually supplied destination units, value and date', async () => {
    const payload = {
      planId: 'source',
      destinationPlanId: 'destination',
      destinationUnits: 125.5,
      destinationValue: 18.75,
      date: 1_800_000_000_000
    }

    await expect(transferPensionAssets(payload)).resolves.toEqual({})

    expect(post).toHaveBeenCalledWith('pension-plans/source/transfer', {
      destinationPlanId: 'destination',
      destinationUnits: 125.5,
      destinationValue: 18.75,
      date: 1_800_000_000_000
    })
  })

  it('omits the date when it is not provided', async () => {
    await transferPensionAssets({
      planId: 'source',
      destinationPlanId: 'destination',
      destinationUnits: 10,
      destinationValue: 20
    })

    expect(post).toHaveBeenCalledWith('pension-plans/source/transfer', {
      destinationPlanId: 'destination',
      destinationUnits: 10,
      destinationValue: 20
    })
  })

  it('returns the API error message when the request fails', async () => {
    post.mockRejectedValueOnce({
      response: { data: { message: 'Invalid transfer' } }
    })

    await expect(transferPensionAssets({
      planId: 'source',
      destinationPlanId: 'destination',
      destinationUnits: 10,
      destinationValue: 20
    })).resolves.toEqual({ error: 'Invalid transfer' })
  })
})
