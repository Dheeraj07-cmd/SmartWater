import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { Upload, Keyboard, CheckCircle, AlertCircle, FileText, Database, Home, Building2, Calendar } from 'lucide-react';
import WaterLoader from '../../components/WaterLoader';
import api from '../../api/axios';

export default function AdminMeterReadings() {
  const [activeTab, setActiveTab] = useState('manual');
  const [apartments, setApartments] = useState([]);
  const [selectedApartmentId, setSelectedApartmentId] = useState('');
  const [households, setHouseholds] = useState([]);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const { register: regManual, handleSubmit: submitManual, reset: resetManual } = useForm();
  const { register: regFlat, handleSubmit: submitFlat, reset: resetFlat } = useForm();
  const { register: regSimHistory, handleSubmit: submitSimHistory, reset: resetSimHistory } = useForm();

  // Fetch Apartments on mount
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
        console.error("Failed to fetch apartments:", err);
        setIsPageLoading(false);
      }
    };
    fetchApartments();
  }, []);

  // Fetch Households whenever selected Apartment changes
  const fetchHouseholds = async (aptId = selectedApartmentId) => {
    if (!aptId) return;
    try {
      const res = await api.get(`/admin/apartments/${aptId}/households`);
      setHouseholds(res.data.data || []);
    } catch (err) {
      console.error("Failed to fetch households:", err);
    } finally {
      setIsPageLoading(false);
    }
  };

  useEffect(() => {
    if (selectedApartmentId) {
      fetchHouseholds(selectedApartmentId);
    }
  }, [selectedApartmentId]);

  const onManualSubmit = async (data) => {
    setIsLoading(true);
    setStatus({ type: '', message: '' });
    try {
      await api.post('/admin/usage/manual', {
        meterNumber: data.meterNumber,
        readingDate: data.readingDate,
        consumption: Number(data.consumption)
      });
      setStatus({ type: 'success', message: `Reading logged for meter ${data.meterNumber} successfully!` });
      resetManual();
    } catch (err) {
      setStatus({ type: 'error', message: err.response?.data?.message || 'Failed to log reading.' });
    } finally {
      setIsLoading(false);
    }
  };

  const onRegisterFlat = async (data) => {
    if (!selectedApartmentId) {
      setStatus({ type: 'error', message: 'Please select an Apartment Complex first.' });
      return;
    }
    setIsLoading(true);
    setStatus({ type: '', message: '' });
    try {
      const payload = {
        apartmentId: Number(selectedApartmentId),
        flatNumber: data.flatNumber.trim(),
        floor: Number(data.floor),
        areaSqFt: Number(data.areaSqFt),
        occupantsCount: Number(data.occupantsCount)
      };
      await api.post('/admin/households', payload);
      setStatus({ type: 'success', message: `Flat ${data.flatNumber} registered successfully! Go to Households to assign a resident & meter.` });
      resetFlat();
      fetchHouseholds(selectedApartmentId);
    } catch (err) {
      setStatus({ type: 'error', message: err.response?.data?.message || 'Failed to register flat.' });
    } finally {
      setIsLoading(false);
    }
  };

  const onFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
    setStatus({ type: '', message: '' });
  };

  const onCsvSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setStatus({ type: 'error', message: 'Please select a CSV file first.' });
      return;
    }

    setIsLoading(true);
    setStatus({ type: '', message: '' });

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await api.post('/admin/usage/upload-csv', formData);
      setStatus({ type: 'success', message: response.data.data });
      setSelectedFile(null);
    } catch (err) {
      setStatus({ type: 'error', message: err.response?.data?.message || 'CSV upload failed.' });
    } finally {
      setIsLoading(false);
    }
  };

  const onTriggerSimulation = async () => {
    setIsLoading(true);
    setStatus({ type: '', message: '' });
    try {
      await api.post('/admin/usage/simulate/trigger-daily');
      setStatus({ type: 'success', message: 'Daily simulation triggered for all active virtual meters!' });
    } catch (err) {
      setStatus({ type: 'error', message: 'Failed to trigger simulation.' });
    } finally {
      setIsLoading(false);
    }
  };

  const onSimulateHistory = async (data) => {
    if (!data.meterId) {
      setStatus({ type: 'error', message: 'Please select a Flat / Meter first.' });
      return;
    }
    setIsLoading(true);
    setStatus({ type: '', message: '' });
    try {
      const res = await api.post(`/admin/usage/simulate/meters/${data.meterId}/history`, {
        startDate: data.startDate,
        endDate: data.endDate
      });
      setStatus({ type: 'success', message: res.data.data || 'Historical data generated!' });
      resetSimHistory();
    } catch (err) {
      setStatus({ type: 'error', message: err.response?.data?.message || 'Failed to generate historical data.' });
    } finally {
      setIsLoading(false);
    }
  };

  const formVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300 } }
  };

  const meteredHouseholds = households.filter((h) => h.meterNumber);
  const selectedApartmentName = apartments.find((a) => a.id === Number(selectedApartmentId))?.name || 'Select Complex';

  if (isPageLoading) {
    return <WaterLoader message="Loading Data Ingestion..." />;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header + Apartment Complex Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">Data Ingestion</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-lg">Register flats, log manual meter readings, upload CSVs, or run simulations.</p>
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
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className={`p-4 rounded-xl flex items-center gap-3 font-semibold shadow-sm ${status.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {status.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            {status.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation Tabs */}
      <div className="flex space-x-6 border-b border-gray-200 dark:border-gray-800 relative overflow-x-auto">
        {[
          { id: 'manual', label: 'Manual Entry', icon: Keyboard },
          { id: 'register-flat', label: 'Register Flat', icon: Home },
          { id: 'csv', label: 'CSV Upload', icon: Upload },
          { id: 'sim', label: 'Simulator', icon: Database }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} onClick={() => { setActiveTab(tab.id); setStatus({ type: '', message: '' }); }}
              className={`flex items-center gap-2 pb-4 text-lg font-semibold transition-colors relative z-10 whitespace-nowrap ${activeTab === tab.id ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
            >
              <Icon size={20} /> {tab.label}
              {activeTab === tab.id && (
                <motion.div layoutId="data-tab-indicator" className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 dark:bg-blue-400 rounded-t-full" />
              )}
            </button>
          );
        })}
      </div>

      <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl p-8 rounded-3xl shadow-lg border border-white/20 dark:border-gray-700 relative overflow-hidden">
        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-white/70 dark:bg-gray-900/70 backdrop-blur-sm z-50 flex flex-col items-center justify-center"
            >
              <WaterLoader message="Processing Request..." size={140} compact />
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {/* MANUAL READING TAB */}
          {activeTab === 'manual' && (
            <motion.form key="manual" variants={formVariants} initial="hidden" animate="show" exit={{ opacity: 0, x: 20 }} onSubmit={submitManual(onManualSubmit)} className="space-y-6">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Log Individual Reading — {selectedApartmentName}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <motion.div variants={itemVariants}>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Select Flat & Meter</label>
                  <select
                    {...regManual("meterNumber", { required: true })}
                    className="w-full p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                  >
                    <option value="">-- Choose Flat Meter --</option>
                    {meteredHouseholds.map((h) => (
                      <option key={h.id} value={h.meterNumber}>
                        Flat {h.flatNumber} — {h.meterNumber} {h.residentName ? `(${h.residentName})` : ''}
                      </option>
                    ))}
                  </select>
                  {meteredHouseholds.length === 0 && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                      No active meters found. Install a meter in Household Manager first.
                    </p>
                  )}
                </motion.div>

                <motion.div variants={itemVariants}>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Reading Date</label>
                  <input type="date" {...regManual("readingDate", { required: true })}
                    className="w-full p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" />
                </motion.div>

                <motion.div variants={itemVariants}>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Consumption (kL)</label>
                  <input type="number" step="0.001" {...regManual("consumption", { required: true, min: 0.001 })} placeholder="0.450"
                    className="w-full p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" />
                </motion.div>
              </div>

              <motion.button variants={itemVariants} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit"
                className="mt-6 px-10 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg w-full md:w-auto">
                Submit Reading
              </motion.button>
            </motion.form>
          )}

          {/* REGISTER NEW FLAT TAB */}
          {activeTab === 'register-flat' && (
            <motion.form key="register-flat" variants={formVariants} initial="hidden" animate="show" exit={{ opacity: 0, x: 20 }} onSubmit={submitFlat(onRegisterFlat)} className="space-y-6">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Register New Flat — {selectedApartmentName}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
                Add a new household unit to {selectedApartmentName}.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <motion.div variants={itemVariants}>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Flat Number</label>
                  <input type="text" placeholder="e.g. A-101" {...regFlat("flatNumber", { required: true })}
                    className="w-full p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" />
                </motion.div>

                <motion.div variants={itemVariants}>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Floor</label>
                  <input type="number" placeholder="e.g. 1" {...regFlat("floor", { required: true })}
                    className="w-full p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" />
                </motion.div>

                <motion.div variants={itemVariants}>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Area (Sq Ft)</label>
                  <input type="number" step="0.01" placeholder="e.g. 1250" {...regFlat("areaSqFt", { required: true, min: 1 })}
                    className="w-full p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" />
                </motion.div>

                <motion.div variants={itemVariants}>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Occupants Count</label>
                  <input type="number" placeholder="e.g. 4" {...regFlat("occupantsCount", { required: true, min: 1 })}
                    className="w-full p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" />
                </motion.div>
              </div>

              <motion.button variants={itemVariants} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit"
                className="mt-6 px-10 py-4 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl font-bold shadow-lg w-full md:w-auto">
                Register Flat
              </motion.button>
            </motion.form>
          )}

          {/* CSV UPLOAD TAB */}
          {activeTab === 'csv' && (
            <motion.div key="csv" variants={formVariants} initial="hidden" animate="show" exit={{ opacity: 0, x: 20 }} className="space-y-6">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Bulk Upload (CSV)</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">Upload a CSV file with columns: <code>MeterNumber, ReadingDate(YYYY-MM-DD), Consumption</code>.</p>

              <form onSubmit={onCsvSubmit} className="flex flex-col md:flex-row gap-6 items-start md:items-end">
                <div className="flex-1 w-full relative">
                  <input type="file" accept=".csv" onChange={onFileChange} className="hidden" id="csv-upload" />
                  <label htmlFor="csv-upload" className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl cursor-pointer bg-gray-50 hover:bg-gray-100 dark:bg-gray-900 dark:hover:bg-gray-800 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <FileText className="w-12 h-12 text-gray-400 mb-3" />
                      <p className="mb-2 text-sm text-gray-500 dark:text-gray-400 font-semibold text-center">
                        {selectedFile ? <span className="text-blue-600">{selectedFile.name}</span> : <span>Click to select or drag and drop</span>}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">CSV file only</p>
                    </div>
                  </label>
                </div>
                <button type="submit" disabled={!selectedFile || isLoading} className="w-full md:w-auto px-10 py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-xl shadow-lg disabled:opacity-50">
                  Process Upload
                </button>
              </form>
            </motion.div>
          )}

          {/* SIMULATOR TAB */}
          {activeTab === 'sim' && (
            <motion.div key="sim" variants={formVariants} initial="hidden" animate="show" exit={{ opacity: 0, x: 20 }} className="space-y-10">
              <div className="text-center py-6 border-b border-gray-200 dark:border-gray-700">
                <Database className="mx-auto text-blue-500 mb-3" size={52} />
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Daily IoT Simulator</h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-lg mx-auto mt-1">
                  Trigger the background job manually to generate a single day's reading for all active virtual meters.
                </p>
                <button onClick={onTriggerSimulation} disabled={isLoading} className="mt-5 px-8 py-3.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white rounded-xl font-bold shadow-lg shadow-blue-500/30">
                  Trigger Daily Simulation Now
                </button>
              </div>

              <div>
                <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                  <Calendar size={20} className="text-teal-500" /> Generate Historical Readings by Flat
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                  Select a flat to backfill simulated daily water usage logs across a custom date range.
                </p>

                <form onSubmit={submitSimHistory(onSimulateHistory)} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">Select Flat & Meter</label>
                    <select
                      {...regSimHistory("meterId", { required: true })}
                      className="w-full p-3.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500 font-semibold text-sm"
                    >
                      <option value="">-- Choose Flat --</option>
                      {meteredHouseholds.map((h) => (
                        <option key={h.id} value={h.meterId}>
                          Flat {h.flatNumber} ({h.meterNumber})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">Start Date</label>
                    <input type="date" {...regSimHistory("startDate", { required: true })}
                      className="w-full p-3.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500 text-sm" />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">End Date</label>
                    <input type="date" {...regSimHistory("endDate", { required: true })}
                      className="w-full p-3.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500 text-sm" />
                  </div>

                  <button type="submit" disabled={isLoading} className="py-3.5 px-6 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold shadow-lg transition-all text-sm">
                    Generate History
                  </button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}