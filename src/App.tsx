import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { StudioDataProvider } from './context/StudioDataContext';
import { CartProvider } from './context/CartContext';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import {
  Lock,
  Mail,
  KeyRound,
  ShieldAlert,
  ArrowLeft,
  RefreshCw,
  CheckCircle2,
  Eye,
  EyeOff,
  HelpCircle,
  Key
} from 'lucide-react';

const AdminPortalContent: React.FC = () => {
  const {
    isAdminAuthenticated,
    adminLoading,
    adminAuthStep,
    pendingAdminEmail,
    adminError,
    setAdminError,
    requestAdminOtp,
    verifyAdminOtp,
    resendAdminOtp,
    requestForgotPasswordOtp,
    resetAdminPasswordWithOtp,
    resetAdminAuthState
  } = useAuth();

  const [email, setEmail] = useState('admin@kuldeepsingh.art');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Forgot password flow state
  const [isForgotMode, setIsForgotMode] = useState(false);
  const [forgotStep, setForgotStep] = useState<'request' | 'verify'>('request');
  const [forgotEmail, setForgotEmail] = useState('');
  const [recoveryOtp, setRecoveryOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [forgotSuccessMsg, setForgotSuccessMsg] = useState<string | null>(null);

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
      setAdminError('Please enter a valid 6-digit verification code.');
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

  // Forgot Password: Step 1 (Send Recovery OTP)
  const handleRequestRecoveryOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) {
      setAdminError('Please enter your administrator email.');
      return;
    }
    setIsSubmitting(true);
    setForgotSuccessMsg(null);
    const result = await requestForgotPasswordOtp(forgotEmail);
    setIsSubmitting(false);

    if (result.success) {
      setForgotStep('verify');
      setCooldown(result.cooldownRemaining || 60);
      setForgotSuccessMsg(result.message || 'Recovery code sent to your email.');
    }
  };

  // Forgot Password: Step 2 (Verify OTP & Set New Password)
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (recoveryOtp.length !== 6) {
      setAdminError('Please enter the 6-digit recovery code.');
      return;
    }
    if (newPassword.length < 8) {
      setAdminError('New password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setAdminError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    const result = await resetAdminPasswordWithOtp(forgotEmail, recoveryOtp, newPassword);
    setIsSubmitting(false);

    if (result.success) {
      setForgotSuccessMsg('Password updated successfully! You can now log in.');
      setTimeout(() => {
        setIsForgotMode(false);
        setForgotStep('request');
        setPassword('');
        setRecoveryOtp('');
        setNewPassword('');
        setConfirmPassword('');
        setForgotSuccessMsg(null);
        setAdminError(null);
      }, 2500);
    }
  };

  const openForgotMode = () => {
    setIsForgotMode(true);
    setForgotStep('request');
    setForgotEmail(email);
    setRecoveryOtp('');
    setNewPassword('');
    setConfirmPassword('');
    setForgotSuccessMsg(null);
    setAdminError(null);
  };

  const closeForgotMode = () => {
    setIsForgotMode(false);
    setForgotStep('request');
    setForgotSuccessMsg(null);
    setAdminError(null);
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
              {isForgotMode ? 'Recover Admin Password' : 'Studio Admin Portal'}
            </h1>
            <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest font-sans">
              Artist Kuldeep Singh Atelier &bull; High Security
            </p>
          </div>

          {/* Success Message Alert */}
          {forgotSuccessMsg && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-start space-x-3 text-emerald-200 text-xs leading-relaxed animate-fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <span>{forgotSuccessMsg}</span>
            </div>
          )}

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

          {/* ========================================================= */}
          {/* FORGOT PASSWORD FLOW                                      */}
          {/* ========================================================= */}
          {isForgotMode ? (
            <div>
              {forgotStep === 'request' ? (
                <form onSubmit={handleRequestRecoveryOtp} className="space-y-5">
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Apna registered administrator email enter karein. Hum aapki email par ek <strong>6-digit OTP recovery code</strong> bhejenge jisse aap naya password set kar sakte hain.
                  </p>

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-gray-400 font-semibold mb-2">
                      Administrator Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3 w-4 h-4 text-gray-500" />
                      <input
                        type="email"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        required
                        placeholder="admin@kuldeepsingh.art"
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
                        <span>Sending Recovery Code...</span>
                      </>
                    ) : (
                      <span>Send Recovery OTP to Email</span>
                    )}
                  </button>

                  <div className="pt-2 text-center">
                    <button
                      type="button"
                      onClick={closeForgotMode}
                      className="text-xs text-gray-400 hover:text-gray-200 inline-flex items-center space-x-1 cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back to Login</span>
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                  <div className="text-center pb-2">
                    <p className="text-xs text-gray-400 mb-1">
                      Recovery code dispatched to:
                    </p>
                    <p className="text-sm font-semibold text-[#d4af37] font-mono">
                      {forgotEmail}
                    </p>
                  </div>

                  {/* 6-Digit OTP */}
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-gray-400 font-semibold mb-2">
                      Enter 6-Digit Recovery Code
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={recoveryOtp}
                      onChange={(e) => setRecoveryOtp(e.target.value.replace(/\D/g, ''))}
                      autoFocus
                      required
                      placeholder="&bull;&bull;&bull;&bull;&bull;&bull;"
                      className="w-full py-2.5 text-center text-2xl font-mono tracking-[8px] bg-[#0a0d14] border-2 border-[#2b3347] focus:border-[#d4af37] rounded-xl text-[#d4af37] focus:outline-none transition"
                    />
                  </div>

                  {/* New Password with Hide/Unhide */}
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-gray-400 font-semibold mb-2">
                      New Admin Password (min 8 chars)
                    </label>
                    <div className="relative">
                      <Key className="absolute left-3.5 top-3 w-4 h-4 text-gray-500" />
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        placeholder="Enter new password"
                        className="w-full pl-10 pr-11 py-2.5 bg-[#0a0d14] border border-[#23293a] rounded-xl text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-[#d4af37] transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3.5 top-2.5 p-1 text-gray-400 hover:text-gray-200 transition-colors cursor-pointer"
                        title={showNewPassword ? 'Hide password' : 'Show password'}
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-gray-400 font-semibold mb-2">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <KeyRound className="absolute left-3.5 top-3 w-4 h-4 text-gray-500" />
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        placeholder="Re-enter new password"
                        className="w-full pl-10 pr-4 py-2.5 bg-[#0a0d14] border border-[#23293a] rounded-xl text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-[#d4af37] transition"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || recoveryOtp.length !== 6 || newPassword.length < 8}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b38f28] hover:from-[#e5c14f] hover:to-[#c49e35] text-black font-semibold text-sm tracking-wide transition shadow-lg shadow-[#d4af37]/20 flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer mt-2"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Updating Password...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Update Password & Return to Login</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-between pt-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setForgotStep('request')}
                      className="text-gray-400 hover:text-gray-200 flex items-center space-x-1 cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Change Email</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleRequestRecoveryOtp}
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
                </form>
              )}
            </div>
          ) : (
            <>
              {/* ========================================================= */}
              {/* STEP 1: Email + Password Challenge                        */}
              {/* ========================================================= */}
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
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs uppercase tracking-wider text-gray-400 font-semibold">
                        Admin Master Password
                      </label>
                      <button
                        type="button"
                        onClick={openForgotMode}
                        className="text-xs text-[#d4af37] hover:underline cursor-pointer flex items-center gap-1 font-medium"
                      >
                        <HelpCircle className="w-3 h-3" />
                        <span>Forgot Password?</span>
                      </button>
                    </div>

                    <div className="relative">
                      <KeyRound className="absolute left-3.5 top-3 w-4 h-4 text-gray-500" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        placeholder="Enter admin password"
                        className="w-full pl-10 pr-11 py-2.5 bg-[#0a0d14] border border-[#23293a] rounded-xl text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-2.5 p-1 text-gray-400 hover:text-gray-200 transition-colors cursor-pointer"
                        title={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
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

              {/* ========================================================= */}
              {/* STEP 2: Resend 6-Digit Email OTP Challenge                */}
              {/* ========================================================= */}
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
            </>
          )}

          {/* Footer Security Badges */}
          <div className="mt-8 pt-6 border-t border-[#1e2433] text-center">
            <p className="text-[11px] text-gray-500 leading-relaxed font-sans">
              Session is secured with 2FA, Argon2id, and single-use crypto tokens.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated: Render Main Admin Dashboard
  return (
    <div className="min-h-screen bg-[#0d0f15] text-[#f4ede4] flex flex-col antialiased">
      <AdminDashboardPage />
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <StudioDataProvider>
          <AdminPortalContent />
        </StudioDataProvider>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
