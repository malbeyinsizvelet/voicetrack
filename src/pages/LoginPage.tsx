import { useState, type FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mic, Eye, EyeOff, AlertCircle, Zap, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { MOCK_USERS, MOCK_CREDENTIALS } from '../mock';
import { ROLE_LABELS } from '../utils/formatters';

export function LoginPage() {
  const { login } = useAuth();
  const navigate   = useNavigate();
  const location   = useLocation();

  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [showPass, setShowPass]   = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]         = useState<string | null>(null);

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/dashboard';

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await login({ email: email.trim(), password });
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Giriş yapılamadı.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleQuickLogin(userId: string) {
    const credential = MOCK_CREDENTIALS.find((c) => c.userId === userId);
    if (!credential) return;
    setError(null);
    setIsLoading(true);
    try {
      await login({ email: credential.email, password: credential.password });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Giriş yapılamadı.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg-base)' }}>

      {/* ── Left: Brand Panel ─────────────────────────────── */}
      <div
        className="hidden lg:flex lg:w-[440px] xl:w-[500px] flex-col justify-between p-12 shrink-0"
        style={{
          background: '#0F100F',
          borderRight: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.12)' }}
          >
            <Mic className="w-5 h-5" style={{ color: '#ffffff' }} />
          </div>
          <div>
            <span className="font-bold text-base leading-none" style={{ color: '#ffffff' }}>
              VoiceTrack
            </span>
            <span className="block text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Studio Management
            </span>
          </div>
        </div>

        {/* Main copy */}
        <div className="space-y-6">
          <div className="space-y-4">
            <h1 className="text-3xl xl:text-4xl font-bold leading-tight" style={{ color: '#ffffff' }}>
              Seslendirme projelerini<br />
              <span style={{ color: 'rgba(255,255,255,0.50)' }}>akıllıca yönet.</span>
            </h1>
            <p className="text-base leading-relaxed max-w-sm" style={{ color: 'rgba(255,255,255,0.40)' }}>
              Proje yöneticileri, seslendirme sanatçıları ve QC uzmanları için
              tek platform. Cast takibi, ses dosyası yönetimi ve ilerleme takibi.
            </p>
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2">
            {['Proje Takibi', 'Cast Yönetimi', 'Ses Dosyası Akışı', 'QC Sistemi', 'Mix & Master'].map((f) => (
              <span
                key={f}
                className="px-3 py-1 rounded-full text-xs"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.10)',
                  color: 'rgba(255,255,255,0.45)',
                }}
              >
                {f}
              </span>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.20)' }}>
          © 2025 VoiceTrack Studio · Demo v1.0
        </p>
      </div>

      {/* ── Right: Login Form ──────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-7">

          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-3 justify-center mb-2">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}
            >
              <Mic className="w-4 h-4" />
            </div>
            <span className="font-bold" style={{ color: 'var(--text-primary)' }}>VoiceTrack Studio</span>
          </div>

          {/* Heading */}
          <div className="space-y-1">
            <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Giriş Yap</h2>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Devam etmek için hesabınıza giriş yapın.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div
              className="flex items-start gap-3 px-4 py-3 rounded-xl"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid var(--border-strong)',
              }}
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--text-primary)' }} />
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-sm font-medium"
                     style={{ color: 'var(--text-secondary)' }}>
                E-posta
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ornek@voicetrack.io"
                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-colors"
                style={{
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--border-strong)')}
                onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-medium"
                       style={{ color: 'var(--text-secondary)' }}>
                  Şifre
                </label>
                <button
                  type="button"
                  className="text-xs transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                >
                  Şifremi unuttum
                </button>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 pr-11 rounded-xl text-sm outline-none transition-colors"
                  style={{
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)',
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--border-strong)')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-opacity"
              style={{
                background: 'var(--accent)',
                color: 'var(--accent-text)',
                opacity: isLoading ? 0.7 : 1,
              }}
            >
              {isLoading ? (
                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <LogIn className="w-4 h-4" />
              )}
              {isLoading ? 'Giriş yapılıyor…' : 'Giriş Yap'}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Demo hesaplar</span>
            <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
          </div>

          {/* Quick logins */}
          <div className="grid grid-cols-2 gap-2">
            {MOCK_USERS.map((user) => (
              <button
                key={user.id}
                onClick={() => handleQuickLogin(user.id)}
                disabled={isLoading}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-left transition-colors"
                style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--border-strong)')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
              >
                <Zap className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--text-muted)' }} />
                <div className="min-w-0">
                  <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                    {user.name.split(' ')[0]}
                  </p>
                  <p className="text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>
                    {ROLE_LABELS[user.role]}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
