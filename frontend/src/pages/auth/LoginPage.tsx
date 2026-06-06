import React, { useState } from 'react';
import { useAuth } from '../../store/AuthContext';
import { LogIn } from 'lucide-react';

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
    } catch (err: any) {
      setError(err.message || 'Giriş yapılırken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={handleSubmit}>
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <div style={{ width: 48, height: 48, background: 'var(--primary)', borderRadius: 12, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <LogIn size={24} color="white" />
          </div>
        </div>
        <h1 style={{ textAlign: 'center' }}>Minibar Yönetimi</h1>
        <p style={{ textAlign: 'center' }}>Otel Minibar Yönetim Sistemine hoş geldiniz</p>

        {error && <div style={{ background: '#ffebee', color: 'var(--danger)', padding: '10px 14px', borderRadius: 'var(--radius)', marginBottom: 16, fontSize: '0.875rem' }}>{error}</div>}

        <div className="form-group">
          <label className="form-label">Kullanıcı Adı</label>
          <input className="form-input" type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Kullanıcı adınızı girin" required />
        </div>
        <div className="form-group">
          <label className="form-label">Şifre</label>
          <input className="form-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Şifrenizi girin" required />
        </div>
        <button className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
          {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
        </button>
      </form>
    </div>
  );
};

export default LoginPage;
