import { useState, useContext } from 'react'
import { shareLead, searchUsers } from '../api'
import { SnackbarContext } from '../App'

export default function ShareLeadModal({ lead, onClose, onShared }) {
  const showSnackbar = useContext(SnackbarContext)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [sharing, setSharing] = useState(false)
  const [error, setError] = useState('')

  if (!lead) return null

  async function handleSearch(value) {
    setQuery(value)
    setError('')

    if (value.trim().length < 2) {
      setResults([])
      return
    }

    setSearching(true)
    try {
      const res = await searchUsers(value.trim())
      if (res.success) {
        setResults(res.users)
      }
    } catch {
      // silent
    }
    setSearching(false)
  }

  async function handleShare(shareWith) {
    setSharing(true)
    setError('')

    try {
      const res = await shareLead(lead.id, shareWith)
      if (res.success) {
        showSnackbar(res.message)
        onShared?.()
        onClose()
      } else {
        setError(res.message || 'Failed to share lead')
      }
    } catch {
      setError('Network error. Please try again.')
    }
    setSharing(false)
  }

  async function handleManualShare(e) {
    e.preventDefault()
    if (!query.trim()) return
    await handleShare(query.trim().toLowerCase())
  }

  return (
    <div className="modal" onClick={onClose}>
      <div className="modal-content share-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Share Lead</h2>
          <button className="icon-btn" onClick={onClose}>
            <span className="material-icons">close</span>
          </button>
        </div>

        <div className="share-lead-info">
          <span className="material-icons">business</span>
          <span>{lead.company_name}</span>
        </div>

        <div className="modal-body">
          <form onSubmit={handleManualShare} className="share-form">
            <div className="share-input-group">
              <span className="material-icons share-input-icon">search</span>
              <input
                type="text"
                value={query}
                onChange={e => handleSearch(e.target.value)}
                placeholder="Enter username or email..."
                autoFocus
                className="share-input"
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary btn-share"
              disabled={sharing || !query.trim()}
            >
              <span className="material-icons">send</span>
              Share
            </button>
          </form>

          {error && <div className="share-error">{error}</div>}

          {searching && (
            <div className="share-searching">
              <span className="material-icons spinning">sync</span>
              Searching...
            </div>
          )}

          {results.length > 0 && (
            <div className="share-results">
              <p className="share-results-title">Users found:</p>
              {results.map(user => (
                <div key={user.id} className="share-user-item" onClick={() => handleShare(user.username)}>
                  <div className="share-user-avatar">
                    <span className="material-icons">person</span>
                  </div>
                  <div className="share-user-info">
                    <span className="share-user-name">{user.full_name || user.username}</span>
                    <span className="share-user-handle">@{user.username}</span>
                  </div>
                  <button className="btn-icon-small" disabled={sharing}>
                    <span className="material-icons">share</span>
                  </button>
                </div>
              ))}
            </div>
          )}

          {!searching && query.trim().length >= 2 && results.length === 0 && (
            <div className="share-no-results">
              <span className="material-icons">person_off</span>
              <p>No users found. You can still share by typing their exact username or email and pressing Share.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
