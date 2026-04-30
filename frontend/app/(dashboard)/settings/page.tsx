'use client';

import { useState, useEffect } from 'react';
import { Save, Sliders, Users, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { useActivityLogger } from '@/hooks/useActivityLogger';
import { useLanguage } from '@/hooks/useLanguage';

export default function SettingsPage() {
  const { logAction } = useActivityLogger();
  const { language, updateLanguage } = useLanguage();
  const [activeTab, setActiveTab] = useState('bot');
  const [botConfig, setBotConfig] = useState({
    personaName: 'Aria',
    greetingMessage: 'Hi! I am Aria your real estate assistant. How can I help you today?',
    tone: 'friendly',
    activeHoursStart: '09:00',
    activeHoursEnd: '21:00',
    afterHoursMessage: 'Thanks for reaching out! Our team will respond 9AM-9PM.',
    language: 'en',
  });

  // Load settings from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('bot_config');
    if (saved) {
      try {
        const config = JSON.parse(saved);
        setBotConfig(config);
        // Sync language with global language hook
        if (config.language) {
          updateLanguage(config.language);
        }
      } catch (e) {
        console.error('Failed to load settings:', e);
      }
    }
  }, [updateLanguage]);

  const handleSave = async () => {
    try {
      // Save to localStorage first (always works)
      localStorage.setItem('bot_config', JSON.stringify(botConfig));
      logAction('Settings Updated', `Bot persona: ${botConfig.personaName}, Tone: ${botConfig.tone}, Language: ${botConfig.language}`);
      toast.success('Settings saved successfully! ✅');

      // Try to save to backend (optional - silently fails if not available)
      setTimeout(async () => {
        try {
          const { SettingsAPI } = await import('@/lib/api-client');
          await SettingsAPI.updateBotConfig(botConfig);
          console.log('[Settings] Backend sync completed');
        } catch {
          // Silently fail - localStorage backup is already saved
          console.log('[Settings] Using local storage (backend not available)');
        }
      }, 100);
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('Failed to save settings');
    }
  };

  const tabs = [
    { id: 'bot', label: 'Bot Configuration', icon: Sliders },
    { id: 'team', label: 'Team', icon: Users },
    { id: 'account', label: 'Account', icon: User },
  ];

  const inputStyle = {
    width: '100%',
    background: 'rgba(30, 41, 59, 0.8)',
    border: '1px solid rgba(6, 182, 212, 0.2)',
    borderRadius: '8px',
    padding: '10px 14px',
    color: '#ffffff',
    fontSize: '13px',
    outline: 'none',
    transition: 'all 0.2s',
    backdropFilter: 'blur(10px)',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '900px' }}>
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#ffffff', margin: '0 0 4px 0' }}>Settings</h2>
        <p style={{ fontSize: '13px', color: 'rgba(6, 182, 212, 0.7)', margin: 0 }}>Configure bot behavior and account preferences</p>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '16px',
        borderBottom: '1px solid rgba(6, 182, 212, 0.2)',
        paddingBottom: '12px',
      }}>
        {tabs.map((tab) => {
          const TabIcon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: '600',
                background: activeTab === tab.id ? 'rgba(6, 182, 212, 0.1)' : 'transparent',
                color: activeTab === tab.id ? '#06b6d4' : 'rgba(226, 232, 240, 0.6)',
                border: activeTab === tab.id ? '1px solid rgba(6, 182, 212, 0.3)' : 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                if (activeTab !== tab.id) {
                  e.currentTarget.style.color = '#06b6d4';
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== tab.id) {
                  e.currentTarget.style.color = 'rgba(226, 232, 240, 0.6)';
                }
              }}
            >
              <TabIcon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Bot Config Tab */}
      {activeTab === 'bot' && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.8), rgba(30, 27, 75, 0.8))',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(6, 182, 212, 0.2)',
          borderRadius: '16px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}>
          <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#ffffff', margin: 0 }}>Bot Configuration</h3>

          {/* Persona Name */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'rgba(226, 232, 240, 0.7)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Persona Name
            </label>
            <input
              type="text"
              value={botConfig.personaName}
              onChange={(e) =>
                setBotConfig({ ...botConfig, personaName: e.target.value })
              }
              style={inputStyle}
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

          {/* Greeting Message */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'rgba(226, 232, 240, 0.7)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Greeting Message
            </label>
            <textarea
              value={botConfig.greetingMessage}
              onChange={(e) =>
                setBotConfig({ ...botConfig, greetingMessage: e.target.value })
              }
              style={{ ...inputStyle, minHeight: '100px', fontFamily: 'inherit' }}
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

          {/* Tone and Language */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'rgba(226, 232, 240, 0.7)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Tone
              </label>
              <select
                value={botConfig.tone}
                onChange={(e) => setBotConfig({ ...botConfig, tone: e.target.value })}
                style={inputStyle}
              >
                <option value="formal">Formal</option>
                <option value="friendly">Friendly</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'rgba(226, 232, 240, 0.7)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Language
              </label>
              <select
                value={botConfig.language}
                onChange={(e) => {
                  const newLang = e.target.value;
                  setBotConfig({ ...botConfig, language: newLang });
                  updateLanguage(newLang);
                }}
                style={inputStyle}
              >
                <option value="en">🇬🇧 English</option>
                <option value="hi">🇮🇳 Hindi</option>
                <option value="kn">🇮🇳 Kannada</option>
                <option value="ta">🇮🇳 Tamil</option>
                <option value="te">🇮🇳 Telugu</option>
                <option value="bn">🇧🇩 Bengali</option>
                <option value="ur">🇵🇰 Urdu</option>
                <option value="fr">🇫🇷 French</option>
                <option value="es">🇪🇸 Spanish</option>
                <option value="pt">🇵🇹 Portuguese</option>
                <option value="de">🇩🇪 German</option>
                <option value="zh">🇨🇳 Chinese</option>
                <option value="ja">🇯🇵 Japanese</option>
                <option value="ar">🇸🇦 Arabic</option>
              </select>
            </div>
          </div>

          {/* Active Hours */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'rgba(226, 232, 240, 0.7)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Active Hours Start
              </label>
              <input
                type="time"
                value={botConfig.activeHoursStart}
                onChange={(e) =>
                  setBotConfig({ ...botConfig, activeHoursStart: e.target.value })
                }
                style={inputStyle}
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

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'rgba(226, 232, 240, 0.7)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Active Hours End
              </label>
              <input
                type="time"
                value={botConfig.activeHoursEnd}
                onChange={(e) =>
                  setBotConfig({ ...botConfig, activeHoursEnd: e.target.value })
                }
                style={inputStyle}
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

          {/* After Hours Message */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'rgba(226, 232, 240, 0.7)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              After Hours Message
            </label>
            <textarea
              value={botConfig.afterHoursMessage}
              onChange={(e) =>
                setBotConfig({ ...botConfig, afterHoursMessage: e.target.value })
              }
              style={{ ...inputStyle, minHeight: '80px', fontFamily: 'inherit' }}
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

          {/* Save Button */}
          <button
            onClick={handleSave}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '12px',
              padding: '12px 20px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s',
              boxShadow: '0 10px 30px rgba(6, 182, 212, 0.3)',
              alignSelf: 'flex-start',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 15px 40px rgba(6, 182, 212, 0.5)')}
            onMouseLeave={(e) => (e.currentTarget.style.boxShadow = '0 10px 30px rgba(6, 182, 212, 0.3)')}
          >
            <Save size={18} />
            Save Changes
          </button>
        </div>
      )}

      {/* Team Tab */}
      {activeTab === 'team' && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.8), rgba(30, 27, 75, 0.8))',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(6, 182, 212, 0.2)',
          borderRadius: '16px',
          padding: '24px',
        }}>
          <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#ffffff', margin: '0 0 16px 0' }}>Team Management</h3>
          <p style={{ fontSize: '13px', color: 'rgba(226, 232, 240, 0.6)', margin: 0 }}>
            Team management features coming soon
          </p>
        </div>
      )}

      {/* Account Tab */}
      {activeTab === 'account' && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.8), rgba(30, 27, 75, 0.8))',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(6, 182, 212, 0.2)',
          borderRadius: '16px',
          padding: '24px',
        }}>
          <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#ffffff', margin: '0 0 16px 0' }}>Account Settings</h3>
          <p style={{ fontSize: '13px', color: 'rgba(226, 232, 240, 0.6)', margin: 0 }}>
            Account settings features coming soon
          </p>
        </div>
      )}
    </div>
  );
}
