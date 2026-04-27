'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';
import { Mail, Lock, Eye, EyeOff, Zap, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoggingIn } = useAuth();
  const [email, setEmail] = useState('admin@crm-cbt.com');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage('Please enter both email and password');
      return;
    }

    try {
      await login(email, password);
      toast.success('Welcome back! 🎉');
    } catch (err: unknown) {
      const errorText = (err as any)?.message || 'Login failed';
      setErrorMessage(errorText);
      toast.error(errorText);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      overflow: 'hidden',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #2d1b4e 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      position: 'relative',
    }}>
      {/* Animated Gradients Background */}
      <div style={{
        position: 'absolute',
        top: '-50%',
        right: '-10%',
        width: '600px',
        height: '600px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(6, 182, 212, 0.15), transparent)',
        filter: 'blur(80px)',
        animation: 'pulse 8s ease-in-out infinite',
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-30%',
        left: '-15%',
        width: '500px',
        height: '500px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(168, 85, 247, 0.15), transparent)',
        filter: 'blur(80px)',
        animation: 'pulse 10s ease-in-out infinite',
      }} />

      {/* Main Card */}
      <div style={{
        position: 'relative',
        zIndex: 10,
        width: '100%',
        maxWidth: '420px',
      }}>
        {/* Glow Effect */}
        <div style={{
          position: 'absolute',
          inset: '-1px',
          background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.3), rgba(168, 85, 247, 0.3))',
          borderRadius: '24px',
          opacity: 0.5,
          filter: 'blur(20px)',
          zIndex: -1,
        }} />

        {/* Card */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.8), rgba(30, 27, 75, 0.8))',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(6, 182, 212, 0.2)',
          borderRadius: '24px',
          padding: '48px 32px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)',
        }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              boxShadow: '0 10px 30px rgba(6, 182, 212, 0.3)',
            }}>
              <Zap size={32} color="white" />
            </div>
            <h1 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: '#ffffff',
              margin: '0 0 8px 0',
              letterSpacing: '-0.5px',
            }}>
              RE AI CRM
            </h1>
            <p style={{
              fontSize: '14px',
              color: 'rgba(6, 182, 212, 0.8)',
              margin: 0,
              fontWeight: '500',
            }}>
              AI-Powered Real Estate Intelligence
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Email Field */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: '600',
                color: 'rgba(226, 232, 240, 0.7)',
                marginBottom: '8px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'rgba(6, 182, 212, 0.5)',
                }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setErrorMessage(null);
                  }}
                  placeholder="admin@crm-cbt.com"
                  disabled={isLoggingIn}
                  style={{
                    width: '100%',
                    background: 'rgba(30, 41, 59, 0.8)',
                    border: '1px solid rgba(6, 182, 212, 0.2)',
                    borderRadius: '12px',
                    paddingLeft: '44px',
                    paddingRight: '14px',
                    paddingTop: '12px',
                    paddingBottom: '12px',
                    color: '#ffffff',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'all 0.3s',
                    backdropFilter: 'blur(10px)',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.5)';
                    e.currentTarget.style.boxShadow = '0 0 20px rgba(6, 182, 212, 0.2)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.2)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: '600',
                color: 'rgba(226, 232, 240, 0.7)',
                marginBottom: '8px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'rgba(6, 182, 212, 0.5)',
                }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrorMessage(null);
                  }}
                  placeholder="••••••••"
                  disabled={isLoggingIn}
                  style={{
                    width: '100%',
                    background: 'rgba(30, 41, 59, 0.8)',
                    border: '1px solid rgba(6, 182, 212, 0.2)',
                    borderRadius: '12px',
                    paddingLeft: '44px',
                    paddingRight: '44px',
                    paddingTop: '12px',
                    paddingBottom: '12px',
                    color: '#ffffff',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'all 0.3s',
                    backdropFilter: 'blur(10px)',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.5)';
                    e.currentTarget.style.boxShadow = '0 0 20px rgba(6, 182, 212, 0.2)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.2)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoggingIn}
                  style={{
                    position: 'absolute',
                    right: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'rgba(6, 182, 212, 0.5)',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '12px',
                padding: '12px 14px',
                fontSize: '13px',
                color: '#fca5a5',
              }}>
                {errorMessage}
              </div>
            )}

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={isLoggingIn}
              style={{
                marginTop: '8px',
                background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '12px',
                padding: '14px 20px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: isLoggingIn ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.3s',
                boxShadow: '0 10px 30px rgba(6, 182, 212, 0.3)',
                opacity: isLoggingIn ? 0.7 : 1,
              }}
              onMouseEnter={(e) => !isLoggingIn && (e.currentTarget.style.boxShadow = '0 15px 40px rgba(6, 182, 212, 0.5)')}
              onMouseLeave={(e) => (e.currentTarget.style.boxShadow = '0 10px 30px rgba(6, 182, 212, 0.3)')}
            >
              {isLoggingIn ? (
                <>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: '#ffffff',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                  }} />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Demo Credentials */}
          <div style={{
            marginTop: '28px',
            padding: '16px',
            background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.1), rgba(168, 85, 247, 0.1))',
            border: '1px solid rgba(6, 182, 212, 0.15)',
            borderRadius: '12px',
          }}>
            <p style={{
              fontSize: '11px',
              fontWeight: '600',
              color: 'rgba(6, 182, 212, 0.7)',
              margin: '0 0 10px 0',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}>
              Demo Credentials
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', color: 'rgba(226, 232, 240, 0.6)' }}>Email:</span>
                <code style={{
                  fontSize: '12px',
                  color: '#06b6d4',
                  background: 'rgba(0, 0, 0, 0.3)',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontFamily: 'monospace',
                }}>
                  admin@crm-cbt.com
                </code>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', color: 'rgba(226, 232, 240, 0.6)' }}>Password:</span>
                <code style={{
                  fontSize: '12px',
                  color: '#06b6d4',
                  background: 'rgba(0, 0, 0, 0.3)',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontFamily: 'monospace',
                }}>
                  Admin@123!
                </code>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          marginTop: '24px',
          textAlign: 'center',
          fontSize: '12px',
          color: 'rgba(226, 232, 240, 0.5)',
        }}>
          <p style={{ margin: 0 }}>Powered by <span style={{ color: '#06b6d4', fontWeight: '600' }}>AI Real Estate Intelligence</span></p>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.15; }
          50% { opacity: 0.25; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
