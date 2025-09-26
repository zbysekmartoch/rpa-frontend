import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function RegisterForm({ onSwitchToLogin }) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const { t } = useLanguage();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.password !== formData.confirmPassword) {
      setError('Hesla se neshodují'); // TODO: přidat do translations
      return;
    }

    setLoading(true);
    try {
      await register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password
      });
      setSuccess('Registrace byla úspěšná! Můžete se přihlásit.'); // TODO: přidat do translations
      setTimeout(() => onSwitchToLogin(), 2000);
    } catch (err) {
      let errorMessage = 'Registrace selhala'; // TODO: přidat do translations
      
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
      <h2 style={{ margin: '0 0 16px 0', textAlign: 'center' }}>{t('register')}</h2>

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
        <label style={{ display: 'block', marginBottom: 4, color: '#374151' }}>{t('firstName')}</label>
        <input
          type="text"
          name="firstName"
          value={formData.firstName}
          onChange={handleChange}
          required
          style={{ width: '100%', padding: 12, border: '1px solid #d1d5db', borderRadius: 4, fontSize: 16, boxSizing: 'border-box' }}
        />
      </div>

      <div>
        <label style={{ display: 'block', marginBottom: 4, color: '#374151' }}>{t('lastName')}</label>
        <input
          type="text"
          name="lastName"
          value={formData.lastName}
          onChange={handleChange}
          required
          style={{ width: '100%', padding: 12, border: '1px solid #d1d5db', borderRadius: 4, fontSize: 16, boxSizing: 'border-box' }}
        />
      </div>

      <div>
        <label style={{ display: 'block', marginBottom: 4, color: '#374151' }}>{t('email')}</label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
          style={{ width: '100%', padding: 12, border: '1px solid #d1d5db', borderRadius: 4, fontSize: 16, boxSizing: 'border-box' }}
        />
      </div>

      <div>
        <label style={{ display: 'block', marginBottom: 4, color: '#374151' }}>{t('password')}</label>
        <input
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          required
          style={{ width: '100%', padding: 12, border: '1px solid #d1d5db', borderRadius: 4, fontSize: 16, boxSizing: 'border-box' }}
        />
      </div>

      <div>
        <label style={{ display: 'block', marginBottom: 4, color: '#374151' }}>{t('confirmPassword')}</label>
        <input
          type="password"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
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
          background: loading ? '#9ca3af' : '#22c55e',
          color: 'white',
          border: 'none',
          borderRadius: 4,
          cursor: loading ? 'not-allowed' : 'pointer',
          fontSize: 16
        }}
      >
        {loading ? t('loading') : t('registerButton')}
      </button>

      <div style={{ textAlign: 'center', fontSize: 14 }}>
        <button type="button" onClick={onSwitchToLogin} style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', textDecoration: 'underline' }}>
          {t('haveAccount')}
        </button>
      </div>
    </form>
  );
}