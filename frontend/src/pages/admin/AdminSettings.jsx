import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { Building2, Save, AlertCircle, CheckCircle, Loader2, MapPin, Grid, PlusCircle, Eye } from 'lucide-react';
import WaterLoader from '../../components/WaterLoader';
import api from '../../api/axios';

export default function AdminSettings() {
    const [apartments, setApartments] = useState([]);
    const [selectedApartmentId, setSelectedApartmentId] = useState('');
    const [isCreatingNew, setIsCreatingNew] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [status, setStatus] = useState({ type: '', message: '' });
    const [isSaving, setIsSaving] = useState(false);

    const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm();

    // Fetch all apartments on mount
    const fetchApartments = async (selectId = null) => {
        try {
            setIsLoading(true);
            const response = await api.get('/admin/apartments');
            const list = response.data.data || [];
            setApartments(list);

            if (list.length === 0) {
                setIsCreatingNew(true);
                reset({ name: '', address: '', totalFlats: '', commonAreaSqFt: '' });
            } else {
                const target = selectId ? list.find((a) => a.id === selectId) : list[0];
                if (target) {
                    setSelectedApartmentId(target.id);
                    setIsCreatingNew(false);
                    populateForm(target);
                }
            }
        } catch (err) {
            setStatus({ type: 'error', message: 'Failed to load apartment complexes.' });
        } finally {
            setIsLoading(false);
        }
    };

    const populateForm = (apt) => {
        setValue('name', apt.name || '');
        setValue('address', apt.address || '');
        setValue('totalFlats', apt.totalFlats || '');
        setValue('commonAreaSqFt', apt.commonAreaSqFt || '');
    };

    useEffect(() => {
        fetchApartments();
    }, []);

    const handleSelectChange = (e) => {
        const id = Number(e.target.value);
        setSelectedApartmentId(id);
        setIsCreatingNew(false);
        setStatus({ type: '', message: '' });
        const found = apartments.find((a) => a.id === id);
        if (found) populateForm(found);
    };

    const handleStartCreateNew = () => {
        setIsCreatingNew(true);
        setStatus({ type: '', message: '' });
        reset({ name: '', address: '', totalFlats: '', commonAreaSqFt: '' });
    };

    const onSubmit = async (data) => {
        setIsSaving(true);
        setStatus({ type: '', message: '' });
        try {
            const payload = {
                name: data.name.trim(),
                address: data.address.trim(),
                totalFlats: Number(data.totalFlats),
                commonAreaSqFt: Number(data.commonAreaSqFt)
            };
            const response = await api.post('/admin/apartments', payload);
            const created = response.data.data;
            setStatus({ type: 'success', message: `Apartment "${created.name}" registered successfully!` });
            await fetchApartments(created.id);
        } catch (err) {
            setStatus({ type: 'error', message: err.response?.data?.message || 'Failed to register apartment complex.' });
        } finally {
            setIsSaving(false);
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    if (isLoading)
        return <WaterLoader message="Loading apartment analytics..." />;

    return (
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="max-w-4xl mx-auto space-y-8">
            {/* Header + Apartment Selector / Add New Toggle */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">System Settings</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 text-lg">View existing complexes or register a new apartment property.</p>
                </div>

                <div className="flex items-center gap-3">
                    {apartments.length > 0 && !isCreatingNew && (
                        <div className="flex items-center gap-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl px-4 py-2.5 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
                            <Building2 className="text-blue-600 dark:text-blue-400 shrink-0" size={20} />
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Viewing Complex</span>
                                <select
                                    value={selectedApartmentId}
                                    onChange={handleSelectChange}
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

                    {apartments.length > 0 && (
                        <button
                            type="button"
                            onClick={() => {
                                if (isCreatingNew) {
                                    setIsCreatingNew(false);
                                    const current = apartments.find((a) => a.id === Number(selectedApartmentId)) || apartments[0];
                                    if (current) populateForm(current);
                                } else {
                                    handleStartCreateNew();
                                }
                            }}
                            className="px-4 py-3 rounded-2xl font-bold text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-md flex items-center gap-2 transition-all"
                        >
                            {isCreatingNew ? <><Eye size={18} /> View Existing</> : <><PlusCircle size={18} /> Add New Complex</>}
                        </button>
                    )}
                </div>
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

            <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl p-8 rounded-3xl shadow-lg border border-white/20 dark:border-gray-700">
                <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-xl"><Building2 size={24} /></div>
                    <div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                            {isCreatingNew ? 'Register New Apartment Complex' : 'Complex Details'}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            {isCreatingNew ? 'Fill in the details below to onboard a new complex.' : 'Registered configuration for the selected complex.'}
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2"><Building2 size={16} /> Apartment Name</label>
                            <input type="text" placeholder="e.g. Green Valley Heights" {...register("name", { required: "Name is required" })} disabled={!isCreatingNew}
                                className="w-full p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60" />
                            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2"><MapPin size={16} /> Full Address</label>
                            <input type="text" placeholder="e.g. 123 Main Street" {...register("address", { required: "Address is required" })} disabled={!isCreatingNew}
                                className="w-full p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60" />
                            {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address.message}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2"><Grid size={16} /> Total Number of Flats</label>
                            <input type="number" placeholder="e.g. 50" {...register("totalFlats", { required: true, min: 1 })} disabled={!isCreatingNew}
                                className="w-full p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60" />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2"><Grid size={16} /> Common Area (Sq Ft)</label>
                            <input type="number" step="0.01" placeholder="e.g. 2500" {...register("commonAreaSqFt", { required: true })} disabled={!isCreatingNew}
                                className="w-full p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60" />
                        </div>
                    </div>

                    {isCreatingNew && (
                        <button type="submit" disabled={isSaving} className="mt-8 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex gap-2 items-center shadow-lg shadow-blue-500/30 disabled:opacity-50">
                            {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />} Register Complex
                        </button>
                    )}
                </form>
            </div>
        </motion.div>
    );
}