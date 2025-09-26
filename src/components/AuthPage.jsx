import React, { useState } from 'react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import ResetPasswordForm from './ResetPasswordForm';

export default function AuthPage() {
  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'reset'

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f3f4f6',
      margin: 0,
      padding: 0
    }}>
      <div style={{
        background: 'white',
        padding: 40,
        borderRadius: 12,
        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
        width: '100%',
        maxWidth: 500,
        minWidth: 400
      }}>
        {mode === 'login' && (
          <LoginForm
            onSwitchToRegister={() => setMode('register')}
            onSwitchToReset={() => setMode('reset')}
          />
        )}
        {mode === 'register' && (
          <RegisterForm onSwitchToLogin={() => setMode('login')} />
        )}
        {mode === 'reset' && (
          <ResetPasswordForm onSwitchToLogin={() => setMode('login')} />
        )}
      </div>
    </div>
  );
}