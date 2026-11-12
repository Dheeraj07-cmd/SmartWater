import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Droplets, Activity, ShieldCheck, Leaf, FileText, TrendingUp, Users, Building2, CheckCircle2, ArrowRight, BarChart3, Gauge, LifeBuoy } from 'lucide-react';
import FloatingThemeToggle from '../components/FloatingThemeToggle';
import WaterVideoBackground from '../components/WaterVideoBackground';

export default function LandingPage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { y: 25, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100, damping: 14 } }
  };

  const coreFeatures = [
    {
      icon: Gauge,
      title: 'Smart Meter Telemetry',
      desc: 'Ingest daily household water readings via automated virtual IoT meters, bulk CSV uploads, or manual logs.',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: ShieldCheck,
      title: '2σ Leak & Outlier Detection',
      desc: 'Automated nightly scans flag consumption spikes exceeding 2 standard deviations and trigger instant email alerts.',
      color: 'from-red-500 to-orange-500'
    },
    {
      icon: FileText,
      title: 'Tiered Billing & PDF Invoices',
      desc: 'Calculate multi-tier consumption slabs, split shared water tanker costs fairly, and generate downloadable PDF bills.',
      color: 'from-teal-500 to-emerald-500'
    },
    {
      icon: TrendingUp,
      title: 'Tariff Revenue Forecaster',
      desc: 'Simulate hypothetical tariff rate adjustments against historical apartment usage before applying new pricing plans.',
      color: 'from-indigo-500 to-purple-500'
    },
    {
      icon: BarChart3,
      title: 'Peer Benchmarking Hub',
      desc: 'Empower residents to compare their monthly usage against the complex average and top 10% most efficient flats.',
      color: 'from-amber-500 to-yellow-500'
    },
    {
      icon: LifeBuoy,
      title: 'Helpdesk & Community Board',
      desc: 'Streamline maintenance with built-in resident support ticketing for meter faults, leak reports, and complex notices.',
      color: 'from-pink-500 to-rose-500'
    }
  ];

  const workflowSteps = [
    {
      step: '01',
      title: 'Onboard Complex & Flats',
      desc: 'Register your apartment complex, add household units, assign residents by name, and activate virtual or physical water meters.'
    },
    {
      step: '02',
      title: 'Track Usage & Catch Leaks',
      desc: 'Monitor real-time consumption trends across every floor while the anomaly engine watches for silent toilet or pipe leaks 24/7.'
    },
    {
      step: '03',
      title: 'Automate Fair Billing',
      desc: 'Log shared bulk tanker purchases, close the monthly billing cycle in one click, and distribute itemized PDF statements.'
    }
  ];

  return (
    <div className="min-h-screen bg-transparent transition-colors duration-700 flex flex-col font-sans relative overflow-x-hidden">
      {/* Ocean Wave Video Background */}
      <WaterVideoBackground isPublic={true} isTeal={false} />

      <FloatingThemeToggle />

      {/* Navbar */}
      <motion.nav
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full bg-white/75 dark:bg-gray-900/75 backdrop-blur-xl shadow-sm border-b border-gray-200/50 dark:border-gray-800/60 px-6 sm:px-12 py-4 flex justify-between items-center fixed top-0 z-50 transition-colors"
      >
        <div className="flex items-center gap-2.5 text-blue-600 dark:text-blue-400">
          <Droplets size={30} className="shrink-0" />
          <span className="text-2xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">
            SmartWater
          </span>
        </div>

        <div className="hidden md:flex items-center gap-8 text-sm font-bold text-gray-700 dark:text-gray-200">
          <a href="#features" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Features</a>
          <a href="#workflow" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">How It Works</a>
          <a href="#portals" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Portals</a>
        </div>

        <div className="flex gap-3 sm:gap-4">
          <Link to="/login">
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className="px-5 py-2.5 text-blue-600 dark:text-blue-400 font-bold hover:bg-blue-100/70 dark:hover:bg-gray-800 rounded-xl transition-colors"
            >
              Login
            </motion.button>
          </Link>
          <Link to="/register">
            <motion.button
              whileHover={{ scale: 1.04, boxShadow: '0px 10px 25px rgba(59, 130, 246, 0.35)' }}
              whileTap={{ scale: 0.96 }}
              className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold rounded-xl shadow-md transition-all"
            >
              Register
            </motion.button>
          </Link>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <main className="flex-grow pt-32 pb-20 px-6 relative z-10">
        <motion.div
          className="max-w-6xl mx-auto text-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div
            variants={itemVariants}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/85 dark:bg-gray-800/85 backdrop-blur-md shadow-sm border border-blue-200 dark:border-gray-700 text-blue-600 dark:text-blue-400 text-sm font-bold mb-8"
          >
            <Leaf size={16} className="text-green-500" /> Sustainable Multi-Family Water Management
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="text-5xl sm:text-6xl md:text-7xl font-extrabold text-gray-900 dark:text-white mb-6 leading-tight tracking-tight drop-shadow-sm"
          >
            Intelligent Water <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-500">
              Monitoring & Billing Platform
            </span>
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="text-lg sm:text-xl text-gray-800 dark:text-gray-200 font-medium mb-10 max-w-3xl mx-auto leading-relaxed"
          >
            Eliminate flat-rate billing disputes and hidden plumbing leaks. Track daily sub-metered consumption, reconcile shared tanker expenses, and empower residents with real-time conservation insights.
          </motion.p>

          {/* Hero CTA Buttons */}
          <motion.div variants={itemVariants} className="flex flex-wrap justify-center gap-4 mb-16">
            <Link to="/register">
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-extrabold rounded-2xl shadow-xl shadow-blue-500/30 flex items-center gap-2 text-lg"
              >
                Get Started Now <ArrowRight size={20} />
              </motion.button>
            </Link>
            <Link to="/login">
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className="px-8 py-4 bg-white/85 dark:bg-gray-800/85 backdrop-blur-md text-gray-900 dark:text-white font-bold rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 text-lg hover:bg-white dark:hover:bg-gray-700 transition-all"
              >
                Access Portal
              </motion.button>
            </Link>
          </motion.div>

          {/* Quick Highlight Pills */}
          <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {[
              { label: 'Leak Detection', value: '2σ Outlier Scan', icon: Activity, color: 'text-red-500' },
              { label: 'Billing Engine', value: '3-Tier Tariffs', icon: FileText, color: 'text-blue-500' },
              { label: 'Shared Tankers', value: '100% Reconciled', icon: Droplets, color: 'text-cyan-500' },
              { label: 'Conservation', value: 'Peer Benchmarks', icon: Leaf, color: 'text-emerald-500' }
            ].map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <div
                  key={idx}
                  className="p-5 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-md border border-white/40 dark:border-gray-700 flex flex-col items-center text-center"
                >
                  <Icon size={26} className={`${stat.color} mb-2`} />
                  <p className="text-lg font-extrabold text-gray-900 dark:text-white">{stat.value}</p>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mt-0.5">
                    {stat.label}
                  </p>
                </div>
              );
            })}
          </motion.div>
        </motion.div>

        {/* Core Features Grid */}
        <section id="features" className="max-w-6xl mx-auto mt-28">
          <div className="text-center mb-14">
            <span className="text-xs font-extrabold uppercase tracking-widest text-blue-600 dark:text-blue-400 bg-blue-100/90 dark:bg-blue-900/60 px-3.5 py-1.5 rounded-full">
              Platform Capabilities
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white mt-4">
              Everything Needed to Manage Community Water
            </h2>
            <p className="text-gray-700 dark:text-gray-300 font-medium mt-2 max-w-2xl mx-auto">
              Built for modern apartment associations to automate metering, billing, and proactive leak prevention.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {coreFeatures.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <motion.div
                  key={idx}
                  whileHover={{ y: -6 }}
                  className="p-7 bg-white/75 dark:bg-gray-800/75 backdrop-blur-xl rounded-3xl shadow-lg border border-white/40 dark:border-gray-700 flex flex-col justify-between"
                >
                  <div>
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${feat.color} text-white flex items-center justify-center shadow-md mb-5`}>
                      <Icon size={24} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{feat.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{feat.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* 3-Step Workflow Section */}
        <section id="workflow" className="max-w-6xl mx-auto mt-28">
          <div className="text-center mb-14">
            <span className="text-xs font-extrabold uppercase tracking-widest text-teal-700 dark:text-teal-300 bg-teal-100/90 dark:bg-teal-900/60 px-3.5 py-1.5 rounded-full">
              Simple Workflow
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white mt-4">
              How SmartWater Works
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {workflowSteps.map((item, idx) => (
              <div
                key={idx}
                className="relative p-8 bg-white/75 dark:bg-gray-800/75 backdrop-blur-xl rounded-3xl shadow-lg border border-white/40 dark:border-gray-700"
              >
                <span className="text-5xl font-black text-blue-600/15 dark:text-blue-400/15 absolute top-6 right-6 select-none">
                  {item.step}
                </span>
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-extrabold flex items-center justify-center text-sm mb-5 shadow-md">
                  {item.step}
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{item.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="portals" className="max-w-6xl mx-auto mt-28">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Admin Portal Card */}
            <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-gray-900/95 to-blue-950/95 backdrop-blur-xl text-white shadow-xl border border-gray-800 flex flex-col justify-between">
              <div>
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-bold uppercase tracking-wider mb-6">
                  <Building2 size={14} /> For Property Admins
                </div>
                <h3 className="text-3xl font-extrabold mb-4">Executive Command Center</h3>
                <p className="text-gray-300 text-sm leading-relaxed mb-6">
                  Full visibility into apartment-wide consumption, meter health statuses, financial reconciliation, and resident helpdesk requests.
                </p>
                <ul className="space-y-3 text-sm text-gray-200">
                  {[
                    'Interactive Meter Health Map (Healthy, Warning, Offline)',
                    'Financial Reconciliation Pie Chart for Bulk Tanker Purchases',
                    'Active Anomaly & Leak Command Table with Read-Receipts',
                    'Scenario Forecaster for Tiered Tariff Rate Planning'
                  ].map((point, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <CheckCircle2 size={18} className="text-cyan-400 shrink-0" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-8 pt-6 border-t border-white/10">
                <Link to="/login" className="inline-flex items-center gap-2 text-sm font-bold text-cyan-400 hover:underline">
                  Launch Admin Dashboard <ArrowRight size={16} />
                </Link>
              </div>
            </div>

            {/* Resident Portal Card */}
            <div className="p-8 sm:p-10 rounded-3xl bg-white/85 dark:bg-gray-800/85 backdrop-blur-xl text-gray-900 dark:text-white shadow-xl border border-white/40 dark:border-gray-700 flex flex-col justify-between">
              <div>
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-500/15 text-teal-700 dark:text-teal-300 text-xs font-bold uppercase tracking-wider mb-6">
                  <Users size={14} /> For Residents
                </div>
                <h3 className="text-3xl font-extrabold mb-4">Transparent Household Portal</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-6">
                  Empower every household to track their daily water usage, set monthly saving goals, and download itemized bills with zero surprises.
                </p>
                <ul className="space-y-3 text-sm text-gray-700 dark:text-gray-200">
                  {[
                    '30-Day, 90-Day & Annual Interactive Consumption Charts',
                    'Itemized Metered vs. Shared Area Cost Breakdown & PDF Bills',
                    'Monthly Consumption Goal Slider & Actionable Saving Habits',
                    'Instant Leak Warnings with Recommended Maintenance Steps'
                  ].map((point, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <CheckCircle2 size={18} className="text-teal-500 shrink-0" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <Link to="/register" className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline">
                  Create Resident Account <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-gray-200/70 dark:border-gray-800 bg-white/65 dark:bg-gray-900/65 backdrop-blur-md py-8 px-6 relative z-10">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-2 font-bold text-gray-900 dark:text-gray-200">
            <Droplets size={20} className="text-blue-600 dark:text-blue-400" />
            <span>SmartWater Management Platform</span>
          </div>
          <p>© {new Date().getFullYear()} SmartWater. Built for sustainable apartment communities.</p>
        </div>
      </footer>
    </div>
  );
}