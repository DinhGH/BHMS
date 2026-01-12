import { useState } from 'react'
import './ForgotPassword.css'

const API_URL = 'http://localhost:5000'

export default function ForgotPassword({ onOtpSent }) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const validateEmail = (value) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
  }

  const handleChange = (e) => {
    const v = e.target.value
    setEmail(v)
    if (error) {
      if (validateEmail(v)) setError('')
      else setError('Please enter a valid email address')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateEmail(email)) {
      setError('Please enter a valid email address')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch(`${API_URL}/api/user/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to send OTP')
        return
      }

      // Store email in sessionStorage for next step
      sessionStorage.setItem('resetEmail', email)
      
      console.log('OTP sent to', email)
      if (typeof onOtpSent === 'function') {
        onOtpSent(email)
      }
    } catch (err) {
      console.error('Error:', err)
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="forgotpassword-container">
      <div className="forgotpassword-card">
        <h1 className="forgotpassword-title">Forgot Password</h1>
        <p className="forgotpassword-subtitle">Enter your email to receive an OTP code</p>

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="email">Registered Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={handleChange}
              disabled={loading}
              required
              aria-invalid={error ? 'true' : 'false'}
              aria-describedby={error ? 'email-error' : undefined}
              className={error ? 'input-error' : ''}
            />
            {error && (
              <div id="email-error" className="error-message">
                {error}
              </div>
            )}
          </div>

          <button type="submit" className="send-otp-button" disabled={loading}>
            {loading ? 'Sending...' : 'Send OTP Code'}
          </button>
        </form>

        <p className="otp-message">We system will send a confirmation code to your email</p>
      </div>
    </div>
  )
}
