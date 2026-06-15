import type { ReactNode } from "react";
import { Activity, Stethoscope, HeartPulse } from "lucide-react";

interface Props {
  children: ReactNode;
}

export default function AuthLayout({ children }: Props) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">

      <div className="w-full md:w-1/2 flex items-center justify-center bg-white p-10">
        {children}
      </div>

      <div className="hidden md:flex w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-teal-800 items-center justify-center text-white p-12">

        <div className="max-w-lg">

          <div className="flex items-center gap-3 mb-6">
            <HeartPulse className="w-8 h-8" />
            <h2 className="text-2xl font-bold">HealthConnect</h2>
          </div>

          <h2 className="text-4xl font-bold mb-6">
            Streamlined Care. <br />
            Better Outcomes.
          </h2>

          <p className="text-blue-100 mb-8">
            A unified ecosystem connecting patients, doctors, and administrators.
          </p>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <Activity className="w-6 h-6 mb-2" />
              <p>Real-time Data</p>
            </div>

            <div>
              <Stethoscope className="w-6 h-6 mb-2" />
              <p>Treatment Tracking</p>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}