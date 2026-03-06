import { useState } from "react"
import AuthLayout from "../../components/auth/AuthLayout"
import LoginForm from "../../components/auth/LoginForm"
import RegisterForm from "../../components/auth/RegisterForm"
import ForgotPasswordForm from "../../components/auth/ForgotPasswordForm"

export default function AuthPage(){

  const [mode,setMode] = useState<"login" | "register" | "forgot">("login")

  return(

    <AuthLayout>

      {mode === "login" && (
        <>
          <LoginForm/>
          <p className="mt-4 text-sm">
            No account?
            <button
              onClick={()=>setMode("register")}
              className="text-blue-600 ml-2"
            >
              Register
            </button>
          </p>

          <p className="text-sm mt-2">
            <button
              onClick={()=>setMode("forgot")}
              className="text-blue-600"
            >
              Forgot Password
            </button>
          </p>
        </>
      )}

      {mode === "register" && (
        <>
          <RegisterForm/>
          <p className="mt-4 text-sm">
            Already have account?
            <button
              onClick={()=>setMode("login")}
              className="text-blue-600 ml-2"
            >
              Login
            </button>
          </p>
        </>
      )}

      {mode === "forgot" && (
        <>
          <ForgotPasswordForm/>
          <button
            onClick={()=>setMode("login")}
            className="text-blue-600 mt-4"
          >
            Back to Login
          </button>
        </>
      )}

    </AuthLayout>

  )
}