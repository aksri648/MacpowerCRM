import { useState, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth, useUser } from '@clerk/clerk-react'
import { SnackbarContext } from '../App'
import Loading from '../components/Loading'

const API_BASE = import.meta.env.VITE_API_URL || 'https://macpower-crm-api.akshatsri648.workers.dev'

export default function CompleteProfile() {
  const { getToken } = useAuth()
  const { user } = useUser()
  const navigate = useNavigate()
  const showSnackbar = useContext(SnackbarContext)
  const [loading, setLoading] = useState(false)
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    const trimmed = username.trim().toLowerCase()
    if (!trimmed) {
      setError('Username is required')
      return
    }
    if (!/^[a-z0-9_]{3,30}$/.test(trimmed)) {
      setError('Username must be 3-30 characters: lowercase letters, numbers, underscores only')
      return
    }

    setLoading(true)
    try {
      const token = await getToken()
      const url = new URL(API_BASE)
      url.searchParams.set('action', 'registerUser')
      url.searchParams.set('username', trimmed)
      url.searchParams.set('email', user?.primaryEmailAddress?.emailAddress || '')
      url.searchParams.set('fullName', user?.fullName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim())

      const res = await fetch(url.toString(), {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()

      if (data.success) {
        showSnackbar('Profile complete! Welcome to MacpowerCRM')
        navigate('/')
      } else {
        setError(data.message || 'Registration failed')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    }
    setLoading(false)
  }

  return (
    <div className="auth-page">
      <Loading show={loading} />
      <div className="auth-container">
        <div className="auth-header">
          <div className="auth-logo">
            <span className="material-icons">person_add</span>
          </div>
          <h1>Complete Your Profile</h1>
          <p>Choose a unique username. Others will use this to share leads with you.</p>
        </div>
        <form className="profile-form" onSubmit={handleSubmit}>
          <div className="form-field">
            <label>Username *</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              placeholder="e.g. john_doe"
              maxLength={30}
              autoFocus
            />
            <p className="field-hint">3-30 characters. Lowercase letters, numbers, underscores.</p>
          </div>
          {error && <div className="auth-error">{error}</div>}
          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            <span className="material-icons">check</span>
            Complete Registration
          </button>
        </form>
      </div>
    </div>
  )
}
