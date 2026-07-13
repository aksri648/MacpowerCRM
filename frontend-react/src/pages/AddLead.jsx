import { useState, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { addLead } from '../api'
import { SnackbarContext } from '../App'
import Loading from '../components/Loading'

export default function AddLead() {
  const showSnackbar = useContext(SnackbarContext)
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    companyName: '', contactPerson: '', phone: '',
    area: '', machineModel: '', price: '', notes: ''
  })
  const [location, setLocation] = useState({ lat: null, lng: null, address: '', loading: false })

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleGetLocation() {
    setLocation(prev => ({ ...prev, loading: true }))

    try {
      // Use the browser geolocation API
      if (!navigator.geolocation) {
        showSnackbar('Geolocation not supported')
        setLocation(prev => ({ ...prev, loading: false }))
        return
      }
      const pos = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000 })
      })
      const latitude = pos.coords.latitude
      const longitude = pos.coords.longitude

      // Reverse geocode
      let addr = `${latitude}, ${longitude}`
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`)
        const data = await res.json()
        if (data.display_name) addr = data.display_name
      } catch {}
      setLocation({ lat: latitude, lng: longitude, address: addr, loading: false })
      showSnackbar('Location captured')
    } catch {
      setLocation(prev => ({ ...prev, loading: false }))
      showSnackbar('Unable to get location')
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.companyName || !form.contactPerson || !form.phone) {
      showSnackbar('Please fill in all required fields')
      return
    }
    setLoading(true)
    const res = await addLead({
      ...form,
      latitude: location.lat || '',
      longitude: location.lng || '',
      locationAddress: location.address || '',
    })
    setLoading(false)
    if (res.success) {
      showSnackbar('Lead added successfully!')
      navigate('/')
    } else {
      showSnackbar('Failed to add lead')
    }
  }

  return (
    <>
      <Loading show={loading} />
      <form className="lead-form" onSubmit={handleSubmit}>
        <div className="form-section">
          <h3 className="form-section-title">
            <span className="material-icons">business</span> Company Information
          </h3>
          <div className="form-field">
            <label>Company Name *</label>
            <input name="companyName" value={form.companyName} onChange={handleChange} required placeholder="Enter company name" />
          </div>
        </div>

        <div className="form-section">
          <h3 className="form-section-title">
            <span className="material-icons">person</span> Contact Details
          </h3>
          <div className="form-field">
            <label>Contact Person *</label>
            <input name="contactPerson" value={form.contactPerson} onChange={handleChange} required placeholder="Enter contact person name" />
          </div>
          <div className="form-field">
            <label>Phone Number *</label>
            <input name="phone" type="tel" value={form.phone} onChange={handleChange} required placeholder="Enter 10-digit phone number" />
          </div>
        </div>

        <div className="form-section">
          <h3 className="form-section-title">
            <span className="material-icons">location_on</span> Location Details
          </h3>
          <div className="form-field">
            <label>Area *</label>
            <input name="area" value={form.area} onChange={handleChange} required placeholder="Enter area name" />
          </div>
          <div className="form-field">
            <label>Location (GPS)</label>
            <div className={`location-card ${location.lat ? 'success' : ''}`} onClick={handleGetLocation}>
              <div className="location-icon">
                <span className="material-icons">{location.lat ? 'check_circle' : 'my_location'}</span>
              </div>
              <div className="location-info">
                <p>{location.lat ? 'Location captured!' : 'Tap to get your location'}</p>
                <p className="location-coords">{location.address || ''}</p>
              </div>
              <button type="button" className="location-btn" disabled={location.loading}>
                <span className="material-icons">{location.loading ? 'hourglass_empty' : 'gps_fixed'}</span>
                {location.loading ? 'Loading...' : 'Get Location'}
              </button>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3 className="form-section-title">
            <span className="material-icons">engineering</span> Machine Details
          </h3>
          <div className="form-field">
            <label>Machine Model *</label>
            <input name="machineModel" value={form.machineModel} onChange={handleChange} required placeholder="Enter machine model" />
          </div>
          <div className="form-field">
            <label>Price (₹) *</label>
            <input name="price" type="number" value={form.price} onChange={handleChange} required placeholder="Enter price" min="0" />
          </div>
        </div>

        <div className="form-section">
          <h3 className="form-section-title">
            <span className="material-icons">note</span> Additional Notes
          </h3>
          <div className="form-field">
            <textarea name="notes" value={form.notes} onChange={handleChange} rows="3" placeholder="Enter any additional notes" />
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="btn btn-outlined" onClick={() => setForm({ companyName: '', contactPerson: '', phone: '', area: '', machineModel: '', price: '', notes: '' })}>Clear</button>
          <button type="submit" className="btn btn-primary">
            <span className="material-icons">save</span> Save Lead
          </button>
        </div>
      </form>
    </>
  )
}
