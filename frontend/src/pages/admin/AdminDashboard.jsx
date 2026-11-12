import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie } from 'recharts';
import { Users, Droplets, Activity, FileText, AlertCircle, Building2, CheckCircle2, Gauge } from 'lucide-react';
import WaterLoader from '../../components/WaterLoader';
import api from '../../api/axios';

export default function AdminDashboard() {
  const [apartments, setApartments] = useState([]);
  const [selectedApartmentId, setSelectedApartmentId] = useState('');
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchApartments = async () => {
      try {
        const res = await api.get('/admin/apartments');
        const aptList = res.data.data || [];
        setApartments(aptList);
        if (aptList.length > 0) {
          setSelectedApartmentId(aptList[0].id);
        } else {
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Failed to fetch apartments:", err);
        setError('Could not load apartment list.');
        setIsLoading(false);
      }
    };
    fetchApartments();
  }, []);

  useEffect(() => {
    if (!selectedApartmentId) return;

    const fetchAnalytics = async () => {
      try {
        setIsLoading(true);
        setError('');
        const response = await api.get(`/admin/apartments/${selectedApartmentId}/analytics`);
        setAnalytics(response.data.data);
      } catch (err) {
        console.error("Failed to fetch admin analytics:", err);
        setError(err.response?.data?.message || 'Failed to load dashboard data.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [selectedApartmentId]);

  const handleMeterStatusChange = async (meterId, newStatus) => {
    if (!meterId) return;
    const previousList = [...(analytics?.meterHealth || [])];

    // Optimistic UI update
    setAnalytics((prev) => ({
      ...prev,
      meterHealth: prev.meterHealth.map((m) =>
        m.meterId === meterId ? { ...m, status: newStatus } : m
      )
    }));

    try {
      await api.patch(`/admin/meters/${meterId}/status`, { status: newStatus });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update meter status.');
      setAnalytics((prev) => ({ ...prev, meterHealth: previousList }));
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 120 } }
  };

  if (isLoading) {
    return <WaterLoader message="Loading apartment analytics..." />;
  }

  const totalShared = Number(analytics?.totalSharedExpenses) || 0;
  const totalAllocated = Number(analytics?.totalAllocatedExpenses) || 0;
  const totalMetered = Number(analytics?.totalMeteredRevenue) || 0;
  const unallocated = Math.max(0, Number((totalShared - totalAllocated).toFixed(2)));

  const pieData = [
    { name: 'Metered Usage Billed', value: totalMetered, fill: '#3B82F6' },
    { name: 'Shared Tanker Allocated', value: totalAllocated, fill: '#10B981' },
    { name: 'Unallocated Tanker Expense', value: unallocated, fill: '#EF4444' }
  ].filter((slice) => slice.value > 0);

  const hasFinancialData = pieData.length > 0;

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="max-w-6xl mx-auto space-y-8">

      {/* Header with Apartment Name Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">Admin Overview</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-lg">Apartment complex usage, financial reconciliation, and live meter telemetry.</p>
        </div>

        {apartments.length > 0 && (
          <div className="flex items-center gap-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl px-4 py-2.5 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
            <Building2 className="text-blue-600 dark:text-blue-400 shrink-0" size={20} />
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Complex</span>
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

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 text-red-700 dark:text-red-400 font-medium flex items-center gap-3 rounded-r-xl">
          <AlertCircle size={24} /> {error}
        </div>
      )}

      {/* Admin KPI Cards */}
      <motion.div variants={containerVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: "Total Households", value: analytics?.totalHouseholds || 0, icon: Users, iconBg: "bg-gradient-to-br from-blue-500 to-cyan-500" },
          { title: "Total Consumption", value: `${Number(analytics?.totalConsumptionKl || 0).toFixed(2)} kL`, icon: Droplets, iconBg: "bg-gradient-to-br from-teal-500 to-emerald-500" },
          { title: "Active Alerts", value: analytics?.activeAlerts || 0, icon: Activity, iconBg: "bg-gradient-to-br from-red-500 to-orange-500" },
          { title: "Pending Invoices", value: analytics?.pendingInvoices || 0, icon: FileText, iconBg: "bg-gradient-to-br from-yellow-400 to-amber-600" },
        ].map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <motion.div key={idx} variants={itemVariants} className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl p-6 rounded-3xl shadow-lg border border-white/20 dark:border-gray-700 flex items-center gap-4">
              <div className={`p-4 rounded-2xl text-white shadow-md ${stat.iconBg}`}>
                <Icon size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">{stat.title}</p>
                <h3 className="text-3xl font-extrabold text-gray-900 dark:text-white mt-1">{stat.value}</h3>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Comparative Analytics Chart */}
      <motion.div variants={itemVariants} className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl p-6 sm:p-8 rounded-3xl shadow-lg border border-white/20 dark:border-gray-700">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Household Consumption Comparison (kL)</h3>
        </div>

        <div className="h-96 w-full">
          {!analytics?.householdComparisons || analytics.householdComparisons.length === 0 ? (
            <div className="h-full flex items-center justify-center text-gray-500 font-medium">No household data available for comparison.</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.householdComparisons} margin={{ top: 20, right: 30, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} vertical={false} />
                <XAxis dataKey="flatNumber" stroke="#6B7280" tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="#6B7280" tickLine={false} axisLine={false} dx={-10} />
                <Tooltip
                  cursor={{ fill: '#374151', opacity: 0.1 }}
                  contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#F9FAFB', borderRadius: '12px', fontWeight: 'bold' }}
                />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                <Bar dataKey="usage" name="Actual Usage (kL)" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="average" name="Apartment Average (kL)" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </motion.div>

      {/* Bottom Grid: Financial Reconciliation & DB Meter Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Financial Reconciliation */}
        <motion.div variants={itemVariants} className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl p-6 rounded-3xl shadow-lg border border-white/20 dark:border-gray-700">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Financial Reconciliation</h3>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="h-52 w-52 shrink-0 flex items-center justify-center">
              {!hasFinancialData ? (
                <div className="w-40 h-40 rounded-full border-4 border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center text-center p-4">
                  <span className="text-xs font-bold text-gray-400">Log Bulk Purchases or Generate Invoices to View</span>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      innerRadius={48}
                      outerRadius={82}
                      paddingAngle={3}
                      dataKey="value"
                      nameKey="name"
                      stroke="none"
                    />
                    <Tooltip
                      formatter={(val) => `₹${Number(val).toFixed(2)}`}
                      contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#F9FAFB', borderRadius: '10px', fontSize: '12px', fontWeight: 'bold' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="space-y-2.5 text-sm font-bold flex-1 w-full">
              <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/40 flex justify-between items-center">
                <div>
                  <p className="text-blue-600 dark:text-blue-400 text-[11px] uppercase">Metered Usage Billed</p>
                  <p className="text-lg text-blue-700 dark:text-blue-300">₹{totalMetered.toFixed(2)}</p>
                </div>
                <span className="w-3 h-3 rounded-full bg-blue-500" />
              </div>

              <div className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 flex justify-between items-center">
                <div>
                  <p className="text-gray-500 text-[11px] uppercase">Total Bulk Tanker Expense</p>
                  <p className="text-lg text-gray-900 dark:text-white">₹{totalShared.toFixed(2)}</p>
                </div>
                <span className="w-3 h-3 rounded-full bg-red-500" />
              </div>

              <div className="p-3 rounded-2xl bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/40 flex justify-between items-center">
                <div>
                  <p className="text-green-600 dark:text-green-400 text-[11px] uppercase">Allocated to Invoices</p>
                  <p className="text-lg text-green-700 dark:text-green-300">₹{totalAllocated.toFixed(2)}</p>
                </div>
                <span className="w-3 h-3 rounded-full bg-emerald-500" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Meter Status (Directly from DB Enum: ACTIVE, INACTIVE, FAULTY) */}
        <motion.div variants={itemVariants} className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl p-6 rounded-3xl shadow-lg border border-white/20 dark:border-gray-700 overflow-y-auto max-h-80">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Gauge size={22} className="text-blue-500" /> Meter Status (DB)
            </h3>
            <span className="text-xs font-bold text-gray-400">{analytics?.meterHealth?.length || 0} Flats</span>
          </div>

          {!analytics?.meterHealth || analytics.meterHealth.length === 0 ? (
            <div className="h-44 flex flex-col items-center justify-center text-gray-400 text-sm font-medium">
              <CheckCircle2 size={32} className="mb-2 opacity-50" />
              No households or meters configured for this complex yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {analytics.meterHealth.map((meter, idx) => (
                <div
                  key={meter.meterId || idx}
                  className={`p-3.5 rounded-2xl font-bold text-xs border transition-all flex flex-col justify-between gap-2 ${meter.status === 'ACTIVE'
                      ? 'bg-green-100/80 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800'
                      : meter.status === 'INACTIVE'
                        ? 'bg-yellow-100/80 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800'
                        : 'bg-red-100/80 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800'
                    }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-extrabold">Flat {meter.flatNumber}</span>
                    {meter.meterId ? (
                      <select
                        value={meter.status}
                        onChange={(e) => handleMeterStatusChange(meter.meterId, e.target.value)}
                        className="px-2 py-1 rounded-lg text-[11px] font-extrabold bg-white/80 dark:bg-gray-900/80 text-gray-900 dark:text-white border border-black/10 dark:border-white/10 outline-none cursor-pointer"
                      >
                        <option value="ACTIVE">ACTIVE</option>
                        <option value="INACTIVE">INACTIVE</option>
                        <option value="FAULTY">FAULTY</option>
                      </select>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/10 dark:bg-white/10">
                        UNASSIGNED
                      </span>
                    )}
                  </div>

                  <div>
                    <div className="text-[11px] opacity-85 truncate" title={meter.meterNumber}>
                      Meter: {meter.meterNumber}
                    </div>
                    <div className="text-[11px] font-semibold mt-0.5">
                      Reading: {Number(meter.lastReadingValue || 0).toFixed(3)} kL
                    </div>
                    <div className="text-[10px] opacity-75 mt-0.5">
                      {meter.lastReadingDate ? `Last: ${meter.lastReadingDate}` : 'No readings yet'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}