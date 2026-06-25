'use client';

import { useState, useEffect, Suspense, type FormEvent } from 'react';
import { signIn, getProviders } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useAccount, useSignMessage } from 'wagmi';
import { Mail, KeyRound, ArrowLeft, Loader2, RotateCw, Wallet } from 'lucide-react';
import { ConnectWallet } from '@/components/web3/connect-wallet';

type Tab = 'password' | 'code';
type Step = 'form' | 'verify';

function SignInForm() {
  const t = useTranslations('auth');
  const locale = useLocale();
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get('callbackUrl') || `/${locale}/profile`;

  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();

  const [tab, setTab] = useState<Tab>('password');
  const [isSignup, setIsSignup] = useState(false);
  const [step, setStep] = useState<Step>('form');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [googleEnabled, setGoogleEnabled] = useState(false);

  useEffect(() => {
    getProviders()
      .then((p) => setGoogleEnabled(Boolean(p && 'google' in p)))
      .catch(() => setGoogleEnabled(false));
  }, []);

  const errCode = params.get('error');
  const oauthError = errCode
    ? errCode === 'OAuthAccountNotLinked'
      ? t('googleLinkConflict')
      : t('googleFailed')
    : '';

  const go = () => router.push(callbackUrl);

  function backToForm() {
    setStep('form');
    setCode('');
    setError('');
    setInfo('');
  }

  async function walletSignIn() {
    setError('');
    setInfo('');
    setLoading(true);
    try {
      if (!isConnected || !address) throw new Error(t('walletConnectFirst'));
      const nonceRes = await fetch('/api/auth/nonce', { cache: 'no-store' });
      const { nonce } = await nonceRes.json();
      const message = `Arc Souk wants you to sign in with your wallet.\n\nWallet: ${address}\nNonce: ${nonce}`;
      const signature = await signMessageAsync({ message });
      const r = await signIn('siwe', { message, signature, redirect: false });
      if (r?.error) throw new Error(t('walletFailed'));
      go();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('walletFailed'));
    } finally {
      setLoading(false);
    }
  }

  async function handlePassword(e: FormEvent) {
    e.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);
    try {
      if (isSignup) {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password }),
        });
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          throw new Error(d.error || 'Could not create account');
        }
        setStep('verify');
        setInfo(t('verifyNewAccount'));
        return;
      }

      const r = await signIn('credentials', { email, password, redirect: false });
      if (r?.error) {
        if (r.error === 'EMAIL_NOT_VERIFIED') {
          await fetch('/api/auth/otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
          });
          setStep('verify');
          setInfo(t('verifyExisting'));
          return;
        }
        throw new Error(t('wrongCreds'));
      }
      go();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('wrongCreds'));
    } finally {
      setLoading(false);
    }
  }

  async function sendCode(e: FormEvent) {
    e.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'Could not send code');
      }
      setStep('verify');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  async function resend() {
    setError('');
    setInfo('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'Could not send code');
      }
      setInfo(t('resent'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  async function verifyCode(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const r = await signIn('email-otp', { email, code, redirect: false });
      if (r?.error) throw new Error(t('badCode'));
      go();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('badCode'));
    } finally {
      setLoading(false);
    }
  }

  const inputCls =
    'w-full rounded-xl border border-line bg-surface2 px-4 py-3 text-[15px] text-ink outline-none transition focus:border-accent';
  const altBtn =
    'flex w-full items-center justify-center gap-3 rounded-xl border border-lineStrong bg-surface2 px-4 py-3 font-medium transition hover:border-accent disabled:opacity-60';

  return (
    <div className="grid min-h-screen place-items-center px-6 py-[140px]">
      <div className="w-full max-w-[440px] rounded-3xl border border-line bg-surface p-8 backdrop-blur-xl">
        <div className="font-mono text-[11px] uppercase tracking-[.2em] text-accent">Arc Souk</div>

        {step === 'verify' ? (
          <>
            <h1 className="mt-3 font-display text-[2rem] font-semibold tracking-tight">{t('verifyTitle')}</h1>
            <p className="mt-2 text-[14px] text-ink2">
              {t('codeSentTo')} <span className="text-ink">{email}</span>
            </p>

            <form onSubmit={verifyCode} className="mt-7 space-y-3">
              <input
                className={`${inputCls} text-center font-mono text-[20px] tracking-[.4em]`}
                inputMode="numeric"
                autoFocus
                required
                placeholder={t('codePh')}
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
              <button
                data-cursor
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 font-semibold text-white shadow-glow transition hover:-translate-y-[1px] disabled:opacity-60"
              >
                {loading && <Loader2 size={16} className="animate-spin" />} {t('verify')}
              </button>
            </form>

            <div className="mt-4 flex items-center justify-between text-[13px]">
              <button type="button" onClick={backToForm} className="inline-flex items-center gap-1 text-ink3 transition hover:text-ink">
                <ArrowLeft size={13} /> {t('changeEmail')}
              </button>
              <button type="button" onClick={resend} disabled={loading} className="inline-flex items-center gap-1 text-accent disabled:opacity-60">
                <RotateCw size={13} /> {t('resend')}
              </button>
            </div>
          </>
        ) : (
          <>
            <h1 className="mt-3 font-display text-[2rem] font-semibold tracking-tight">{t('title')}</h1>
            <p className="mt-2 text-[14px] text-ink2">{t('subtitle')}</p>

            {oauthError && (
              <p className="mt-5 rounded-xl border border-[color:var(--warn)] bg-[color-mix(in_srgb,var(--warn)_10%,transparent)] px-4 py-3 text-center text-[13px] text-[color:var(--warn)]">
                {oauthError}
              </p>
            )}

            {/* Wallet + Google sign-in */}
            <div className="mt-7 space-y-2.5">
              {googleEnabled && (
                <button onClick={() => signIn('google', { callbackUrl })} data-cursor className={altBtn}>
                  <GoogleIcon /> {t('continueGoogle')}
                </button>
              )}
              {isConnected ? (
                <button onClick={walletSignIn} disabled={loading} data-cursor className={altBtn}>
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <Wallet size={16} />} {t('walletContinue')}
                </button>
              ) : (
                <ConnectWallet className="w-full" />
              )}
            </div>

            <div className="my-6 flex items-center gap-3 text-[12px] text-ink3">
              <span className="h-px flex-1 bg-line" /> {t('or')} <span className="h-px flex-1 bg-line" />
            </div>

            <div className="mb-5 flex gap-2 rounded-full border border-line bg-surface2 p-1">
              <button
                onClick={() => { setTab('password'); setError(''); setInfo(''); }}
                className={`flex flex-1 items-center justify-center gap-2 rounded-full py-2 text-[13px] transition ${tab === 'password' ? 'bg-brand text-white' : 'text-ink2'}`}
              >
                <KeyRound size={15} /> {t('usePassword')}
              </button>
              <button
                onClick={() => { setTab('code'); setError(''); setInfo(''); }}
                className={`flex flex-1 items-center justify-center gap-2 rounded-full py-2 text-[13px] transition ${tab === 'code' ? 'bg-brand text-white' : 'text-ink2'}`}
              >
                <Mail size={15} /> {t('useCode')}
              </button>
            </div>

            {tab === 'password' ? (
              <form onSubmit={handlePassword} className="space-y-3">
                {isSignup && <input className={inputCls} placeholder={t('namePh')} value={name} onChange={(e) => setName(e.target.value)} />}
                <input className={inputCls} type="email" required placeholder={t('emailPh')} value={email} onChange={(e) => setEmail(e.target.value)} />
                <input className={inputCls} type="password" required placeholder={t('passwordPh')} value={password} onChange={(e) => setPassword(e.target.value)} />
                <button data-cursor disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 font-semibold text-white shadow-glow transition hover:-translate-y-[1px] disabled:opacity-60">
                  {loading && <Loader2 size={16} className="animate-spin" />} {isSignup ? t('createBtn') : t('signInBtn')}
                </button>
                <button type="button" onClick={() => { setIsSignup((s) => !s); setError(''); setInfo(''); }} className="w-full pt-1 text-center text-[13px] text-accent">
                  {isSignup ? t('toggleToSignin') : t('toggleToSignup')}
                </button>
              </form>
            ) : (
              <form onSubmit={sendCode} className="space-y-3">
                <input className={inputCls} type="email" required placeholder={t('emailPh')} value={email} onChange={(e) => setEmail(e.target.value)} />
                <button data-cursor disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 font-semibold text-white shadow-glow transition hover:-translate-y-[1px] disabled:opacity-60">
                  {loading && <Loader2 size={16} className="animate-spin" />} {t('sendCode')}
                </button>
              </form>
            )}
          </>
        )}

        {info && <p className="mt-4 text-center text-[13px] text-ink2">{info}</p>}
        {error && <p className="mt-2 text-center text-[13px] text-[color:var(--warn)]">{error}</p>}
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.5 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.5 29.5 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.3C29.2 35 26.7 36 24 36c-5.3 0-9.7-3.1-11.3-7.6l-6.5 5C9.6 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4 5.5l6.3 5.3C41.4 35.9 44 30.5 44 24c0-1.3-.1-2.3-.4-3.5z" />
    </svg>
  );
}

export default function SignInPage() {
  return (
    <Suspense>
      <SignInForm />
    </Suspense>
  );
}
