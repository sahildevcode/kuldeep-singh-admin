import React, { useState } from 'react';
import { StudioDataProvider } from './context/StudioDataContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { ShieldCheck, Lock, Mail, Key, ExternalLink, Sparkles, ArrowRight, AlertCircle } from 'lucide-react';

const AdminPortalContent: React.FC = () => {
  const { isAdminAuthenticated, adminLogin, adminLogout } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    setTimeout(() => {
      const success = adminLogin(email, password);
      setIsLoading(false);
      if (!success) {
        setError('Invalid studio credentials. Default is admin@kuldeepsingh.art / kuldeep2026');
      }
    }, 400);
  };

  const handleQuickDemoLogin = () => {
    setEmail('admin@kuldeepsingh.art');
    setPassword('kuldeep2026');
    adminLogin('admin@kuldeepsingh.art', 'kuldeep2026');
  };

  if (!isAdminAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0B0F19] text-[#F3F4F6] flex flex-col justify-center items-center px-4 sm:px-6 relative overflow-hidden">
        {/* Background decorative glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#E63946]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-72 h-72 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />

        <div className="w-full max-w-md bg-[#131B2E] border border-gray-800 rounded-3xl p-8 sm:p-10 shadow-2xl relative z-10">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#E63946] to-amber-600 text-white shadow-lg mb-5 ring-4 ring-[#E63946]/20">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <span className="text-[10px] uppercase font-bold tracking-[0.3em] text-[#E63946] bg-[#E63946]/10 px-3 py-1 rounded-full border border-[#E63946]/30">
              Studio Owner Portal
            </span>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white mt-3 mb-1 tracking-tight">
              Artist Kuldeep Singh
            </h1>
            <p className="text-xs text-gray-400">
              Direct Management Console • Paintings, Courses & Live Studio
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-[11px] uppercase font-bold tracking-wider text-gray-400 mb-1.5">
                Owner Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@kuldeepsingh.art"
                  className="w-full bg-[#0B0F19] border border-gray-700/80 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#E63946] transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] uppercase font-bold tracking-wider text-gray-400 mb-1.5">
                Passcode / Master Key
              </label>
              <div className="relative">
                <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-[#0B0F19] border border-gray-700/80 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#E63946] transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#E63946] hover:bg-[#c92a37] text-white font-semibold py-3.5 px-4 rounded-xl text-sm transition-all shadow-lg shadow-[#E63946]/30 flex items-center justify-center gap-2 mt-2 cursor-pointer disabled:opacity-50"
            >
              <Lock className="w-4 h-4" />
              <span>{isLoading ? 'Authenticating...' : 'Enter Studio Control Center'}</span>
            </button>
          </form>

          {/* Quick Demo Access */}
          <div className="mt-6 pt-6 border-t border-gray-800/80">
            <button
              type="button"
              onClick={handleQuickDemoLogin}
              className="w-full py-2.5 px-4 bg-gray-800/60 hover:bg-gray-800 text-gray-300 hover:text-white rounded-xl text-xs font-medium flex items-center justify-center gap-2 transition-all border border-gray-700/50 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>One-Click Login as Artist Kuldeep</span>
              <ArrowRight className="w-3 h-3 text-gray-400" />
            </button>
            <p className="text-[11px] text-gray-500 text-center mt-2.5">
              Default: <code className="text-gray-400">admin@kuldeepsingh.art</code> / <code className="text-gray-400">kuldeep2026</code>
            </p>
          </div>

          {/* Public website link */}
          <div className="mt-6 text-center">
            <a
              href="https://sahildevcode.github.io/artist-kuldeep-singh/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-[#E63946] transition-colors"
            >
              <span>View Public Student & Customer Website</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F19] text-gray-100 flex flex-col">
      {/* Top Standalone Admin Bar */}
      <div className="bg-[#111827] border-b border-gray-800 px-6 py-2.5 flex items-center justify-between text-xs">
        <div className="flex items-center gap-3">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-semibold text-gray-200">Kuldeep Singh Studio Admin Portal</span>
          <span className="hidden sm:inline text-gray-500">• Standalone Management Console</span>
        </div>
        <div className="flex items-center gap-4">
          <a
            href="https://sahildevcode.github.io/artist-kuldeep-singh/"
            target="_blank"
            rel="noreferrer"
            className="text-gray-400 hover:text-white flex items-center gap-1 transition-colors"
          >
            <span>Live Public Site</span>
            <ExternalLink className="w-3 h-3" />
          </a>
          <button
            onClick={adminLogout}
            className="text-red-400 hover:text-red-300 font-medium cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      </div>

      <div className="flex-1">
        <AdminDashboardPage onBackToSite={adminLogout} />
      </div>
    </div>
  );
};

export default function App() {
  return (
    <StudioDataProvider>
      <AuthProvider>
        <CartProvider>
          <AdminPortalContent />
        </CartProvider>
      </AuthProvider>
    </StudioDataProvider>
  );
}
