import { useState } from 'react'
import './ResetPassword.css'

const API_URL = 'http://localhost:5000'

export default function ResetPassword({ onBackToLogin, onResetComplete }) {
  const [email, setEmail] = useState(sessionStorage.getItem('resetEmail') || '')
  const [otp, setOtp] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const validate = () => {
    const e = {}
    if (!otp.trim()) e.otp = 'OTP code is required'
    if (!password) e.password = 'Password is required'
    else if (password.length < 8) e.password = 'Password must be at least 8 characters'
    if (confirm !== password) e.confirm = "Passwords don't match"
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    setErrors({})

    try {
      // Call reset password API with OTP verification
      const resetResponse = await fetch(`${API_URL}/api/user/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, newPassword: password }),
      })

      const resetData = await resetResponse.json()

      if (!resetResponse.ok) {
        setErrors({ submit: resetData.error || 'Failed to reset password' })
        return
      }

      console.log('Password reset successful for', email)
      sessionStorage.removeItem('resetEmail')
      if (typeof onResetComplete === 'function') onResetComplete()
    } catch (err) {
      console.error('Error:', err)
      setErrors({ submit: 'Network error. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="reset-container">
      <div className="reset-card">
        <h1 className="reset-title">Reset Password</h1>
        <p className="reset-subtitle">Enter the OTP and a new password</p>

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="otp">OTP Code</label>
            <input
              id="otp"
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              disabled={loading}
              className={errors.otp ? 'input-error' : ''}
            />
            {errors.otp && <div className="error-message">{errors.otp}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="password">New Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              className={errors.password ? 'input-error' : ''}
            />
            {errors.password && <div className="error-message">{errors.password}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="confirm">Confirm Password</label>
            <input
              id="confirm"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              disabled={loading}
              className={errors.confirm ? 'input-error' : ''}
            />
            {errors.confirm && <div className="error-message">{errors.confirm}</div>}
          </div>

          {errors.submit && <div className="error-message" style={{ marginBottom: '16px' }}>{errors.submit}</div>}

          <button type="submit" className="confirm-button" disabled={loading}>
            {loading ? 'Confirming...' : 'Confirm'}
          </button>
        </form>

        <div className="back-to-signin">
          <button className="link-button" onClick={onBackToLogin} disabled={loading}>
            Back to Sign In
          </button>
        </div>
      </div>
    </div>
  )
}
