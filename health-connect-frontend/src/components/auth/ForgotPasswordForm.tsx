import { useState } from "react"

export default function ForgotPasswordForm(){

  const [email,setEmail] = useState("")
  const [otp,setOtp] = useState("")
  const [password,setPassword] = useState("")

  const handleSubmit=(e:React.FormEvent)=>{
    e.preventDefault()

    console.log({
      email,
      otp,
      password
    })
  }

  return(

    <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-md">

      <h2 className="text-2xl font-bold">Reset Password</h2>

      <input
        value={email}
        onChange={(e)=>setEmail(e.target.value)}
        placeholder="Email"
        className="w-full border p-3 rounded-xl"
      />

      <input
        value={otp}
        onChange={(e)=>setOtp(e.target.value)}
        placeholder="OTP"
        className="w-full border p-3 rounded-xl"
      />

      <input
        value={password}
        onChange={(e)=>setPassword(e.target.value)}
        placeholder="New Password"
        className="w-full border p-3 rounded-xl"
      />

      <button
        className="w-full bg-blue-600 text-white p-3 rounded-xl"
      >
        Reset Password
      </button>

    </form>

  )
}