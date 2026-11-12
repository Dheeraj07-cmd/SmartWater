import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Droplets, Activity, Home, AlertCircle, Info, Calendar, Table } from 'lucide-react';
import WaterLoader from '../../components/WaterLoader';
import api from '../../api/axios';

export default function ResidentDashboard() {
  const [profile, setProfile] = useState(null);
  const [usageData, setUsageData] = useState([]);
  const [rangeDays, setRangeDays] = useState(30);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        setError('');

        const profileRes = await api.get('/resident/profile');
        const profileData = profileRes.data?.data;
        setProfile(profileData);

        if (profileData?.firstName) {
          localStorage.setItem('user_name', profileData.firstName);
        }
        if (profileData?.profilePhotoUrl) {
          localStorage.setItem('user_photo', profileData.profilePhotoUrl);
        }

        if (profileData?.flatNumber && profileData?.meterNumber) {
          const endDate = new Date().toISOString().split('T')[0];
          const start = new Date();
          start.setDate(start.getDate() - rangeDays);
          const startDate = start.toISOString().split('T')[0];

          const usageRes = await api.get(`/resident/usage?startDate=${startDate}&endDate=${endDate}`);
          const rawLogs = usageRes.data?.data || [];

          const formattedUsage = rawLogs.map((log) => {
            let dateObj;
            if (Array.isArray(log.readingDate)) {
              dateObj = new Date(log.readingDate[0], log.readingDate[1] - 1, log.readingDate[2]);
            } else {
              dateObj = new Date(log.readingDate);
            }

            const formattedDate = !isNaN(dateObj)
              ? dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
              : String(log.readingDate);

            const fullDate = !isNaN(dateObj)
              ? dateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' })
              : String(log.readingDate);

            return {
              id: log.id,
              date: formattedDate,
              fullDate,
              meterNumber: log.meterNumber || profileData.meterNumber,
              currentReading: Number(log.currentReading) || 0,
              consumption: Number(log.consumption) || 0,
              readingSource: log.readingSource || (log.isSimulated ? 'SIMULATED' : 'MANUAL'),
              isSimulated: Boolean(log.isSimulated)
            };
          });

          setUsageData(formattedUsage);
        } else {
          setUsageData([]);
        }
      } catch (err) {
        console.error("Dashboard fetch error:", err);
        setError(err.response?.data?.message || 'Failed to load dashboard data.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [rangeDays]);

  const totalConsumption = usageData
    .reduce((sum, log) => sum + (Number(log.consumption) || 0), 0)
    .toFixed(2);

  // Reverse copy so the Daily Reading List shows newest readings at the top
  const dailyReadingList = [...usageData].reverse();

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 120 } }
  };

  if (isLoading) {
    return <WaterLoader message="Loading your water data..." />;
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="max-w-6xl mx-auto space-y-8">
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 text-red-700 dark:text-red-400 font-medium flex items-center gap-3 rounded-r-xl">
          <AlertCircle size={24} /> {error}
        </div>
      )}

      {/* Friendly Onboarding Banner if Admin hasn't assigned a Flat or Meter yet */}
      {(!profile?.flatNumber || !profile?.meterNumber) && (
        <div className="p-5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 rounded-2xl flex items-start gap-3">
          <Info size={22} className="shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
          <div className="text-sm font-medium">
            <p className="font-bold text-base">Account Setup Pending</p>
            <p className="mt-0.5">
              {!profile?.flatNumber
                ? 'Your resident account is registered. Please ask your Apartment Admin to assign you to your flat in the Household Manager.'
                : 'Your flat is assigned! Waiting for the Apartment Admin to install your Virtual Water Meter.'}
            </p>
          </div>
        </div>
      )}

      {/* Header Section */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Welcome, {profile?.firstName || 'Resident'}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-lg">
            Here is your household water consumption overview.
          </p>
        </div>
        {usageData.some((log) => log.isSimulated) && (
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 rounded-full text-sm font-bold shadow-sm">
            <Activity size={16} /> Viewing Simulated Data
          </div>
        )}
      </motion.div>

      {/* KPI Cards */}
      <motion.div variants={containerVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div variants={itemVariants} className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl p-6 sm:p-8 rounded-3xl shadow-lg border border-white/20 dark:border-gray-700 flex items-center gap-5">
          <div className="p-4 bg-gradient-to-br from-blue-500 to-cyan-500 text-white rounded-2xl shadow-lg"><Droplets size={28} /></div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">{rangeDays}-Day Usage</p>
            <h3 className="text-3xl font-extrabold text-gray-900 dark:text-white mt-1">
              {totalConsumption} <span className="text-xl text-gray-500">kL</span>
            </h3>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl p-6 sm:p-8 rounded-3xl shadow-lg border border-white/20 dark:border-gray-700 flex items-center gap-5">
          <div className="p-4 bg-gradient-to-br from-teal-500 to-emerald-500 text-white rounded-2xl shadow-lg"><Home size={28} /></div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">Your Flat</p>
            <h3 className="text-3xl font-extrabold text-gray-900 dark:text-white mt-1">{profile?.flatNumber || 'Unassigned'}</h3>
            <p className="text-xs text-gray-500 mt-1">{profile?.apartmentName || 'No complex linked'}</p>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl p-6 sm:p-8 rounded-3xl shadow-lg border border-white/20 dark:border-gray-700 flex items-center gap-5">
          <div className="p-4 bg-gradient-to-br from-indigo-500 to-purple-500 text-white rounded-2xl shadow-lg"><Activity size={28} /></div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">Meter Status</p>
            <h3 className="text-xl font-extrabold text-gray-900 dark:text-white mt-1 truncate max-w-[160px]" title={profile?.meterNumber}>
              {profile?.meterNumber || 'Unassigned'}
            </h3>
            {/* Dynamic DB MeterStatus Badge */}
            {profile?.meterStatus === 'ACTIVE' ? (
              <p className="text-xs text-emerald-500 font-bold mt-1">● Active Recording</p>
            ) : profile?.meterStatus === 'FAULTY' ? (
              <p className="text-xs text-red-500 font-bold mt-1">● Faulty / Under Repair</p>
            ) : profile?.meterStatus === 'INACTIVE' ? (
              <p className="text-xs text-amber-500 font-bold mt-1">● Meter Inactive</p>
            ) : (
              <p className="text-xs text-amber-500 font-bold mt-1">● Pending Installation</p>
            )}
          </div>
        </motion.div>
      </motion.div>

      {/* Chart Section */}
      <motion.div variants={itemVariants} className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl p-6 sm:p-8 rounded-3xl shadow-lg border border-white/20 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Consumption Trend (kL)</h3>

          <div className="flex gap-2">
            {[
              { label: '30 Days', value: 30 },
              { label: '90 Days', value: 90 },
              { label: '1 Year', value: 365 }
            ].map((btn) => (
              <button
                key={btn.value}
                onClick={() => setRangeDays(btn.value)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${rangeDays === btn.value
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                  }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        <div className="h-96 w-full">
          {usageData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-gray-500 font-medium">
              No usage data found for the selected time range.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={usageData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorUsage" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} vertical={false} />
                <XAxis dataKey="date" stroke="#6B7280" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="#6B7280" fontSize={12} tickLine={false} axisLine={false} dx={-10} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#F9FAFB', borderRadius: '12px', fontWeight: 'bold' }}
                  itemStyle={{ color: '#22d3ee' }}
                />
                <Area
                  type="monotone"
                  dataKey="consumption"
                  stroke="#0891b2"
                  strokeWidth={4}
                  fillOpacity={1}
                  fill="url(#colorUsage)"
                  activeDot={{ r: 8, fill: '#06b6d4', stroke: '#fff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </motion.div>

      {/* Daily Meter Readings List */}
      <motion.div variants={itemVariants} className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-3xl shadow-lg border border-white/20 dark:border-gray-700 overflow-hidden">
        <div className="p-6 sm:px-8 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
              <Table size={20} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Daily Meter Readings Log</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Itemized daily water consumption recorded by your flat meter</p>
            </div>
          </div>
          <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
            {dailyReadingList.length} Readings
          </span>
        </div>

        {dailyReadingList.length === 0 ? (
          <div className="p-12 text-center text-gray-500 font-medium">
            No daily meter readings recorded for this period yet.
          </div>
        ) : (
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
              <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-50/80 dark:bg-gray-700/60 sticky top-0 backdrop-blur-md">
                <tr>
                  <th className="px-6 py-4">Reading Date</th>
                  <th className="px-6 py-4">Meter Number</th>
                  <th className="px-6 py-4">Cumulative Reading</th>
                  <th className="px-6 py-4">Daily Usage</th>
                  <th className="px-6 py-4">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60">
                {dailyReadingList.map((log, index) => (
                  <tr key={log.id || index} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="px-6 py-4 font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <Calendar size={15} className="text-blue-500 shrink-0" />
                      {log.fullDate}
                    </td>
                    <td className="px-6 py-4 font-medium">{log.meterNumber}</td>
                    <td className="px-6 py-4 font-semibold text-gray-800 dark:text-gray-200">
                      {log.currentReading.toFixed(3)} kL
                    </td>
                    <td className="px-6 py-4">
                      <span className={`font-extrabold ${log.consumption > 1.5 ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}`}>
                        +{log.consumption.toFixed(3)} kL
                      </span>
                      <span className="text-xs text-gray-400 ml-1.5">
                        ({Math.round(log.consumption * 1000)} L)
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${log.isSimulated
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                        }`}>
                        {String(log.readingSource).replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}