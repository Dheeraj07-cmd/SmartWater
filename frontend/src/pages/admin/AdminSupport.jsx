import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { LifeBuoy, AlertCircle, CheckCircle, Clock, User, Search, Megaphone, PlusCircle, Trash2 } from 'lucide-react';
import WaterLoader from '../../components/WaterLoader';
import api from '../../api/axios';

export default function AdminSupport() {
  const [activeTab, setActiveTab] = useState('tickets');
  const [tickets, setTickets] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPosting, setIsPosting] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ type: '', message: '' });
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    const fetchHelpdeskData = async () => {
      try {
        setIsLoading(true);
        const [ticketsRes, noticesRes] = await Promise.allSettled([
          api.get('/admin/support-tickets'),
          api.get('/admin/announcements')
        ]);

        if (ticketsRes.status === 'fulfilled') {
          setTickets(ticketsRes.value.data?.data || []);
        }
        if (noticesRes.status === 'fulfilled') {
          setAnnouncements(noticesRes.value.data?.data || []);
        }
      } catch (err) {
        setStatusMsg({ type: 'error', message: 'Failed to load helpdesk data.' });
      } finally {
        setIsLoading(false);
      }
    };
    fetchHelpdeskData();
  }, []);

  const updateStatus = async (ticketId, newStatus) => {
    const previousTickets = [...tickets];
    setStatusMsg({ type: '', message: '' });
    setTickets(tickets.map((t) => (t.id === ticketId ? { ...t, status: newStatus } : t)));

    try {
      await api.patch(`/admin/support-tickets/${ticketId}/status`, { status: newStatus });
      setStatusMsg({ type: 'success', message: `Ticket status updated to ${newStatus.replace('_', ' ')}.` });
    } catch (err) {
      setTickets(previousTickets);
      setStatusMsg({ type: 'error', message: err.response?.data?.message || 'Failed to update ticket status.' });
    }
  };

  const onPostAnnouncement = async (data) => {
    setIsPosting(true);
    setStatusMsg({ type: '', message: '' });
    try {
      const res = await api.post('/admin/announcements', {
        title: data.title.trim(),
        description: data.description.trim()
      });
      const created = res.data?.data;
      if (created) {
        setAnnouncements([created, ...announcements]);
      }
      setStatusMsg({ type: 'success', message: 'Community announcement published!' });
      reset();
    } catch (err) {
      setStatusMsg({ type: 'error', message: err.response?.data?.message || 'Failed to publish announcement.' });
    } finally {
      setIsPosting(false);
    }
  };

  const onDeleteAnnouncement = async (id) => {
    const previous = [...announcements];
    setAnnouncements(announcements.filter((a) => a.id !== id));
    try {
      await api.delete(`/admin/announcements/${id}`);
      setStatusMsg({ type: 'success', message: 'Announcement removed.' });
    } catch (err) {
      setAnnouncements(previous);
      setStatusMsg({ type: 'error', message: 'Failed to delete announcement.' });
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'OPEN':
        return (
          <span className="bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
            <AlertCircle size={14} /> OPEN
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
            <Clock size={14} /> IN PROGRESS
          </span>
        );
      case 'RESOLVED':
        return (
          <span className="bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
            <CheckCircle size={14} /> RESOLVED
          </span>
        );
      default:
        return null;
    }
  };

  const filteredTickets = tickets.filter((t) => {
    const matchesStatus = filterStatus === 'ALL' || t.status === filterStatus;
    const matchesSearch =
      (t.residentName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.issueType || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  if (isLoading) return <WaterLoader message="Loading Helpdesk & Community Board..." />;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">Helpdesk & Notices</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-lg">Resolve resident support tickets and broadcast community announcements.</p>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl p-1.5 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
          <button
            onClick={() => { setActiveTab('tickets'); setStatusMsg({ type: '', message: '' }); }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'tickets'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
          >
            <LifeBuoy size={18} /> Support Tickets ({tickets.length})
          </button>
          <button
            onClick={() => { setActiveTab('announcements'); setStatusMsg({ type: '', message: '' }); }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'announcements'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
          >
            <Megaphone size={18} /> Announcements ({announcements.length})
          </button>
        </div>
      </div>

      <AnimatePresence>
        {statusMsg.message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`p-4 rounded-xl flex items-center gap-3 font-semibold shadow-sm ${statusMsg.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}
          >
            {statusMsg.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            {statusMsg.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* TAB 1: SUPPORT TICKETS */}
      {activeTab === 'tickets' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              {['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED'].map((st) => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${filterStatus === st
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-white/60 dark:bg-gray-800/60 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-100'
                    }`}
                >
                  {st.replace('_', ' ')}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search resident or issue..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="space-y-4">
            {filteredTickets.length === 0 ? (
              <div className="p-12 text-center text-gray-500 bg-white/60 dark:bg-gray-800/60 rounded-3xl border border-gray-200 dark:border-gray-700">
                <LifeBuoy className="mx-auto mb-4 opacity-50" size={48} />
                <p className="text-lg font-medium">No matching support tickets found.</p>
              </div>
            ) : (
              filteredTickets.map((ticket) => (
                <motion.div
                  key={ticket.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col md:flex-row gap-6 justify-between items-start md:items-center"
                >
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-sm font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                        {ticket.issueType?.replace('_', ' ')}
                      </span>
                      {getStatusBadge(ticket.status)}
                      <span className="text-xs text-gray-500 font-medium">
                        {ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString() : ''}
                      </span>
                    </div>

                    {ticket.residentName && (
                      <div className="flex items-center gap-2 text-xs font-semibold text-gray-600 dark:text-gray-400">
                        <User size={14} className="text-blue-500" />
                        <span>{ticket.residentName}</span>
                        {ticket.residentEmail && <span className="opacity-75">({ticket.residentEmail})</span>}
                      </div>
                    )}

                    <p className="text-gray-700 dark:text-gray-300 font-medium leading-relaxed">{ticket.description}</p>
                  </div>

                  <select
                    value={ticket.status}
                    onChange={(e) => updateStatus(ticket.id, e.target.value)}
                    className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm font-bold outline-none cursor-pointer focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="OPEN">Mark Open</option>
                    <option value="IN_PROGRESS">Mark In Progress</option>
                    <option value="RESOLVED">Mark Resolved</option>
                  </select>
                </motion.div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 2: COMMUNITY ANNOUNCEMENTS */}
      {activeTab === 'announcements' && (
        <div className="grid md:grid-cols-2 gap-8">
          {/* Publish New Announcement Form */}
          <div className="relative bg-white/75 dark:bg-gray-800/75 backdrop-blur-xl p-8 rounded-3xl shadow-lg border border-white/20 dark:border-gray-700 h-fit overflow-hidden">
            <AnimatePresence>
              {isPosting && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-white/75 dark:bg-gray-900/75 backdrop-blur-sm z-50 flex flex-col items-center justify-center"
                >
                  <WaterLoader message="Publishing Notice..." size={130} compact />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
                <Megaphone size={24} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Post Announcement</h3>
            </div>

            <form onSubmit={handleSubmit(onPostAnnouncement)} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Notice Title</label>
                <input
                  type="text"
                  placeholder="e.g. Scheduled Tank Cleaning on Sunday"
                  {...register("title", { required: "Title is required" })}
                  className="w-full p-3.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.title && <p className="text-red-500 text-xs font-semibold mt-1">{errors.title.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Announcement Details</label>
                <textarea
                  rows="4"
                  placeholder="Provide date, time, or tariff notice details for all residents..."
                  {...register("description", {
                    required: "Description is required",
                    minLength: { value: 10, message: "Please enter at least 10 characters" }
                  })}
                  className="w-full p-3.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
                {errors.description && <p className="text-red-500 text-xs font-semibold mt-1">{errors.description.message}</p>}
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isPosting}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25"
              >
                <PlusCircle size={20} /> Publish to Community Board
              </motion.button>
            </form>
          </div>

          {/* Active Announcements Feed */}
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white p-8 rounded-3xl shadow-lg border border-gray-700 flex flex-col">
            <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <Megaphone size={24} className="text-cyan-400" /> Active Community Notices
            </h3>

            {announcements.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400 py-12 text-center">
                <Megaphone size={40} className="opacity-40 mb-3" />
                <p className="font-medium">No announcements posted yet.</p>
                <p className="text-xs text-gray-500 mt-1">Publish a notice on the left to notify all residents.</p>
              </div>
            ) : (
              <div className="space-y-4 overflow-y-auto max-h-[460px] pr-1">
                {announcements.map((notice) => (
                  <div key={notice.id} className="p-4 bg-white/10 rounded-2xl border border-white/10 backdrop-blur-sm">
                    <div className="flex justify-between items-start gap-3 mb-2">
                      <h4 className="font-bold text-base text-white">{notice.title}</h4>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-semibold text-gray-300 bg-black/30 px-2.5 py-1 rounded-full">
                          {notice.createdAt
                            ? new Date(notice.createdAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit' })
                            : 'Recent'}
                        </span>
                        <button
                          type="button"
                          onClick={() => onDeleteAnnouncement(notice.id)}
                          title="Delete Announcement"
                          className="p-1.5 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <p className="text-gray-300 text-sm leading-relaxed">{notice.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}