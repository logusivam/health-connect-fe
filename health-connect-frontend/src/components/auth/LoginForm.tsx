import { useState } from "react";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import type { Role } from "../../types/auth.types";

export default function LoginForm() {

  const [email,setEmail] = useState("")
  const [password,setPassword] = useState("")
  const [showPassword,setShowPassword] = useState(false)
  const [role,setRole] = useState<Role>("PATIENT")

  const handleSubmit = (e:React.FormEvent)=>{
    e.preventDefault()

    console.log({
      email,
      password,
      role
    })
  }

  return (

    <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-md">

      <h2 className="text-2xl font-bold mb-6">Login</h2>

      <select
        value={role}
        onChange={(e)=>setRole(e.target.value as Role)}
        className="w-full border rounded-xl p-3"
      >
        <option value="PATIENT">Patient</option>
        <option value="DOCTOR">Doctor</option>
      </select>

      <div className="relative">

        <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400"/>

        <input
          type="email"
          required
          value={email}
          onChange={(e)=>setEmail(e.target.value)}
          placeholder="Email"
          className="pl-10 w-full border rounded-xl p-3"
        />

      </div>

      <div className="relative">

        <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400"/>

        <input
          type={showPassword ? "text":"password"}
          required
          value={password}
          onChange={(e)=>setPassword(e.target.value)}
          placeholder="Password"
          className="pl-10 pr-10 w-full border rounded-xl p-3"
        />

        <button
          type="button"
          onClick={()=>setShowPassword(!showPassword)}
          className="absolute right-3 top-3"
        >
          {showPassword ? <EyeOff/> : <Eye/>}
        </button>

      </div>

      <button
        type="submit"
        className="w-full bg-blue-600 text-white rounded-xl p-3"
      >
        Sign In
      </button>

    </form>
  )
}