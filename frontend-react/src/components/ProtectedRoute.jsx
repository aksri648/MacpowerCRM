import { useAuth } from '@clerk/clerk-react'
import { Navigate } from 'react-router-dom'
import Loading from './Loading'

export default function ProtectedRoute({ children }) {
  const { isLoaded, isSignedIn } = useAuth()

  if (!isLoaded) {
    return <Loading show={true} />
  }

  if (!isSignedIn) {
    return <Navigate to="/sign-in" replace />
  }

  return children
}
