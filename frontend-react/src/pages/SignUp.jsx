import { SignUp as ClerkSignUp } from '@clerk/clerk-react'

export default function SignUp() {
  return (
    <div className="auth-page">
      <div className="auth-box">
        <img src="/logo.jpg" alt="MacpowerCRM" className="auth-logo-img" />
        <ClerkSignUp
          routing="path"
          path="/sign-up"
          signInUrl="/sign-in"
          fallbackRedirectUrl="/"
        />
      </div>
    </div>
  )
}
