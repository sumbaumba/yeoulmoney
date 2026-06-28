import { useState } from 'react';
import { LockKeyhole, LogIn } from 'lucide-react';
import { supabase } from '../lib/supabase';

export function AuthScreen() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!supabase) return;

    setSubmitting(true);
    setError('');

    const sharedAccountEmail = import.meta.env.VITE_SHARED_ACCOUNT_EMAIL?.trim();
    if (!sharedAccountEmail) {
      setError('공용 계정 환경변수가 설정되지 않았습니다.');
      setSubmitting(false);
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: sharedAccountEmail,
      password,
    });

    if (signInError) {
      setError('이메일 또는 비밀번호를 확인해 주세요.');
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <div className="auth-icon"><LockKeyhole size={24} /></div>
        <h1>여울 공유 가계부</h1>
        <p>팀에서 사용하는 사이트 암호를 입력해 주세요.</p>
        <div className="form-group">
          <label htmlFor="login-password">사이트 암호</label>
          <input
            id="login-password"
            className="form-control"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </div>

        {error && <div className="auth-error">{error}</div>}

        <button className="btn btn-primary" type="submit" disabled={submitting}>
          <LogIn size={16} /> {submitting ? '확인 중...' : '장부 열기'}
        </button>
      </form>
    </div>
  );
}

export function SupabaseSetupScreen() {
  return (
    <div className="auth-page">
      <div className="auth-card setup-card">
        <div className="auth-icon"><LockKeyhole size={24} /></div>
        <h1>Supabase 연결 필요</h1>
        <p>Vercel 환경변수에 아래 세 값을 등록한 뒤 다시 배포해 주세요.</p>
        <code>VITE_SUPABASE_URL</code>
        <code>VITE_SUPABASE_PUBLISHABLE_KEY</code>
        <code>VITE_SHARED_ACCOUNT_EMAIL</code>
      </div>
    </div>
  );
}
