export default function Snackbar({ open, message, onClose }) {
  return (
    <div className={`snackbar ${open ? 'visible' : ''}`}>
      <p>{message}</p>
      <button className="snackbar-action" onClick={onClose}>DISMISS</button>
    </div>
  )
}
