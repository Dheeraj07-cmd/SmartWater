import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Loader2, CheckCircle, Search, Building2, Play, AlertCircle } from 'lucide-react';
import WaterLoader from '../../components/WaterLoader';
import api from '../../api/axios';

export default function AdminLeakDetection() {
  const [apartments, setApartments] = useState([]);
  const [selectedApartmentId, setSelectedApartmentId] = useState('');
  const [alerts, setAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch apartments on mount
  useEffect(() => {
    const fetchApartments = async () => {
      try {
        const res = await api.get('/admin/apartments');
        const list = res.data.data || [];
        setApartments(list);
        if (list.length > 0) {
          setSelectedApartmentId(list[0].id);
        } else {
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Failed to fetch apartments:", err);
        setIsLoading(false);
      }
    };
    fetchApartments();
  }, []);

  // Fetch active alerts whenever selected apartment changes
  const fetchAlerts = async (aptId = selectedApartmentId) => {
    if (!aptId) return;
    try {
      setIsLoading(true);
      const response = await api.get(`/admin/apartments/${aptId}/active-alerts`);
      setAlerts(response.data.data || []);
    } catch (err) {
      console.error("Failed to fetch alerts:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedApartmentId) {
      fetchAlerts(selectedApartmentId);
    }
  }, [selectedApartmentId]);

  // Manually trigger the Anomaly & Leak Detection Engine from UI
  const handleTriggerScan = async () => {
    setIsScanning(true);
    setStatus({ type: '', message: '' });
    try {
      await api.post('/admin/billing/trigger-alerts');
      setStatus({ type: 'success', message: 'Anomaly & leak detection scan completed!' });
      await fetchAlerts(selectedApartmentId);
    } catch (err) {
      setStatus({ type: 'error', message: err.response?.data?.message || 'Failed to trigger leak scan.' });
    } finally {
      setIsScanning(false);
    }
  };

  const filteredAlerts = alerts.filter((a) =>
    (a.flatNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (a.residentName || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading)
    return <WaterLoader message="Loading apartment analytics..." />;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header + Apartment Name Selector + Scan Trigger */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white flex items-center gap-3">
            <AlertTriangle className="text-red-500" size={36} /> Leak Center
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-lg">Monitor anomalous usage spikes and potential leaks across the complex.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {apartments.length > 0 && (
            <div className="flex items-center gap-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl px-4 py-2.5 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
              <Building2 className="text-blue-600 dark:text-blue-400 shrink-0" size={20} />
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Target Complex</span>
                <select
                  value={selectedApartmentId}
                  onChange={(e) => setSelectedApartmentId(Number(e.target.value))}
                  className="bg-transparent font-bold text-gray-900 dark:text-white outline-none cursor-pointer pr-2 text-sm"
                >
                  {apartments.map((apt) => (
                    <option key={apt.id} value={apt.id} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                      {apt.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={handleTriggerScan}
            disabled={isScanning}
            className="px-5 py-3.5 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-2xl shadow-lg shadow-red-500/30 flex items-center gap-2 disabled:opacity-50 transition-all"
          >
            {isScanning ? <Loader2 className="animate-spin" size={18} /> : <Play size={18} fill="currentColor" />}
            Run Leak Scan Now
          </button>
        </div>
      </div>

      <AnimatePresence>
        {status.message && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className={`p-4 rounded-xl flex items-center gap-3 font-semibold shadow-sm ${status.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {status.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            {status.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search Bar */}
      <div className="flex justify-end">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by Flat or Resident Name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white/60 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-2xl outline-none focus:ring-2 focus:ring-red-500 text-gray-900 dark:text-white shadow-sm"
          />
        </div>
      </div>

      {/* Active Alerts Table */}
      <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-3xl shadow-xl overflow-hidden border border-white/20 dark:border-gray-700">
        {isLoading ? (
          <div className="p-12 text-center"><Loader2 className="animate-spin text-red-500 mx-auto" size={40} /></div>
        ) : filteredAlerts.length === 0 ? (
          <div className="p-16 text-center text-gray-500">
            <CheckCircle className="mx-auto mb-4 text-green-500" size={64} />
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">System Clear</h3>
            <p className="text-sm mt-1">No active leaks or anomalous spikes detected for this complex.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
              <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-6 py-4">Flat</th>
                  <th className="px-6 py-4">Resident</th>
                  <th className="px-6 py-4">Alert Type</th>
                  <th className="px-6 py-4">System Details</th>
                  <th className="px-6 py-4">Date Triggered</th>
                  <th className="px-6 py-4 text-center">Seen?</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                <AnimatePresence>
                  {filteredAlerts.map((alert) => (
                    <motion.tr key={alert.alertId} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">Flat {alert.flatNumber}</td>
                      <td className="px-6 py-4 font-medium">{alert.residentName}</td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400">
                          {alert.alertType?.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 max-w-xs truncate" title={alert.message}>{alert.message}</td>
                      <td className="px-6 py-4 font-medium">
                        {alert.createdAt ? new Date(alert.createdAt).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {alert.isReadByResident ? (
                          <span className="text-green-600 dark:text-green-400 font-bold">YES</span>
                        ) : (
                          <span className="text-yellow-600 dark:text-yellow-400 font-bold">NO</span>
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}