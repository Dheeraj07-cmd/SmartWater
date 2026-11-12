import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Settings, Droplets, CheckCircle, AlertCircle, Play, TrendingUp, Building2 } from 'lucide-react';
import WaterLoader from '../../components/WaterLoader';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../../api/axios';

export default function AdminBilling() {
  const [activeTab, setActiveTab] = useState('tariffs');
  const [apartments, setApartments] = useState([]);
  const [selectedApartmentId, setSelectedApartmentId] = useState('');
  const [cycles, setCycles] = useState([]);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [forecast, setForecast] = useState(null);
  const [forecastDiff, setForecastDiff] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const { register: regSimulate, handleSubmit: submitSimulate } = useForm();
  const { register: regTariff, handleSubmit: submitTariff, reset: resetTariff } = useForm();
  const { register: regCycle, handleSubmit: submitCycle, reset: resetCycle } = useForm();
  const { register: regPurchase, handleSubmit: submitPurchase, reset: resetPurchase } = useForm();
  const { register: regInvoice, handleSubmit: submitInvoice } = useForm();

  // Fetch apartments on mount
  useEffect(() => {
    const fetchApartments = async () => {
      try {
        setIsPageLoading(true);
        const res = await api.get('/admin/apartments');
        const list = res.data.data || [];
        setApartments(list);
        if (list.length > 0) {
          setSelectedApartmentId(list[0].id);
        } else {
          setIsPageLoading(false);
        }
      } catch (err) {
        console.error("Failed to load apartments", err);
        setIsPageLoading(false);
      }
    };
    fetchApartments();
  }, []);

  // Fetch billing cycles whenever selected apartment changes
  const fetchCycles = async (aptId = selectedApartmentId) => {
    if (!aptId) return;
    try {
      const res = await api.get(`/admin/billing/apartments/${aptId}/cycles`);
      setCycles(res.data.data || []);
    } catch (err) {
      console.error("Failed to load cycles", err);
    } finally {
      setIsPageLoading(false);
    }
  };

  useEffect(() => {
    if (selectedApartmentId) {
      fetchCycles(selectedApartmentId);
    }
  }, [selectedApartmentId]);

  const handleApiCall = async (endpoint, data, successMsg, resetForm, refreshCycles = false) => {
    try {
      setIsLoading(true);
      setStatus({ type: '', message: '' });
      const payload = { ...data, apartmentId: Number(selectedApartmentId) };
      await api.post(endpoint, payload);
      setStatus({ type: 'success', message: successMsg });
      if (resetForm) resetForm();
      if (refreshCycles) fetchCycles(selectedApartmentId);
    } catch (err) {
      setStatus({ type: 'error', message: err.response?.data?.message || 'Operation failed.' });
    } finally {
      setIsLoading(false);
    }
  };

  const onGenerateInvoices = async (data) => {
    if (!data.cycleId) {
      setStatus({ type: 'error', message: 'Please select a Billing Cycle first.' });
      return;
    }
    try {
      setIsLoading(true);
      setStatus({ type: '', message: '' });
      await api.post(`/admin/billing/cycles/${data.cycleId}/generate-invoices`);
      setStatus({ type: 'success', message: 'Invoices generated and PDFs created successfully!' });
      fetchCycles(selectedApartmentId);
    } catch (err) {
      setStatus({ type: 'error', message: err.response?.data?.message || 'Failed to generate invoices.' });
    } finally {
      setIsLoading(false);
    }
  };

  const onSimulateTariff = async (data) => {
    if (!selectedApartmentId) return;
    setIsSimulating(true);
    setStatus({ type: '', message: '' });
    try {
      const payload = {
        apartmentId: Number(selectedApartmentId),
        planName: 'Forecast Simulation Plan',
        baseRatePerKl: Number(data.baseRatePerKl),
        tier1ThresholdKl: Number(data.tier1ThresholdKl),
        tier2RatePerKl: Number(data.tier2RatePerKl),
        tier2ThresholdKl: data.tier2ThresholdKl ? Number(data.tier2ThresholdKl) : 25,
        tier3RatePerKl: data.tier3RatePerKl ? Number(data.tier3RatePerKl) : Number(data.tier2RatePerKl),
        effectiveFrom: new Date().toISOString().split('T')[0]
      };
      const res = await api.post(`/admin/apartments/${selectedApartmentId}/analytics/forecast`, payload);

      setForecast([
        { name: 'Current Tariff', revenue: Number(res.data.data.currentRevenue) || 0 },
        { name: 'Projected Tariff', revenue: Number(res.data.data.projectedRevenue) || 0 }
      ]);
      setForecastDiff(Number(res.data.data.revenueDifference) || 0);
    } catch (err) {
      setStatus({ type: 'error', message: err.response?.data?.message || 'Simulation failed. Check your inputs.' });
    } finally {
      setIsSimulating(false);
    }
  };

  const formVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300 } }
  };

  const selectedApartmentName = apartments.find((a) => a.id === Number(selectedApartmentId))?.name || 'Select Complex';

  if (isPageLoading) {
    return <WaterLoader message="Loading Billing & Tariffs..." />;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header + Apartment Name Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white">Billing & Tariffs</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-lg">Configure pricing tiers and manage monthly billing cycles.</p>
        </div>

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
      </div>

      <AnimatePresence>
        {status.message && (
          <motion.div initial={{ opacity: 0, y: -20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -20 }}
            className={`p-4 rounded-2xl flex items-center gap-3 shadow-lg ${status.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
            {status.type === 'success' ? <CheckCircle size={24} /> : <AlertCircle size={24} />}
            <span className="font-semibold">{status.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Animated Sliding Tabs */}
      <div className="flex space-x-6 border-b border-gray-200 dark:border-gray-800 relative overflow-x-auto">
        {[
          { id: 'tariffs', label: 'Tariff Plans', icon: Settings },
          { id: 'cycles', label: 'Billing Cycles', icon: FileText },
          { id: 'purchases', label: 'Bulk Purchases', icon: Droplets },
          { id: 'forecaster', label: 'Forecaster', icon: TrendingUp }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} onClick={() => { setActiveTab(tab.id); setStatus({ type: '', message: '' }); }}
              className={`flex items-center gap-2 pb-4 text-lg font-semibold transition-colors relative z-10 whitespace-nowrap ${activeTab === tab.id ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
            >
              <Icon size={20} /> {tab.label}
              {activeTab === tab.id && (
                <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 dark:bg-blue-400 rounded-t-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* Form Area with Loading Overlay */}
      <div className="relative bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 dark:border-gray-700 overflow-hidden p-8 sm:p-10">
        <AnimatePresence>
          {(isLoading || isSimulating) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-white/70 dark:bg-gray-900/70 backdrop-blur-sm z-50 flex flex-col items-center justify-center"
            >
              <WaterLoader message={isSimulating ? "Running Revenue Simulation..." : "Processing Request..."} size={140} compact />
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {/* TARIFFS TAB */}
          {activeTab === 'tariffs' && (
            <motion.form key="tariffs" variants={formVariants} initial="hidden" animate="show" exit={{ opacity: 0, x: 20 }}
              onSubmit={submitTariff((d) => handleApiCall('/admin/billing/tariffs', d, `Tariff plan saved for ${selectedApartmentName}!`, resetTariff))}
              className="space-y-6"
            >
              <motion.h3 variants={itemVariants} className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-500">
                Create New Tariff Plan — {selectedApartmentName}
              </motion.h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <motion.div variants={itemVariants}>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Plan Name</label>
                  <input placeholder="e.g. Standard 2026 Tariff" {...regTariff('planName', { required: true })} className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none shadow-sm" />
                </motion.div>
                {[
                  { name: 'baseRatePerKl', label: 'Base Rate Per kL (₹)', placeholder: '15.00' },
                  { name: 'tier1ThresholdKl', label: 'Tier 1 Threshold (kL)', placeholder: '10.00' },
                  { name: 'tier2RatePerKl', label: 'Tier 2 Rate Per kL (₹)', placeholder: '25.00' },
                  { name: 'tier2ThresholdKl', label: 'Tier 2 Threshold (kL)', placeholder: '20.00' },
                  { name: 'tier3RatePerKl', label: 'Tier 3 Rate Per kL (₹)', placeholder: '40.00' }
                ].map((field) => (
                  <motion.div key={field.name} variants={itemVariants}>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{field.label}</label>
                    <input type="number" step="0.01" placeholder={field.placeholder} {...regTariff(field.name, { required: true })} className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none shadow-sm" />
                  </motion.div>
                ))}
                <motion.div variants={itemVariants}>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Effective Date</label>
                  <input type="date" {...regTariff("effectiveFrom", { required: true })} className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none shadow-sm" />
                </motion.div>
              </div>
              <motion.button variants={itemVariants} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" className="mt-8 w-full md:w-auto px-10 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30">
                Save Tariff Plan
              </motion.button>
            </motion.form>
          )}

          {/* CYCLES TAB */}
          {activeTab === 'cycles' && (
            <motion.div key="cycles" variants={formVariants} initial="hidden" animate="show" exit={{ opacity: 0, x: 20 }} className="space-y-12">
              <form onSubmit={submitCycle((d) => handleApiCall('/admin/billing/cycles', d, 'Billing cycle opened!', resetCycle, true))} className="space-y-6">
                <motion.h3 variants={itemVariants} className="text-2xl font-bold text-gray-900 dark:text-white">
                  Open Billing Cycle — {selectedApartmentName}
                </motion.h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <motion.div variants={itemVariants}>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Cycle Name</label>
                    <input placeholder="e.g. November 2026" {...regCycle('cycleName', { required: true })} className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none shadow-sm" />
                  </motion.div>
                  <motion.div variants={itemVariants}>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Start Date</label>
                    <input type="date" {...regCycle("startDate", { required: true })} className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none shadow-sm" />
                  </motion.div>
                  <motion.div variants={itemVariants}>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">End Date</label>
                    <input type="date" {...regCycle("endDate", { required: true })} className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none shadow-sm" />
                  </motion.div>
                </div>
                <motion.button variants={itemVariants} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" className="w-full md:w-auto px-10 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-xl shadow-lg">
                  Open Cycle
                </motion.button>
              </form>

              <motion.div variants={itemVariants} className="pt-10 border-t border-gray-200 dark:border-gray-700">
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-8 rounded-3xl">
                  <h3 className="text-2xl font-bold text-red-700 dark:text-red-400 mb-2">Generate Final Invoices</h3>
                  <p className="text-red-600/80 dark:text-red-400/80 mb-6 font-medium">Select an open billing cycle by name to finalize bills and generate resident PDFs.</p>
                  <form onSubmit={submitInvoice(onGenerateInvoices)} className="flex flex-col sm:flex-row gap-4 items-end">
                    <div className="w-full sm:w-80">
                      <label className="block text-sm font-bold text-red-700 dark:text-red-400 mb-2">Select Billing Cycle</label>
                      <select {...regInvoice("cycleId", { required: true })} className="w-full p-3 rounded-xl border border-red-300 dark:border-red-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-none shadow-sm font-semibold">
                        <option value="">-- Choose Cycle Name --</option>
                        {cycles.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.cycleName} ({c.status})
                          </option>
                        ))}
                      </select>
                    </div>
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} type="submit" className="w-full sm:w-auto px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-500/40 flex items-center justify-center gap-3">
                      <Play size={20} fill="currentColor" /> Generate All
                    </motion.button>
                  </form>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* PURCHASES TAB */}
          {activeTab === 'purchases' && (
            <motion.form key="purchases" variants={formVariants} initial="hidden" animate="show" exit={{ opacity: 0, x: 20 }}
              onSubmit={submitPurchase((d) => handleApiCall('/admin/billing/purchases', d, 'Bulk water purchase logged!', resetPurchase))}
              className="space-y-6"
            >
              <motion.h3 variants={itemVariants} className="text-2xl font-bold text-teal-600 dark:text-teal-400">
                Log Shared Bulk Purchase — {selectedApartmentName}
              </motion.h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <motion.div variants={itemVariants}>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Billing Cycle</label>
                  <select {...regPurchase("billingCycleId", { required: true })} className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none shadow-sm font-semibold">
                    <option value="">-- Select Cycle Name --</option>
                    {cycles.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.cycleName} ({c.status})
                      </option>
                    ))}
                  </select>
                </motion.div>

                <motion.div variants={itemVariants}>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Vendor Name</label>
                  <input placeholder="e.g. Sharma Water Tankers" {...regPurchase("vendorName", { required: true })} className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none shadow-sm" />
                </motion.div>

                <motion.div variants={itemVariants}>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Volume (kL)</label>
                  <input type="number" step="0.01" placeholder="e.g. 50" {...regPurchase("volumeKl", { required: true })} className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none shadow-sm" />
                </motion.div>

                <motion.div variants={itemVariants}>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Total Cost (₹)</label>
                  <input type="number" step="0.01" placeholder="e.g. 1200" {...regPurchase("totalCost", { required: true })} className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none shadow-sm" />
                </motion.div>

                <motion.div variants={itemVariants}>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Purchase Date</label>
                  <input type="date" {...regPurchase("purchaseDate", { required: true })} className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none shadow-sm" />
                </motion.div>
              </div>
              <motion.button variants={itemVariants} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" className="mt-8 w-full md:w-auto px-10 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-teal-500/30">
                Log Purchase
              </motion.button>
            </motion.form>
          )}

          {/* REVENUE FORECASTER TAB */}
          {activeTab === 'forecaster' && (
            <motion.div key="forecaster" variants={formVariants} initial="hidden" animate="show" exit={{ opacity: 0, x: 20 }} className="space-y-6">
              <motion.h3 variants={itemVariants} className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-500">
                Revenue Forecaster — {selectedApartmentName}
              </motion.h3>

              <form onSubmit={submitSimulate(onSimulateTariff)} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <motion.div variants={itemVariants}>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Base Rate (₹ / kL)</label>
                  <input type="number" step="0.01" placeholder="15" {...regSimulate("baseRatePerKl", { required: true })} className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 shadow-sm" />
                </motion.div>
                <motion.div variants={itemVariants}>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Tier 1 Threshold (kL)</label>
                  <input type="number" step="0.01" placeholder="10" {...regSimulate("tier1ThresholdKl", { required: true })} className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 shadow-sm" />
                </motion.div>
                <motion.div variants={itemVariants}>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Tier 2 Rate (₹ / kL)</label>
                  <input type="number" step="0.01" placeholder="25" {...regSimulate("tier2RatePerKl", { required: true })} className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 shadow-sm" />
                </motion.div>
                <motion.button variants={itemVariants} type="submit" disabled={isSimulating} className="col-span-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold mt-5 transition-all shadow-lg shadow-blue-500/30">
                  {isSimulating ? 'Calculating...' : 'Run Simulation'}
                </motion.button>
              </form>

              {forecast && (
                <motion.div variants={itemVariants} className="space-y-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-gray-500">Projected Monthly Impact:</span>
                    <span className={`text-lg font-extrabold ${forecastDiff >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {forecastDiff >= 0 ? `+₹${forecastDiff.toFixed(2)}` : `-₹${Math.abs(forecastDiff).toFixed(2)}`}
                    </span>
                  </div>
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={forecast}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                        <XAxis dataKey="name" stroke="#6b7280" />
                        <YAxis stroke="#6b7280" />
                        <Tooltip cursor={{ fill: 'rgba(0,0,0,0.1)' }} contentStyle={{ backgroundColor: '#1F2937', color: '#F9FAFB', borderRadius: '8px' }} />
                        <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}