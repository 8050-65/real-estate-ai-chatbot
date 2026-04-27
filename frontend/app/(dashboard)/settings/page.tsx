'use client';

import { useState } from 'react';
import { Save } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SettingsPage() {
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

  const handleSave = () => {
    toast.success('Settings saved successfully!');
  };

  return (
    <div className="max-w-4xl space-y-6">
      {/* Tabs */}
      <div className="flex gap-4 border-b border-border">
        {['bot', 'team', 'account'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-medium capitalize ${
              activeTab === tab
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Bot Config Tab */}
      {activeTab === 'bot' && (
        <div className="rounded-lg border border-border bg-card p-6 space-y-6">
          <h2 className="text-lg font-semibold text-foreground">Bot Configuration</h2>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Persona Name
            </label>
            <input
              type="text"
              value={botConfig.personaName}
              onChange={(e) =>
                setBotConfig({ ...botConfig, personaName: e.target.value })
              }
              className="w-full rounded-lg border border-input bg-background px-4 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Greeting Message
            </label>
            <textarea
              value={botConfig.greetingMessage}
              onChange={(e) =>
                setBotConfig({ ...botConfig, greetingMessage: e.target.value })
              }
              rows={3}
              className="w-full rounded-lg border border-input bg-background px-4 py-2"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Tone
              </label>
              <select
                value={botConfig.tone}
                onChange={(e) => setBotConfig({ ...botConfig, tone: e.target.value })}
                className="w-full rounded-lg border border-input bg-background px-4 py-2"
              >
                <option value="formal">Formal</option>
                <option value="friendly">Friendly</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Language
              </label>
              <select
                value={botConfig.language}
                onChange={(e) =>
                  setBotConfig({ ...botConfig, language: e.target.value })
                }
                className="w-full rounded-lg border border-input bg-background px-4 py-2"
              >
                <option value="en">English</option>
                <option value="hi">Hindi</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Active Hours Start
              </label>
              <input
                type="time"
                value={botConfig.activeHoursStart}
                onChange={(e) =>
                  setBotConfig({ ...botConfig, activeHoursStart: e.target.value })
                }
                className="w-full rounded-lg border border-input bg-background px-4 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Active Hours End
              </label>
              <input
                type="time"
                value={botConfig.activeHoursEnd}
                onChange={(e) =>
                  setBotConfig({ ...botConfig, activeHoursEnd: e.target.value })
                }
                className="w-full rounded-lg border border-input bg-background px-4 py-2"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              After Hours Message
            </label>
            <textarea
              value={botConfig.afterHoursMessage}
              onChange={(e) =>
                setBotConfig({ ...botConfig, afterHoursMessage: e.target.value })
              }
              rows={2}
              className="w-full rounded-lg border border-input bg-background px-4 py-2"
            />
          </div>

          <button
            onClick={handleSave}
            className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2 text-primary-foreground hover:opacity-90"
          >
            <Save className="h-5 w-5" />
            Save Changes
          </button>
        </div>
      )}

      {/* Team Tab */}
      {activeTab === 'team' && (
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground">Team Management</h2>
          <p className="mt-4 text-muted-foreground">
            Team management features coming soon
          </p>
        </div>
      )}

      {/* Account Tab */}
      {activeTab === 'account' && (
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground">Account Settings</h2>
          <p className="mt-4 text-muted-foreground">
            Account settings features coming soon
          </p>
        </div>
      )}
    </div>
  );
}
