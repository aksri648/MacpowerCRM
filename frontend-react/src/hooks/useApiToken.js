import { useEffect } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { setTokenGetter } from '../api'

/**
 * Hook that connects Clerk's getToken to the API layer.
 * Call this once in a top-level component (App) after ClerkProvider is mounted.
 */
export function useApiToken() {
  const { getToken } = useAuth()

  useEffect(() => {
    setTokenGetter(getToken)
    return () => setTokenGetter(null)
  }, [getToken])
}
