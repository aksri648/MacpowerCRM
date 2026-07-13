import { SignIn as ClerkSignIn } from '@clerk/clerk-react'

export default function SignIn() {
  return (
    <div className="auth-page">
      <div className="auth-box">
        <img src="/logo.jpg" alt="MacpowerCRM" className="auth-logo-img" />
        <ClerkSignIn
          routing="path"
          path="/sign-in"
          signUpUrl="/sign-up"
          fallbackRedirectUrl="/"
        />
      </div>
    </div>
  )
}
