import { HeartPulse } from 'lucide-react';
import { HealthCheckup } from './components/HealthCheckup';

/** Stand-alone Finance Health Check-up portal: open to everyone, no login. */
export default function HealthCheckApp() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center">
            <HeartPulse className="w-4 h-4" />
          </div>
          <span className="font-black text-slate-900 tracking-tight text-sm sm:text-base">Finance Health Check-up</span>
        </div>
      </header>
      <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-8">
        <HealthCheckup source="health_portal" />
      </main>
      <footer className="py-5 text-center text-[11px] text-slate-500">
        This check-up is based only on your own answers and is for general awareness. It is not financial, tax or legal advice.
      </footer>
    </div>
  );
}
