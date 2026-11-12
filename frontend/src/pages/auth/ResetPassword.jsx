import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, CheckCircle, AlertCircle, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import api from '../../api/axios';
import FloatingThemeToggle from '../../components/FloatingThemeToggle';
import WaterVideoBackground from '../../components/WaterVideoBackground';
import WaterLoader from '../../components/WaterLoader';

export default function ResetPassword() {
  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);

  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const navigate = useNavigate();
  const newPassword = watch("newPassword");

  const onSubmit = async (data) => {
    if (!token) {
      setStatus({ type: 'error', message: 'Invalid or missing reset token.' });
      return;
    }

    setIsLoading(true);
    setStatus({ type: '', message: '' });
    try {
      await api.post('/auth/reset-password', {
        token: token.trim(),
        newPassword: data.newPassword
      });

      setStatus({ type: 'success', message: 'Password reset successful! Redirecting to login...' });

      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setStatus({
        type: 'error',
        message: err.response?.data?.message || 'Failed to reset password. The link may have expired.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-transparent p-4 relative overflow-hidden">
        <WaterVideoBackground isPublic={true} isTeal={true} />
        <FloatingThemeToggle />

        <div className="p-8 bg-white/85 dark:bg-gray-800/85 backdrop-blur-xl rounded-3xl shadow-2xl max-w-md w-full text-center border border-white/40 dark:border-gray-700 relative z-10">
          <AlertCircle className="mx-auto mb-4 text-red-500" size={48} />
          <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-2">Invalid Reset Link</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">
            This password reset link is invalid or missing the required security token.
          </p>
          <Link
            to="/forgot-password"
            className="inline-flex items-center justify-center gap-2 w-full py-3.5 bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-bold rounded-2xl shadow-lg"
          >
            Request a New Link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-transparent p-4 relative overflow-hidden">
      <WaterVideoBackground isPublic={true} isTeal={true} />
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
              <WaterLoader message="Updating Password..." size={130} compact />
            </motion.div>
          )}
        </AnimatePresence>

        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white font-bold mb-6 transition-colors text-sm"
        >
          <ArrowLeft size={16} /> Back to Login
        </Link>

        <div className="p-4 bg-gradient-to-br from-teal-500 to-emerald-500 w-fit rounded-2xl text-white mb-6 shadow-lg">
          <Lock size={28} />
        </div>

        <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">Create New Password</h2>
        <p className="text-gray-500 dark:text-gray-400 font-medium mb-8">
          Please enter and confirm your new secure password below.
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

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
              New Password
            </label>
            <div className="relative">
              <input
                type={showNewPwd ? "text" : "password"}
                {...register("newPassword", {
                  required: "Password is required",
                  minLength: { value: 6, message: "Must be at least 6 characters" }
                })}
                className="w-full px-5 py-4 pr-12 rounded-2xl border border-gray-200 dark:border-gray-600 bg-white/90 dark:bg-gray-700/90 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500 transition-all"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowNewPwd(!showNewPwd)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                {showNewPwd ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.newPassword && (
              <p className="text-red-500 text-xs font-semibold mt-1.5">{errors.newPassword.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPwd ? "text" : "password"}
                {...register("confirmPassword", {
                  required: "Please confirm your password",
                  validate: (value) => value === newPassword || "Passwords do not match"
                })}
                className="w-full px-5 py-4 pr-12 rounded-2xl border border-gray-200 dark:border-gray-600 bg-white/90 dark:bg-gray-700/90 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500 transition-all"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPwd(!showConfirmPwd)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                {showConfirmPwd ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-red-500 text-xs font-semibold mt-1.5">{errors.confirmPassword.message}</p>
            )}
          </div>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            type="submit"
            disabled={isLoading}
            className="w-full py-4 mt-2 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white rounded-2xl font-bold text-lg shadow-lg shadow-teal-500/30 flex justify-center items-center gap-2 disabled:opacity-70 transition-all"
          >
            Save New Password
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}