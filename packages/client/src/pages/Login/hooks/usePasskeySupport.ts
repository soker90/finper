import { useEffect, useState } from 'react'
import { isPasskeySupported } from 'utils/webauthn'

export const usePasskeySupport = (): boolean => {
  const [supported, setSupported] = useState(false)

  useEffect(() => {
    let cancelled = false

    isPasskeySupported().then(result => {
      if (!cancelled) setSupported(result)
    })

    return () => {
      cancelled = true
    }
  }, [])

  return supported
}
