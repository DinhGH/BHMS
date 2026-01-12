import { useState } from 'react'
import Login from './components/Login'
import ForgotPassword from './components/ForgotPassword'
import ResetPassword from './components/ResetPassword'

export default function App() {
  const [screen, setScreen] = useState('login')

  return (
    <>
      {screen === 'login' && (
        <Login onForgotPassword={() => setScreen('forgot')} />
      )}

      {screen === 'forgot' && (
        <ForgotPassword onOtpSent={() => setScreen('reset')} />
      )}

      {screen === 'reset' && (
        <ResetPassword
          onBackToLogin={() => setScreen('login')}
          onResetComplete={() => setScreen('login')}
        />
      )}
    </>
  )
}
