import { useState } from 'react'
import './Login.css'

export default function Login({ onForgotPassword }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSignIn = (e) => {
    e.preventDefault()
    console.log('Sign in:', { email, password })
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="login-title">Sign In</h1>
        <p className="login-subtitle">Smart & Convenient Boarding House Management</p>
        
        <form onSubmit={handleSignIn}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder=""
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder=""
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="forgot-password">
            <button
              type="button"
              className="forgot-password-btn"
              onClick={onForgotPassword}
            >
              Forgot Password?
            </button>
          </div>

          <button type="submit" className="signin-button">
            Sign In
          </button>
        </form>
      </div>
    </div>
  )
}
