export default function Loading({ show }) {
  if (!show) return null
  return (
    <div className="loading-overlay">
      <div className="loading-spinner" />
    </div>
  )
}
