import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, Droplets, AlertCircle, Eye, EyeOff, FileText, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import api from '../api/axios';
import WaterLoader from '../components/WaterLoader';
import FloatingThemeToggle from '../components/FloatingThemeToggle';
import WaterVideoBackground from '../components/WaterVideoBackground';

export default function Register() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [serverError, setServerError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleStandardRegister = async (data) => {
    try {
      setIsLoading(true);
      setServerError('');
      const payload = {
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        email: data.email.trim(),
        password: data.password
      };
      const response = await api.post('/auth/register', payload);
      handleAuthSuccess(response.data.data);
    } catch (err) {
      setServerError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setIsLoading(true);
      setServerError('');
      const response = await api.post('/auth/google', {
        idToken: credentialResponse.credential
      });
      handleAuthSuccess(response.data.data);
    } catch (err) {
      setServerError(err.response?.data?.message || 'Google Registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthSuccess = (authData) => {
    const displayName =
      authData?.userName ||
      authData?.firstName ||
      authData?.email?.split('@')[0] ||
      'User';

    localStorage.removeItem('user_photo');
    localStorage.setItem('jwt_token', authData.token);
    localStorage.setItem('user_role', authData.role);
    localStorage.setItem('user_name', displayName);

    navigate(authData.role === 'ROLE_ADMIN' ? '/admin/dashboard' : '/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-transparent transition-colors p-4 sm:p-8 relative overflow-hidden">
      <WaterVideoBackground isPublic={true} isTeal={true} />
      <FloatingThemeToggle />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-5xl w-full bg-white/85 dark:bg-gray-800/85 backdrop-blur-xl border border-white/40 dark:border-gray-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row-reverse relative z-10"
      >
        {/* Right Side: Form */}
        <div className="w-full md:w-1/2 p-8 sm:p-12 flex flex-col justify-center">
          <div className="mb-8">
            <Link to="/" className="inline-flex items-center gap-2 text-teal-600 dark:text-teal-400 mb-6 hover:opacity-80 transition-opacity">
              <Droplets size={26} />
              <span className="text-xl font-extrabold text-gray-900 dark:text-white">SmartWater</span>
            </Link>
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">Create Account</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2">Join the SmartWater community today.</p>
          </div>

          {serverError && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 text-red-700 dark:text-red-400 text-sm font-medium flex items-center gap-3 rounded-r-lg"
            >
              <AlertCircle size={20} className="shrink-0" /> {serverError}
            </motion.div>
          )}

          <form onSubmit={handleSubmit(handleStandardRegister)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">First Name</label>
                <input
                  type="text"
                  placeholder="John"
                  {...register("firstName", { required: "First name is required" })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white/90 dark:bg-gray-700/90 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                />
                {errors.firstName && <p className="text-red-500 text-xs font-semibold mt-1">{errors.firstName.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">Last Name</label>
                <input
                  type="text"
                  placeholder="Doe"
                  {...register("lastName", { required: "Last name is required" })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white/90 dark:bg-gray-700/90 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                />
                {errors.lastName && <p className="text-red-500 text-xs font-semibold mt-1">{errors.lastName.message}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">Email Address</label>
              <input
                type="email"
                placeholder="you@example.com"
                {...register("email", { required: "Email is required" })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white/90 dark:bg-gray-700/90 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none transition-all"
              />
              {errors.email && <p className="text-red-500 text-xs font-semibold mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="At least 6 characters"
                  {...register("password", {
                    required: "Password is required",
                    minLength: { value: 6, message: "Password must be at least 6 characters" }
                  })}
                  className="w-full px-4 py-3 pr-11 rounded-xl border border-gray-200 dark:border-gray-600 bg-white/90 dark:bg-gray-700/90 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs font-semibold mt-1">{errors.password.message}</p>}
            </div>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-4 mt-2 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-teal-500/25 disabled:opacity-70 transition-all"
            >
              {isLoading ? (
                <WaterLoader message="Creating Account..." />
              ) : (
                <><UserPlus size={20} /> Register</>
              )}
            </motion.button>
          </form>

          <div className="mt-8 flex items-center justify-between mb-6">
            <span className="border-b border-gray-200 dark:border-gray-700 w-1/4"></span>
            <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold">Or register with</span>
            <span className="border-b border-gray-200 dark:border-gray-700 w-1/4"></span>
          </div>

          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setServerError('Google Auth popup closed or failed.')}
              shape="rectangular"
              size="large"
              text="signup_with"
            />
          </div>

          <p className="mt-8 text-center text-gray-600 dark:text-gray-400 text-sm">
            Already have an account?{' '}
            <Link to="/login" className="text-teal-600 dark:text-teal-400 font-bold hover:underline">
              Sign in
            </Link>
          </p>
        </div>

        {/* Left Side: Enhanced Interactive Animated Panel */}
        <div className="hidden md:flex w-1/2 bg-gradient-to-br from-teal-600/90 via-emerald-600/90 to-green-500/90 p-10 lg:p-12 flex-col justify-between relative overflow-hidden text-white">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
            className="absolute -top-20 -left-20 opacity-10 w-96 h-96 border-[40px] border-white rounded-full pointer-events-none"
          />

          <div className="relative z-10 mt-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-sm font-semibold mb-6 shadow-sm">
              <Sparkles size={16} className="text-emerald-200" /> Join Smart Community
            </div>
            <h3 className="text-3xl lg:text-4xl font-extrabold leading-tight mb-3">
              Start Your <br />Journey.
            </h3>
            <p className="text-teal-50 text-sm lg:text-base max-w-sm leading-relaxed">
              Registering takes less than a minute. Once approved, you'll be assigned to your household meter instantly.
            </p>
          </div>

          {/* Interactive Benefits Cards */}
          <div className="relative z-10 space-y-3 my-6">
            {[
              { icon: CheckCircle2, title: 'Instant Meter Mapping', desc: 'Auto-linked to your flat and water meter' },
              { icon: FileText, title: 'Itemized PDF Invoices', desc: 'Download monthly bills with zero discrepancies' },
              { icon: ShieldCheck, title: 'Eco Conservation Hub', desc: 'Compare usage metrics & set monthly targets' }
            ].map((benefit, idx) => {
              const Icon = benefit.icon;
              return (
                <motion.div
                  key={idx}
                  whileHover={{ x: 6, backgroundColor: 'rgba(255, 255, 255, 0.18)' }}
                  className="flex items-center gap-3.5 p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 transition-all"
                >
                  <div className="p-2.5 rounded-xl bg-white/20 text-emerald-200">
                    <Icon size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold">{benefit.title}</h4>
                    <p className="text-xs text-teal-100 opacity-90">{benefit.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <div className="relative z-10 text-xs font-semibold text-teal-200 tracking-wider uppercase">
            Sustainable Living &bull; Smart Meters
          </div>
        </div>
      </motion.div>
    </div>
  );
}