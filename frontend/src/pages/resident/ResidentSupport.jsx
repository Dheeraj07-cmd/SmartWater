import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LifeBuoy, Send, MessageSquare, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { useForm } from 'react-hook-form';
import WaterLoader from '../../components/WaterLoader';
import api from '../../api/axios';

export default function ResidentSupport() {
  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [recentTickets, setRecentTickets] = useState([]);

  useEffect(() => {
    const fetchSupportAndNotices = async () => {
      try {
        setIsPageLoading(true);
        const [noticesRes, ticketsRes] = await Promise.allSettled([
          api.get('/resident/announcements'),
          api.get('/resident/support')
        ]);

        if (noticesRes.status === 'fulfilled') {
          setAnnouncements(noticesRes.value.data?.data || []);
        }
        if (ticketsRes.status === 'fulfilled') {
          setRecentTickets(ticketsRes.value.data?.data || []);
        }
      } catch (err) {
        console.error("Failed to load support data:", err);
      } finally {
        setIsPageLoading(false);
      }
    };

    fetchSupportAndNotices();
  }, []);

  const onSubmit = async (data) => {
    try {
      setIsSubmitting(true);
      setStatus({ type: '', message: '' });

      const response = await api.post('/resident/support', data);
      const createdTicket = response.data?.data;

      if (createdTicket) {
        setRecentTickets((prev) => [createdTicket, ...prev]);
      }

      setStatus({ type: 'success', message: response.data?.message || 'Support ticket submitted successfully!' });
      reset();
    } catch (err) {
      setStatus({ type: 'error', message: err.response?.data?.message || 'Failed to submit ticket.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTicketBadgeClass = (ticketStatus) => {
    switch (ticketStatus) {
      case 'RESOLVED':
        return 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400';
      case 'IN_PROGRESS':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400';
      default:
        return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400';
    }
  };

  if (isPageLoading) {
    return <WaterLoader message="Loading Support & Community..." />;
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">Support & Community</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2 text-lg">Report meter issues, suspected leaks, or view apartment management notices.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Left Column: Submit Ticket Form with Loading Overlay */}
        <div className="relative bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl p-8 rounded-3xl shadow-lg border border-white/20 dark:border-gray-700 overflow-hidden h-fit">
          <AnimatePresence>
            {isSubmitting && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-white/70 dark:bg-gray-900/70 backdrop-blur-sm z-50 flex flex-col items-center justify-center"
              >
                <WaterLoader message="Submitting Ticket..." size={130} compact />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-xl"><LifeBuoy size={24} /></div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Submit a Ticket</h3>
          </div>

          <AnimatePresence>
            {status.message && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`p-4 mb-6 rounded-xl flex items-center gap-3 font-semibold ${status.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}
              >
                {status.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                {status.message}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Issue Type</label>
              <select
                {...register("issueType", { required: "Please select an issue type" })}
                className="w-full p-3.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              >
                <option value="">Select category...</option>
                <option value="METER_FAULT">Suspected Meter Fault</option>
                <option value="LEAK_REPORT">Reporting a Leak</option>
                <option value="BILLING">Billing Discrepancy</option>
                <option value="OTHER">Other</option>
              </select>
              {errors.issueType && <p className="text-red-500 text-xs font-semibold mt-1">{errors.issueType.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Description</label>
              <textarea
                {...register("description", {
                  required: "Please describe the issue",
                  minLength: { value: 10, message: "Please provide at least 10 characters of detail" }
                })}
                rows="4"
                className="w-full p-3.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Describe the location, severity, or invoice cycle..."
              />
              {errors.description && <p className="text-red-500 text-xs font-semibold mt-1">{errors.description.message}</p>}
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg disabled:opacity-70 transition-all"
            >
              <Send size={20} /> {isSubmitting ? 'Submitting...' : 'Submit Ticket'}
            </motion.button>
          </form>
        </div>

        {/* Right Column: Dynamic Community Announcements & Live Tickets */}
        <div className="space-y-6 flex flex-col">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white p-8 rounded-3xl shadow-lg border border-gray-700 flex-1 flex flex-col">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gray-700 rounded-xl"><MessageSquare size={24} /></div>
              <h3 className="text-2xl font-bold">Community Board</h3>
            </div>

            {announcements.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400 py-8 text-center">
                <MessageSquare size={36} className="opacity-40 mb-3" />
                <p className="text-sm font-medium">No community announcements posted yet.</p>
              </div>
            ) : (
              <div className="space-y-4 overflow-y-auto max-h-[340px] pr-1">
                {announcements.map((notice) => (
                  <div key={notice.id} className="p-4 bg-white/10 rounded-2xl border border-white/5 backdrop-blur-sm">
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <h4 className="font-bold text-base">{notice.title}</h4>
                      <span className="text-xs font-semibold text-gray-300 bg-black/30 px-2.5 py-1 rounded-full shrink-0">
                        {notice.createdAt
                          ? new Date(notice.createdAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit' })
                          : ''}
                      </span>
                    </div>
                    <p className="text-gray-300 text-sm leading-relaxed">{notice.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Live Submitted Tickets */}
          {recentTickets.length > 0 && (
            <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl p-6 rounded-3xl shadow-lg border border-white/20 dark:border-gray-700 space-y-3">
              <h4 className="text-sm font-extrabold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-2">
                <Clock size={16} /> My Support Tickets
              </h4>
              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                {recentTickets.map((t) => (
                  <div key={t.id} className="p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 flex items-center justify-between gap-4">
                    <div className="truncate">
                      <p className="text-xs font-extrabold text-blue-600 dark:text-blue-400 uppercase">{t.issueType?.replace('_', ' ')}</p>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">{t.description}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold shrink-0 ${getTicketBadgeClass(t.status)}`}>
                      {(t.status || 'OPEN').replace('_', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}