import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    <SignUp 
      appearance={{
        elements: {
          rootBox: "mx-auto",
          card: "shadow-none border-none bg-transparent",
          headerTitle: "text-2xl font-bold text-black",
          headerSubtitle: "text-gray-600",
          formButtonPrimary: "bg-black hover:bg-gray-800 rounded-full font-bold",
          formFieldInput: "rounded-full border-gray-200 focus:border-black",
          footerActionLink: "text-black hover:text-gray-800 font-medium",
        }
      }}
      redirectUrl="/dashboard"
      signInUrl="/sign-in"
    />
  )
}