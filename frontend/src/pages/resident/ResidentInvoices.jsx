import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Download, AlertCircle, Loader2 } from 'lucide-react';
import WaterLoader from '../../components/WaterLoader';
import api from '../../api/axios';

export default function ResidentInvoices() {
  const [invoices, setInvoices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        setIsLoading(true);
        const response = await api.get('/resident/invoices');
        const rawList = response.data?.data || [];

        const formattedInvoices = rawList.map((inv) => ({
          id: inv.id,
          invoiceNumber: inv.invoiceNumber || `INV-${inv.id}`,
          cycle: inv.cycleName || 'Billing Cycle',
          dueDate: inv.dueDate
            ? new Date(inv.dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
            : 'N/A',
          consumptionKl: `${Number(inv.consumptionKl || 0).toFixed(2)} kL`,
          meteredCharge: `₹ ${Number(inv.meteredCharge || 0).toFixed(2)}`,
          sharedAreaCharge: `₹ ${Number(inv.sharedAreaCharge || 0).toFixed(2)}`,
          amount: `₹ ${Number(inv.totalAmount || 0).toFixed(2)}`,
          status: inv.status || 'UNPAID'
        }));

        setInvoices(formattedInvoices);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load invoices.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvoices();
  }, []);

  const handleDownload = async (invoiceId, invoiceNumber) => {
    try {
      setDownloadingId(invoiceId);
      setError('');

      const response = await api.get(`/resident/invoices/${invoiceId}/download`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${invoiceNumber || `SmartWater-Invoice-${invoiceId}`}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to download PDF. The invoice file may not exist on the server.');
    } finally {
      setDownloadingId(null);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
  };

  if (isLoading) {
    return <WaterLoader message="Loading your water data..." />;
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">My Invoices</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2 text-lg">View your itemized monthly water bills and download official PDF statements.</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 text-red-700 dark:text-red-400 font-medium flex items-center gap-3 rounded-r-xl">
          <AlertCircle size={24} /> {error}
        </div>
      )}

      {invoices.length === 0 ? (
        <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-3xl shadow-lg border border-white/20 dark:border-gray-700 p-12 text-center text-gray-500 dark:text-gray-400 font-medium text-lg">
          No invoices have been generated for your household yet.
        </div>
      ) : (
        <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-3xl shadow-lg border border-white/20 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
              <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-50/50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-6 py-5">Billing Cycle</th>
                  <th className="px-6 py-5">Usage</th>
                  <th className="px-6 py-5">Metered / Shared</th>
                  <th className="px-6 py-5">Due Date</th>
                  <th className="px-6 py-5">Total Amount</th>
                  <th className="px-6 py-5">Status</th>
                  <th className="px-6 py-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="px-6 py-6 font-bold text-gray-900 dark:text-white flex items-center gap-3">
                      <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 text-white rounded-xl shadow-md shrink-0">
                        <FileText size={20} />
                      </div>
                      <div>
                        <div>{inv.cycle}</div>
                        <div className="text-xs font-normal text-gray-400">{inv.invoiceNumber}</div>
                      </div>
                    </td>
                    <td className="px-6 py-6 font-semibold text-blue-600 dark:text-blue-400">{inv.consumptionKl}</td>
                    <td className="px-6 py-6 text-xs">
                      <div>Metered: <span className="font-bold text-gray-700 dark:text-gray-200">{inv.meteredCharge}</span></div>
                      <div>Shared: <span className="font-bold text-gray-700 dark:text-gray-200">{inv.sharedAreaCharge}</span></div>
                    </td>
                    <td className="px-6 py-6 font-medium">{inv.dueDate}</td>
                    <td className="px-6 py-6 font-extrabold text-gray-900 dark:text-white text-base">{inv.amount}</td>
                    <td className="px-6 py-6">
                      <span className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-wide shadow-sm ${inv.status === 'PAID'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-400'
                        }`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-6 py-6 text-right">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleDownload(inv.id, inv.invoiceNumber)}
                        disabled={downloadingId === inv.id}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-blue-600 hover:text-white rounded-xl transition-colors font-bold shadow-md disabled:opacity-50"
                      >
                        {downloadingId === inv.id ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                        {downloadingId === inv.id ? 'Processing...' : 'Download PDF'}
                      </motion.button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </motion.div>
  );
}