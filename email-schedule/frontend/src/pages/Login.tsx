
export default function Login() {
  const handleGoogleLogin = () => {
    window.location.href = `${import.meta.env.VITE_API_URL}/auth/google`;
  };

  const handleBypassLogin = () => {
    window.location.href = `${import.meta.env.VITE_API_URL}/auth/bypass`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f4f6f8]">
      <div className="max-w-[400px] w-full space-y-6 p-8 bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-[#e4e8eb]">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-gray-900">
            Login
          </h2>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-[#e4e8eb] rounded-xl bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm cursor-pointer"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
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
            Login with Google
          </button>

          <div className="relative flex py-2 items-center text-xs text-[#8a94a6] uppercase font-bold justify-center">
            <span className="bg-white px-3 relative z-10">or Sign in with Email</span>
            <div className="absolute left-0 right-0 h-[1px] bg-[#e4e8eb]" />
          </div>

          <div className="space-y-3">
            <div>
              <input
                type="email"
                placeholder="Username"
                className="w-full px-4 py-3 rounded-xl bg-[#f4f6f8] border border-transparent focus:border-[#00a854] focus:bg-white focus:outline-none transition-all text-sm text-gray-900"
              />
            </div>
            <div>
              <input
                type="password"
                placeholder="Password"
                className="w-full px-4 py-3 rounded-xl bg-[#f4f6f8] border border-transparent focus:border-[#00a854] focus:bg-white focus:outline-none transition-all text-sm text-gray-900"
              />
            </div>
          </div>

          <button
            onClick={handleBypassLogin}
            className="w-full bg-[#00a854] hover:bg-[#008f47] text-white font-bold py-3.5 px-4 rounded-xl text-sm transition-colors shadow-[0_4px_12px_rgba(0,168,84,0.2)] cursor-pointer"
          >
            Login
          </button>
        </div>
      </div>
    </div>
  );
}
