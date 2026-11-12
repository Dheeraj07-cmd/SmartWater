import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Bell, AlertTriangle, Info, CheckCircle, Sliders, Mail, Smartphone, Wrench, AlertCircle } from 'lucide-react';
import WaterLoader from '../../components/WaterLoader';
import api from '../../api/axios';

export default function ResidentAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('ALL');

  // Notification preference toggles persisted in localStorage
  const [preferences, setPreferences] = useState(() => {
    const saved = localStorage.getItem('resident_alert_prefs');
    return saved
      ? JSON.parse(saved)
      : { emailLeaks: true, inAppBilling: true, dailyDigest: false };
  });

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        setIsLoading(true);
        setError('');
        const response = await api.get('/resident/alerts');
        setAlerts(response.data?.data || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch alerts.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchAlerts();
  }, []);

  const markAsRead = async (id) => {
    try {
      await api.patch(`/resident/alerts/${id}/read`);
      setAlerts(alerts.map((a) => (a.id === id ? { ...a, isRead: true } : a)));
    } catch (err) {
      console.error("Failed to mark alert as read:", err);
    }
  };

  const togglePreference = (key) => {
    const updated = { ...preferences, [key]: !preferences[key] };
    setPreferences(updated);
    localStorage.setItem('resident_alert_prefs', JSON.stringify(updated));
  };

  const filteredAlerts = alerts.filter((a) => {
    if (filter === 'UNREAD') return !a.isRead;
    if (filter === 'WARNINGS') return a.alertType === 'HIGH_USAGE' || a.alertType === 'POTENTIAL_LEAK';
    return true;
  });

  const isAnomaly = (type) => type === 'HIGH_USAGE' || type === 'POTENTIAL_LEAK';

  const getAlertIcon = (type) => {
    if (isAnomaly(type)) return <AlertTriangle className="text-red-500" size={24} />;
    return <Info className="text-blue-500" size={24} />;
  };

  if (isLoading)
    return <WaterLoader message="Loading your water data..." />;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">Notifications & Alerts</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-lg">Stay updated on leak detections, usage spikes, and billing notices.</p>
        </div>

        <div className="flex bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl p-1 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          {['ALL', 'UNREAD', 'WARNINGS'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${filter === f
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 text-red-700 dark:text-red-400 font-medium flex items-center gap-3 rounded-r-xl">
          <AlertCircle size={22} /> {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns: Alerts Feed */}
        <div className="lg:col-span-2 space-y-4">
          {isLoading ? (
            <div className="flex justify-center p-12"><Loader2 className="animate-spin text-blue-600" size={40} /></div>
          ) : filteredAlerts.length === 0 ? (
            <div className="p-12 text-center text-gray-500 bg-white/60 dark:bg-gray-800/60 rounded-3xl border border-gray-200 dark:border-gray-700">
              <Bell className="mx-auto mb-4 opacity-50" size={48} />
              <p className="text-lg font-medium">You have no alerts in this category.</p>
            </div>
          ) : (
            <AnimatePresence>
              {filteredAlerts.map((alert) => {
                const anomaly = isAnomaly(alert.alertType);
                return (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={`p-6 rounded-2xl border backdrop-blur-xl flex gap-4 transition-all shadow-sm ${alert.isRead
                      ? 'bg-white/40 dark:bg-gray-800/40 border-gray-200 dark:border-gray-700 opacity-75'
                      : anomaly
                        ? 'bg-red-50/80 dark:bg-red-950/30 border-red-200 dark:border-red-800/70 shadow-md'
                        : 'bg-white/90 dark:bg-gray-800/90 border-blue-200 dark:border-blue-900/50 shadow-md'
                      }`}
                  >
                    <div className={`p-3 rounded-xl h-fit ${alert.isRead
                      ? 'bg-gray-100 dark:bg-gray-700'
                      : anomaly
                        ? 'bg-red-100 dark:bg-red-900/40'
                        : 'bg-blue-50 dark:bg-blue-900/30'
                      }`}>
                      {getAlertIcon(alert.alertType)}
                    </div>

                    <div className="flex-1 space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-gray-900 dark:text-white uppercase tracking-wide text-sm">
                            {alert.alertType?.replace('_', ' ')}
                          </h4>
                          {!alert.isRead && (
                            <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-full bg-blue-600 text-white">NEW</span>
                          )}
                        </div>
                        <span className="text-xs font-semibold text-gray-500">
                          {alert.createdAt ? new Date(alert.createdAt).toLocaleDateString() : ''}
                        </span>
                      </div>

                      <p className="text-gray-700 dark:text-gray-200 text-sm font-medium leading-relaxed">{alert.message}</p>

                      {/* Leak Detection Focus: Recommended Actions */}
                      {anomaly && (
                        <div className="p-4 rounded-xl bg-white/80 dark:bg-gray-900/60 border border-red-200/70 dark:border-red-800/50 space-y-2">
                          <p className="text-xs font-extrabold uppercase tracking-wider text-red-600 dark:text-red-400 flex items-center gap-1.5">
                            <Wrench size={14} /> Recommended Actions
                          </p>
                          <ul className="text-xs text-gray-600 dark:text-gray-300 list-disc list-inside space-y-1">
                            <li>Check all indoor and balcony taps to ensure they are fully closed.</li>
                            <li>Inspect toilet cisterns for silent continuous running water.</li>
                            <li>If no visible leak is found, report a suspected meter fault to Support.</li>
                          </ul>
                          <div className="pt-1">
                            <Link to="/support" className="text-xs font-bold text-red-600 dark:text-red-400 hover:underline">
                              Report Leak to Maintenance →
                            </Link>
                          </div>
                        </div>
                      )}

                      {!alert.isRead && (
                        <button
                          onClick={() => markAsRead(alert.id)}
                          className="pt-1 text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1.5"
                        >
                          <CheckCircle size={16} /> Mark as read
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>

        {/* Right Column: Notification Preference Toggles */}
        <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl p-6 rounded-3xl shadow-lg border border-white/20 dark:border-gray-700 h-fit space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
              <Sliders size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Alert Preferences</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Customize how you get notified</p>
            </div>
          </div>

          <div className="space-y-4">
            {[
              {
                key: 'emailLeaks',
                label: 'Email Leak Warnings',
                desc: 'Instant email when usage exceeds 2σ or 1.5 kL/day',
                icon: Mail
              },
              {
                key: 'inAppBilling',
                label: 'In-App Billing Notices',
                desc: 'Notify when monthly PDF invoices are generated',
                icon: Bell
              },
              {
                key: 'dailyDigest',
                label: 'Weekly Conservation Digest',
                desc: 'Summary of your household vs. complex average',
                icon: Smartphone
              }
            ].map((item) => {
              const Icon = item.icon;
              const enabled = preferences[item.key];
              return (
                <div key={item.key} className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700">
                  <div className="flex items-start gap-3">
                    <Icon size={18} className="text-blue-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{item.label}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{item.desc}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => togglePreference(item.key)}
                    className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors shrink-0 ${enabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-700'
                      }`}
                  >
                    <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${enabled ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
}