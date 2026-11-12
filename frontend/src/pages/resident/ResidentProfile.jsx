import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { Camera, Save, Lock, CheckCircle, AlertCircle, Loader2, Trash2, AlertTriangle } from 'lucide-react';
import WaterLoader from '../../components/WaterLoader';
import api from '../../api/axios';

export default function ResidentProfile() {
    const [profile, setProfile] = useState(null);
    const [status, setStatus] = useState({ type: '', message: '' });
    const [pwdStatus, setPwdStatus] = useState({ type: '', message: '' });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isChangingPwd, setIsChangingPwd] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const fileInputRef = useRef(null);
    const navigate = useNavigate();

    const { register: regProfile, handleSubmit: submitProfile, setValue } = useForm();
    const { register: regPwd, handleSubmit: submitPwd, reset: resetPwd, formState: { errors: pwdErrors } } = useForm();

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await api.get('/resident/profile');
                const data = res.data?.data;
                setProfile(data);
                setValue("phoneNumber", data?.phoneNumber || "");
                if (data?.profilePhotoUrl) {
                    localStorage.setItem('user_photo', data.profilePhotoUrl);
                }
            } catch (err) {
                setStatus({ type: 'error', message: 'Failed to load profile.' });
            } finally {
                setIsLoading(false);
            }
        };
        fetchProfile();
    }, [setValue]);

    useEffect(() => {
        return () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
        };
    }, [previewUrl]);

    const handlePhotoSelect = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const onProfileSave = async (data) => {
        setIsSaving(true);
        setStatus({ type: '', message: '' });

        const formData = new FormData();
        if (data.phoneNumber !== undefined) {
            formData.append('phoneNumber', data.phoneNumber);
        }
        if (selectedFile) {
            formData.append('profilePhoto', selectedFile);
        }

        try {
            const res = await api.patch('/resident/profile', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            const updatedProfile = res.data?.data;
            setStatus({ type: 'success', message: 'Profile updated successfully!' });

            if (updatedProfile?.profilePhotoUrl) {
                localStorage.setItem('user_photo', updatedProfile.profilePhotoUrl);
            }

            setSelectedFile(null);
            setPreviewUrl(null);
            setProfile(updatedProfile);
        } catch (err) {
            setStatus({ type: 'error', message: 'Update failed: ' + (err.response?.data?.message || 'Unknown error') });
        } finally {
            setIsSaving(false);
        }
    };

    const onPasswordChange = async (data) => {
        setIsChangingPwd(true);
        setPwdStatus({ type: '', message: '' });
        try {
            await api.post('/resident/change-password', {
                oldPassword: data.oldPassword,
                newPassword: data.newPassword
            });
            setPwdStatus({ type: 'success', message: 'Password changed successfully!' });
            resetPwd();
        } catch (err) {
            setPwdStatus({ type: 'error', message: err.response?.data?.message || 'Password change failed.' });
        } finally {
            setIsChangingPwd(false);
        }
    };

    const handleDeleteAccount = async () => {
        setIsDeleting(true);
        setStatus({ type: '', message: '' });
        try {
            await api.delete('/resident/profile');
            localStorage.clear();
            navigate('/login');
        } catch (err) {
            setStatus({
                type: 'error',
                message: err.response?.data?.message || 'Failed to delete account.'
            });
            setIsDeleting(false);
            setShowDeleteConfirm(false);
        }
    };

    if (isLoading) {
        return <WaterLoader message="Loading your profile..." />;
    }

    const displayImage = previewUrl || profile?.profilePhotoUrl;

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto space-y-8">
            <div>
                <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white">Account Settings</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-2">Manage your personal information, profile photo, and security.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-6">
                    {/* Personal Info Card */}
                    <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl p-8 rounded-3xl shadow-lg border border-white/20 dark:border-gray-700">
                        <form onSubmit={submitProfile(onProfileSave)}>
                            <h3 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Personal Info</h3>

                            {status.message && (
                                <div className={`p-4 mb-6 rounded-xl flex items-center gap-3 font-semibold ${status.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {status.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />} {status.message}
                                </div>
                            )}

                            <div className="flex items-center gap-6 mb-8">
                                <div className="relative">
                                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-3xl font-bold shadow-lg overflow-hidden border-4 border-white dark:border-gray-800">
                                        {displayImage ? (
                                            <img src={displayImage} alt="Profile" className="w-full h-full object-cover" />
                                        ) : (
                                            profile?.firstName?.charAt(0) || 'U'
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition"
                                    >
                                        <Camera size={16} />
                                    </button>
                                    <input type="file" accept="image/*" ref={fileInputRef} onChange={handlePhotoSelect} className="hidden" />
                                </div>
                                <div>
                                    <h4 className="text-xl font-bold text-gray-900 dark:text-white">{profile?.firstName} {profile?.lastName}</h4>
                                    <p className="text-gray-500 dark:text-gray-400">{profile?.email}</p>
                                    {selectedFile && (
                                        <p className="text-xs text-blue-600 dark:text-blue-400 font-bold mt-1">
                                            New photo selected: {selectedFile.name} (Click Save Changes)
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Phone Number</label>
                                    <input
                                        type="text"
                                        {...regProfile("phoneNumber")}
                                        className="w-full p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="+91 9876543210"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Apartment</label>
                                        <input
                                            type="text"
                                            value={profile?.apartmentName || 'Unassigned'}
                                            disabled
                                            className="w-full p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-500 cursor-not-allowed"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Flat Number</label>
                                        <input
                                            type="text"
                                            value={profile?.flatNumber || 'Unassigned'}
                                            disabled
                                            className="w-full p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-500 cursor-not-allowed"
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isSaving}
                                className="mt-8 px-8 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 disabled:opacity-50 flex gap-2 items-center"
                            >
                                {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />} Save Changes
                            </button>
                        </form>
                    </div>

                    {/* Danger Zone: Delete Account */}
                    <div className="bg-red-50/80 dark:bg-red-950/30 backdrop-blur-xl p-8 rounded-3xl shadow-lg border border-red-200 dark:border-red-800/60">
                        <div className="flex items-start justify-between gap-4 flex-col sm:flex-row sm:items-center">
                            <div>
                                <h3 className="text-xl font-extrabold text-red-700 dark:text-red-400 flex items-center gap-2">
                                    <AlertTriangle size={22} /> Danger Zone
                                </h3>
                                <p className="text-sm text-red-600/80 dark:text-red-300/80 mt-1">
                                    Permanently delete your resident account and unlink your profile from your flat.
                                </p>
                            </div>

                            {!showDeleteConfirm && (
                                <button
                                    type="button"
                                    onClick={() => setShowDeleteConfirm(true)}
                                    className="px-5 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-md flex items-center gap-2 shrink-0 transition-colors"
                                >
                                    <Trash2 size={18} /> Delete Account
                                </button>
                            )}
                        </div>

                        <AnimatePresence>
                            {showDeleteConfirm && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="mt-5 pt-5 border-t border-red-200 dark:border-red-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                                >
                                    <p className="text-sm font-bold text-red-800 dark:text-red-200">
                                        Are you sure? This action cannot be undone.
                                    </p>
                                    <div className="flex items-center gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setShowDeleteConfirm(false)}
                                            disabled={isDeleting}
                                            className="px-4 py-2.5 rounded-xl bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-bold text-sm border border-gray-200 dark:border-gray-700"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleDeleteAccount}
                                            disabled={isDeleting}
                                            className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm flex items-center gap-2 shadow-md disabled:opacity-50"
                                        >
                                            {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                                            Yes, Delete Permanently
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Security / Password Card */}
                <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl p-8 rounded-3xl shadow-lg border border-white/20 dark:border-gray-700 h-fit">
                    <h3 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white flex items-center gap-2">
                        <Lock size={24} className="text-blue-500" /> Security
                    </h3>

                    {pwdStatus.message && (
                        <div className={`p-4 mb-6 rounded-xl flex items-center gap-3 font-semibold ${pwdStatus.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {pwdStatus.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />} {pwdStatus.message}
                        </div>
                    )}

                    <form onSubmit={submitPwd(onPasswordChange)} className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Current Password</label>
                            <input
                                type="password"
                                {...regPwd("oldPassword", { required: "Current password is required" })}
                                className="w-full p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            {pwdErrors.oldPassword && <p className="text-red-500 text-xs font-semibold mt-1">{pwdErrors.oldPassword.message}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">New Password</label>
                            <input
                                type="password"
                                {...regPwd("newPassword", {
                                    required: "New password is required",
                                    minLength: { value: 6, message: "Must be at least 6 characters" }
                                })}
                                className="w-full p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            {pwdErrors.newPassword && <p className="text-red-500 text-xs font-semibold mt-1">{pwdErrors.newPassword.message}</p>}
                        </div>
                        <button
                            type="submit"
                            disabled={isChangingPwd}
                            className="w-full py-4 mt-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-xl shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isChangingPwd ? <Loader2 className="animate-spin" size={18} /> : null}
                            Update Password
                        </button>
                    </form>
                </div>
            </div>
        </motion.div>
    );
}