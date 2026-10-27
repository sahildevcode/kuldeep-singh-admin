import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { StudioDataProvider } from './context/StudioDataContext';
import { CartProvider } from './context/CartContext';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { Lock, Mail, KeyRound, ShieldAlert, ArrowLeft, RefreshCw, CheckCircle2 } from 'lucide-react';

const AdminPortalContent: React.FC = () => {
  const {
    isAdminAuthenticated,
    adminUser,
    adminLoading,
    adminAuthStep,
    pendingAdminEmail,
    adminError,
    setAdminError,
    requestAdminOtp,
    verifyAdminOtp,
    resendAdminOtp,
    adminLogout,
    resetAdminAuthState
  } = useAuth();

  const [email, setEmail] = useState('admin@kuldeepsingh.art');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [devOtpNotice, setDevOtpNotice] = useState<boolean>(false);

  // Countdown timer for resend cooldown
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setAdminError('Email and password are both required.');
      return;
    }
    setIsSubmitting(true);
    setDevOtpNotice(false);
    const result = await requestAdminOtp(email, password);
    setIsSubmitting(false);

    if (result.success) {
      setCooldown(60);
      if (result.devMode) {
        setDevOtpNotice(true);
      }
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setAdminError('Please enter the complete 6-digit verification code.');
      return;
    }
    setIsSubmitting(true);
    const result = await verifyAdminOtp(otp);
    setIsSubmitting(false);
    if (!result.success) {
      setOtp('');
    }
  };

  const handleResendOtp = async () => {
    if (cooldown > 0 || isSubmitting) return;
    setIsSubmitting(true);
    const result = await resendAdminOtp();
    setIsSubmitting(false);
    if (result.success) {
      setCooldown(60);
    } else if (result.cooldownRemaining) {
      setCooldown(result.cooldownRemaining);
    }
  };

  if (adminLoading) {
    return (
      <div className="min-h-screen bg-[#07090e] flex flex-col items-center justify-center text-gray-400">
        <div className="w-10 h-10 border-2 border-[#d4af37] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm tracking-widest uppercase font-serif">Verifying Security Credentials...</p>
      </div>
    );
  }

  // Not authenticated: Render Secure Multi-Factor Login Portal
  if (!isAdminAuthenticated) {
    return (
      <div className="min-h-screen bg-[#080a10] text-[#f4ede4] flex flex-col justify-center items-center px-4 relative overflow-hidden select-none">
        {/* Subtle background ambient glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-[#d4af37]/5 rounded-full blur-[130px] pointer-events-none" />

        <div className="max-w-md w-full bg-[#11141e] border border-[#262c3d] rounded-2xl p-8 shadow-2xl relative z-10 backdrop-blur-sm">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#181d2a] border border-[#d4af37]/30 flex items-center justify-center text-[#d4af37] shadow-inner shadow-[#d4af37]/10">
              <Lock className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-serif font-bold text-[#f4ede4] tracking-wide">
              Studio Admin Portal
            </h1>
            <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest font-sans">
              Artist Kuldeep Singh Atelier &bull; High Security
            </p>
          </div>

          {/* Error Message Alert */}
          {adminError && (
            <div className="mb-6 p-4 rounded-xl bg-red-950/40 border border-red-500/30 flex items-start space-x-3 text-red-200 text-xs leading-relaxed animate-shake">
              <ShieldAlert className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <span>{adminError}</span>
            </div>
          )}

          {/* Development Mode Notice */}
          {devOtpNotice && (
            <div className="mb-6 p-3 rounded-lg bg-amber-950/30 border border-amber-500/30 text-amber-200 text-xs text-center">
              <strong>Local Development Mode:</strong> Check your backend terminal console for the simulated 6-digit OTP code.
            </div>
          )}

          {/* STEP 1: Email + Password Challenge */}
          {adminAuthStep === 'credentials' && (
            <form onSubmit={handleCredentialsSubmit} className="space-y-5">
              <div>
                <label className="block text-xs uppercase tracking-wider text-gray-400 font-semibold mb-2">
                  Administrator Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 w-4 h-4 text-gray-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="admin@kuldeepsingh.art"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#0a0d14] border border-[#23293a] rounded-xl text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-gray-400 font-semibold mb-2">
                  Admin Master Password
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-3 w-4 h-4 text-gray-500" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Enter admin password"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#0a0d14] border border-[#23293a] rounded-xl text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b38f28] hover:from-[#e5c14f] hover:to-[#c49e35] text-black font-semibold text-sm tracking-wide transition shadow-lg shadow-[#d4af37]/20 flex items-center justify-center space-x-2 disabled:opacity-60 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <span>Continue to 2FA Verification</span>
                )}
              </button>
            </form>
          )}

          {/* STEP 2: Resend 6-Digit Email OTP Challenge */}
          {adminAuthStep === 'otp' && (
            <form onSubmit={handleOtpSubmit} className="space-y-6">
              <div className="text-center">
                <p className="text-xs text-gray-400 mb-1">
                  A 6-digit security code was dispatched to:
                </p>
                <p className="text-sm font-semibold text-[#d4af37] font-mono">
                  {pendingAdminEmail}
                </p>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-gray-400 font-semibold text-center mb-3">
                  Enter 6-Digit Security Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  autoFocus
                  required
                  placeholder="&bull;&bull;&bull;&bull;&bull;&bull;"
                  className="w-full py-3 text-center text-3xl font-mono tracking-[12px] bg-[#0a0d14] border-2 border-[#2b3347] focus:border-[#d4af37] rounded-xl text-[#d4af37] focus:outline-none focus:ring-2 focus:ring-[#d4af37]/30 transition"
                />
                <p className="text-[11px] text-gray-500 text-center mt-2">
                  Code expires in 5 minutes &bull; Max 5 attempts
                </p>
              </div>

              <div className="flex flex-col space-y-3">
                <button
                  type="submit"
                  disabled={isSubmitting || otp.length !== 6}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b38f28] hover:from-[#e5c14f] hover:to-[#c49e35] text-black font-semibold text-sm tracking-wide transition shadow-lg shadow-[#d4af37]/20 flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Verifying Security Code...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Authenticate & Enter Studio</span>
                    </>
                  )}
                </button>

                <div className="flex items-center justify-between pt-2 text-xs">
                  <button
                    type="button"
                    onClick={resetAdminAuthState}
                    className="text-gray-400 hover:text-gray-200 flex items-center space-x-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to login</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={cooldown > 0 || isSubmitting}
                    className={`font-medium cursor-pointer ${
                      cooldown > 0
                        ? 'text-gray-600 cursor-not-allowed'
                        : 'text-[#d4af37] hover:underline'
                    }`}
                  >
                    {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend Code'}
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Security Footer Notice */}
          <div className="mt-8 pt-4 border-t border-[#1d2333] text-center">
            <p className="text-[11px] text-gray-500">
              Session is secured with 2FA, Argon2id, and single-use crypto tokens.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated Admin Dashboard
  return (
    <div className="min-h-screen bg-[#06070a]">
      {/* Top Standalone Admin Bar */}
      <header className="sticky top-0 z-50 bg-[#0e111a]/95 backdrop-blur border-b border-[#22283a] px-6 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold text-sm text-gray-200 tracking-wide">
            Kuldeep Singh Studio Admin Portal
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-[#d4af37]/20 text-[#d4af37] font-mono border border-[#d4af37]/30">
            {adminUser?.email || 'Authorized Administrator'}
          </span>
        </div>

        <div className="flex items-center space-x-4">
          <a
            href="https://artistkuldeepsingh.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-gray-400 hover:text-[#d4af37] transition"
          >
            Visit Live Atelier &rarr;
          </a>
          <button
            onClick={adminLogout}
            className="text-xs px-3.5 py-1.5 rounded-lg bg-red-950/60 hover:bg-red-900 border border-red-800/40 text-red-200 transition font-medium cursor-pointer"
          >
            Secure Sign Out
          </button>
        </div>
      </header>

      <AdminDashboardPage onBackToSite={adminLogout} />
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <StudioDataProvider>
        <CartProvider>
          <AdminPortalContent />
        </CartProvider>
      </StudioDataProvider>
    </AuthProvider>
  );
}

export default App;
