import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Logo } from './Logo';
import { Lock, Mail, Key, ShieldCheck, UserCheck, ArrowLeft, Loader2 } from 'lucide-react';

interface AuthModalProps {
  requiredRole: 'owner' | 'cashier';
}

export const AuthModal: React.FC<AuthModalProps> = ({ requiredRole }) => {
  const { language, t, login, setActiveView } = useStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setError(
        language === 'ar'
          ? 'يرجى إدخال البريد الإلكتروني وكلمة المرور'
          : 'Please enter your email and password'
      );
      return;
    }

    setLoading(true);
    try {
      const res = await login(trimmedEmail, password, requiredRole);
      if (!res.success) {
        setError(
          res.error ||
            (language === 'ar'
              ? 'بيانات تسجيل الدخول غير صحيحة، يرجى المحاولة مرة أخرى'
              : 'Invalid credentials. Please verify your email and password.')
        );
      }
    } catch (err: any) {
      setError(err?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#1A0A06] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Subtle Background Glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-[#D4AF37]/10 blur-3xl" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-[#2B140E]/50 blur-3xl" />

      <div className="relative w-full max-w-md bg-[#2B140E] rounded-3xl border border-[#D4AF37]/40 shadow-2xl p-6 sm:p-8 space-y-6 text-[#FFF5E1]">
        {/* Back to Public Menu Button */}
        <button
          onClick={() => setActiveView('store')}
          className="inline-flex items-center gap-1.5 text-xs text-[#F7E7A9]/80 hover:text-white transition-colors"
        >
          <ArrowLeft className={`w-4 h-4 ${language === 'ar' ? 'rotate-180' : ''}`} />
          <span>{t.continueShopping}</span>
        </button>

        {/* Brand Crest & Portal Header */}
        <div className="text-center flex flex-col items-center space-y-3">
          <Logo size="md" />
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#F7E7A9]">
            {requiredRole === 'owner' ? (
              <>
                <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>{t.ownerPortal}</span>
              </>
            ) : (
              <>
                <UserCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>{t.cashierPortal}</span>
              </>
            )}
          </div>
          <h2
            className="text-xl font-black text-[#FFF5E1]"
            style={{ fontFamily: language === 'ar' ? "'Cairo', sans-serif" : "'Cinzel', serif" }}
          >
            {t.loginTitle}
          </h2>
          <p className="text-xs text-[#F7E7A9]/70 max-w-xs">
            {t.loginSub}
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-[#F7E7A9] flex items-center gap-1.5 mb-1.5">
              <Mail className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>{t.emailOrUsername}</span>
            </label>
            <input
              type="email"
              required
              autoComplete="email"
              placeholder={requiredRole === 'owner' ? 'owner@example.com' : 'cashier@example.com'}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#1A0A06] border border-[#D4AF37]/30 text-sm text-white placeholder-gray-500 focus:outline-hidden focus:border-[#D4AF37]"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#F7E7A9] flex items-center gap-1.5 mb-1.5">
              <Key className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>{t.password}</span>
            </label>
            <input
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#1A0A06] border border-[#D4AF37]/30 text-sm text-white placeholder-gray-500 focus:outline-hidden focus:border-[#D4AF37]"
            />
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-xs text-red-300 font-medium">
              {error}
            </div>
          )}

          <button
            type="submit"
            id="portal-login-submit-btn"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all duration-200 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: 'linear-gradient(135deg, #D4AF37 0%, #B8911F 100%)',
              color: '#1A0A06',
              boxShadow: '0 4px 15px rgba(212, 175, 55, 0.4)',
            }}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-[#1A0A06]" />
                <span>{language === 'ar' ? 'جارٍ التحقق...' : 'Signing in...'}</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 text-[#1A0A06]" />
                <span>{t.loginButton}</span>
              </>
            )}
          </button>
        </form>

        {/* Security Notice */}
        <div className="pt-4 border-t border-[#D4AF37]/20 text-center">
          <p className="text-[11px] text-[#F7E7A9]/60 flex items-center justify-center gap-1.5">
            <Lock className="w-3 h-3 text-[#D4AF37]/70" />
            <span>
              {language === 'ar'
                ? 'محمي بواسطة مصادقة Supabase المشفرة'
                : 'Protected by Supabase Encrypted Authentication'}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};
