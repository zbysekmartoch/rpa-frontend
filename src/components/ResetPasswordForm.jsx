import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function ResetPasswordForm({ onSwitchToLogin }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { resetPassword } = useAuth();
  const { t } = useLanguage();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await resetPassword(email);
      setSuccess('Pokyny pro obnovení hesla byly odeslány na váš e-mail.'); // TODO: přidat do translations
    } catch (err) {
      let errorMessage = 'Odeslání selhalo'; // TODO: přidat do translations
      
      if (err.body) {
        try {
          const errorData = JSON.parse(err.body);
          if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch {
          // Pokud parsing selže, použijeme fallback
        }
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <h2 style={{ margin: '0 0 16px 0', textAlign: 'center' }}>{t('resetPassword')}</h2>

      {error && (
        <div style={{ padding: 12, background: '#fee2e2', color: '#991b1b', borderRadius: 6 }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{ padding: 12, background: '#dcfce7', color: '#166534', borderRadius: 6 }}>
          {success}
        </div>
      )}

      <div>
        <label style={{ display: 'block', marginBottom: 4, color: '#374151' }}>{t('email')}</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ width: '100%', padding: 12, border: '1px solid #d1d5db', borderRadius: 4, fontSize: 16, boxSizing: 'border-box' }}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        style={{
          width: '100%',
          padding: 12,
          background: loading ? '#9ca3af' : '#f59e0b',
          color: 'white',
          border: 'none',
          borderRadius: 4,
          cursor: loading ? 'not-allowed' : 'pointer',
          fontSize: 16
        }}
      >
        {loading ? t('loading') : 'Odeslat pokyny'} {/* TODO: přidat do translations */}
      </button>

      <div style={{ textAlign: 'center', fontSize: 14 }}>
        <button type="button" onClick={onSwitchToLogin} style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', textDecoration: 'underline' }}>
          Zpět na přihlášení {/* TODO: přidat do translations */}
        </button>
      </div>
    </form>
  );
}