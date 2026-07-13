import { SignIn as ClerkSignIn } from '@clerk/clerk-react'
import { Link } from 'react-router-dom'

export default function SignIn() {
  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <div className="auth-logo">
            <span className="material-icons">business_center</span>
          </div>
          <h1>MacpowerCRM</h1>
          <p>Sign in to manage your leads</p>
        </div>
        <ClerkSignIn
          routing="path"
          path="/sign-in"
          signUpUrl="/sign-up"
          afterSignInUrl="/"
          appearance={{
            elements: {
              rootBox: 'clerk-root-box',
              card: 'clerk-card',
              formButtonPrimary: 'clerk-btn-primary',
            }
          }}
        />
        <div className="auth-footer">
          <p>Don't have an account? <Link to="/sign-up">Sign up</Link></p>
        </div>
      </div>
    </div>
  )
}
