export default function Login() {
  const handleGoogleLogin = () => {
    window.location.href = `${import.meta.env.VITE_API_URL}/auth/google`;
  };

  const handleBypassLogin = () => {
    window.location.href = `${import.meta.env.VITE_API_URL}/auth/bypass`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#070b13] relative overflow-hidden font-sans">
      {/* Background glowing effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none animate-pulse duration-[8000ms]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-teal-500/10 blur-[130px] pointer-events-none animate-pulse duration-[10000ms]"></div>

      <div className="max-w-[420px] w-full mx-4 space-y-8 p-10 bg-[#0d1527]/60 backdrop-blur-xl rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/5 relative z-10 transition-all duration-300 hover:shadow-[0_20px_50px_rgba(4,120,87,0.15)]">
        <div className="text-center space-y-3">
          <div className="inline-flex p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 mb-1">
            <svg className="w-6 h-6 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-200 bg-clip-text text-transparent">
            Email Schedule
          </h2>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Enterprise Campaign Control
          </p>
        </div>

        <div className="space-y-6">
          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 py-3.5 px-4 border border-white/10 rounded-2xl bg-white/5 hover:bg-white/10 text-sm font-bold text-gray-200 transition-all shadow-sm cursor-pointer hover:border-emerald-500/50 hover:shadow-[0_4px_20px_rgba(16,185,129,0.1)] active:scale-[0.98]"
          >
            <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#FBBC05"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#34A853"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#4285F4"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Sign in with Google
          </button>

          <div className="relative flex py-2 items-center text-[10px] text-[#5b6a85] uppercase font-bold justify-center">
            <span className="bg-[#070b13] px-4 relative z-10 tracking-wider">or bypass credentials</span>
            <div className="absolute left-0 right-0 h-[1px] bg-white/5" />
          </div>

          <div className="space-y-4">
            <div className="relative">
              <input
                type="email"
                placeholder="Workspace Username"
                className="w-full px-4 py-3.5 rounded-2xl bg-[#080d19]/80 border border-white/5 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 focus:outline-none transition-all text-sm text-gray-100 placeholder-gray-500 shadow-inner animate-transition"
              />
            </div>
            <div className="relative">
              <input
                type="password"
                placeholder="Workspace Password"
                className="w-full px-4 py-3.5 rounded-2xl bg-[#080d19]/80 border border-white/5 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 focus:outline-none transition-all text-sm text-gray-100 placeholder-gray-500 shadow-inner animate-transition"
              />
            </div>
          </div>

          <button
            onClick={handleBypassLogin}
            className="w-full bg-[#00a854] hover:bg-[#00c261] active:scale-[0.98] text-[#070b13] font-bold py-4 px-4 rounded-2xl text-sm transition-all shadow-[0_4px_20px_rgba(0,168,84,0.3)] cursor-pointer tracking-wider flex items-center justify-center gap-2 hover:shadow-[0_4px_25px_rgba(0,168,84,0.45)]"
          >
            Launch Admin Workspace ➜
          </button>
        </div>
      </div>
    </div>
  );
}
