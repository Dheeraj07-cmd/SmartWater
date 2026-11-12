import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { KeyRound, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../../api/axios';
import FloatingThemeToggle from '../../components/FloatingThemeToggle';
import WaterVideoBackground from '../../components/WaterVideoBackground';
import WaterLoader from '../../components/WaterLoader';

export default function ForgotPassword() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (data) => {
    const cleanEmail = data.email.trim();
    setIsLoading(true);
    setStatus({ type: '', message: '' });

    try {
      const res = await api.post(
        `/auth/forgot-password?email=${encodeURIComponent(cleanEmail)}`,
        { email: cleanEmail }
      );
      setStatus({
        type: 'success',
        message: res.data?.message || 'A password reset link has been sent to your email.'
      });
    } catch (err) {
      setStatus({
        type: 'error',
        message: err.response?.data?.message || 'Failed to send reset email. Account may not exist.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-transparent p-4 relative overflow-hidden">
      <WaterVideoBackground isPublic={true} isTeal={false} />
      <FloatingThemeToggle />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white/85 dark:bg-gray-800/85 backdrop-blur-xl rounded-[2.5rem] shadow-2xl p-10 border border-white/50 dark:border-gray-700 relative z-10 overflow-hidden"
      >
        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-white/75 dark:bg-gray-900/75 backdrop-blur-sm z-50 flex flex-col items-center justify-center"
            >
              <WaterLoader message="Sending Reset Link..." size={130} compact />
            </motion.div>
          )}
        </AnimatePresence>

        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white font-bold mb-8 transition-colors"
        >
          <ArrowLeft size={18} /> Back to Login
        </Link>

        <div className="p-4 bg-gradient-to-br from-blue-500 to-cyan-500 w-fit rounded-2xl text-white mb-6 shadow-lg">
          <KeyRound size={28} />
        </div>
        <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">Reset Password</h2>
        <p className="text-gray-500 dark:text-gray-400 font-medium mb-8">
          Enter your registered email and we will send you a 15-minute password reset link.
        </p>

        {status.message && (
          <div
            className={`p-4 mb-6 rounded-xl flex items-center gap-3 font-semibold text-sm ${status.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}
          >
            {status.type === 'success' ? (
              <CheckCircle size={20} className="shrink-0" />
            ) : (
              <AlertCircle size={20} className="shrink-0" />
            )}
            <span>{status.message}</span>
          </div>
        )}

        {status.type !== 'success' && (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                {...register("email", { required: "Please enter your email address" })}
                className="w-full px-5 py-4 rounded-2xl border border-gray-200 dark:border-gray-600 bg-white/90 dark:bg-gray-700/90 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                placeholder="you@apartment.com"
              />
              {errors.email && (
                <p className="text-red-500 text-xs font-semibold mt-1.5">{errors.email.message}</p>
              )}
            </div>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white rounded-2xl font-bold text-lg shadow-lg shadow-blue-500/30 flex justify-center items-center gap-2 disabled:opacity-70 transition-all"
            >
              Send Reset Link
            </motion.button>
          </form>
        )}
      </motion.div>
    </div>
  );
}