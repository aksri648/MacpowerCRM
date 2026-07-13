import { SignUp as ClerkSignUp } from '@clerk/clerk-react'
import { Link } from 'react-router-dom'

export default function SignUp() {
  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <div className="auth-logo">
            <span className="material-icons">business_center</span>
          </div>
          <h1>MacpowerCRM</h1>
          <p>Create your account</p>
        </div>
        <ClerkSignUp
          routing="path"
          path="/sign-up"
          signInUrl="/sign-in"
          afterSignUpUrl="/complete-profile"
          appearance={{
            elements: {
              rootBox: 'clerk-root-box',
              card: 'clerk-card',
              formButtonPrimary: 'clerk-btn-primary',
            }
          }}
        />
        <div className="auth-footer">
          <p>Already have an account? <Link to="/sign-in">Sign in</Link></p>
        </div>
      </div>
    </div>
  )
}
