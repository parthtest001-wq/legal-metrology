/**
 * NotificationPreferencesPanel.jsx
 * Owned by: Module 5
 *
 * A reusable panel (not a routed page) so it can be dropped into any role's
 * settings/profile page without Module 5 needing to own a route or a
 * pages/*.jsx file outside its boundary. Module 1 (which owns
 * routes/AppRoutes.jsx and the pages/* tree) can mount this at whatever
 * path fits, e.g. pages/consumer/Settings.jsx, unmodified:
 *
 *   import NotificationPreferencesPanel from
 *     '../../components/common/NotificationPreferencesPanel';
 */

import React, { useEffect, useState } from 'react';
import alertService from '../../services/alertService';

const TOGGLES = [
  { key: 'inAppEnabled', label: 'In-app notifications', hint: 'Shown in the notification bell' },
  { key: 'emailEnabled', label: 'Email notifications', hint: 'Sent to your registered email' },
  { key: 'smsEnabled', label: 'SMS notifications', hint: 'Sent to your registered phone (demo/mock)' },
];

export default function NotificationPreferencesPanel() {
  const [prefs, setPrefs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [savedAt, setSavedAt] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        setLoading(true);
        const res = await alertService.getPreferences();
        if (isMounted) setPrefs(res.data?.preferences);
      } catch (err) {
        if (isMounted) setError('Could not load preferences');
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  async function handleToggle(key) {
    if (!prefs) return;
    const updated = { ...prefs, [key]: !prefs[key] };
    setPrefs(updated);
    try {
      setSaving(true);
      const res = await alertService.updatePreferences({ [key]: updated[key] });
      setPrefs(res.data?.preferences);
      setSavedAt(new Date());
      setError(null);
    } catch (err) {
      setError('Could not save — please retry');
      setPrefs((prev) => ({ ...prev, [key]: !updated[key] })); // revert
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-sm text-gray-400">Loading preferences…</p>;
  if (error && !prefs) return <p className="text-sm text-red-600">{error}</p>;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 max-w-md">
      <h3 className="font-semibold text-gray-800 mb-1">Notification Preferences</h3>
      <p className="text-sm text-gray-500 mb-4">Choose how you'd like to be alerted about renewals and updates.</p>

      <div className="space-y-4">
        {TOGGLES.map(({ key, label, hint }) => (
          <div key={key} className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-800">{label}</p>
              <p className="text-xs text-gray-500">{hint}</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={Boolean(prefs?.[key])}
              onClick={() => handleToggle(key)}
              disabled={saving}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                prefs?.[key] ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`bg-white w-4 h-4 rounded-full shadow transform transition-transform ${
                  prefs?.[key] ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        ))}
      </div>

      {error && <p className="text-xs text-red-600 mt-4">{error}</p>}
      {savedAt && !error && (
        <p className="text-xs text-gray-400 mt-4">Saved at {savedAt.toLocaleTimeString()}</p>
      )}
    </div>
  );
}
