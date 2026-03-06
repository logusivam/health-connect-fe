import { useState } from "react"
import type { Role } from "../../types/auth.types"
import usePasswordStrength from "../../hooks/usePasswordStrength"

export default function RegisterForm(){

  const [firstName,setFirstName] = useState("")
  const [lastName,setLastName] = useState("")
  const [email,setEmail] = useState("")
  const [password,setPassword] = useState("")
  const [role,setRole] = useState<Role>("PATIENT")

  const strength = usePasswordStrength(password)

  const handleSubmit=(e:React.FormEvent)=>{
    e.preventDefault()

    console.log({
      firstName,
      lastName,
      email,
      password,
      role
    })
  }

  return(

    <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-md">

      <h2 className="text-2xl font-bold">Register</h2>

      <input
        value={firstName}
        onChange={(e)=>setFirstName(e.target.value)}
        placeholder="First Name"
        className="w-full border p-3 rounded-xl"
      />

      <input
        value={lastName}
        onChange={(e)=>setLastName(e.target.value)}
        placeholder="Last Name"
        className="w-full border p-3 rounded-xl"
      />

      <input
        value={email}
        onChange={(e)=>setEmail(e.target.value)}
        placeholder="Email"
        className="w-full border p-3 rounded-xl"
      />

      <input
        value={password}
        onChange={(e)=>setPassword(e.target.value)}
        placeholder="Password"
        type="password"
        className="w-full border p-3 rounded-xl"
      />

      <p>Password Strength: {strength}</p>

      <button
        className="w-full bg-blue-600 text-white p-3 rounded-xl"
      >
        Create Account
      </button>

    </form>

  )
}