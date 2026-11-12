import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users, Home, Activity, CheckCircle, AlertCircle, Loader2, Save, PlusCircle, Building2, Search, UserMinus, Mail, Phone
} from 'lucide-react';
import WaterLoader from '../../components/WaterLoader';
import api from '../../api/axios';

export default function AdminHouseholds() {
    const [activeTab, setActiveTab] = useState('flats');
    const [apartments, setApartments] = useState([]);
    const [selectedApartmentId, setSelectedApartmentId] = useState('');
    const [households, setHouseholds] = useState([]);
    const [unassignedResidents, setUnassignedResidents] = useState([]);
    const [allResidents, setAllResidents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [status, setStatus] = useState({ type: '', message: '' });
    const [processingId, setProcessingId] = useState(null);

    // Per-card search & selection state for assigning residents
    const [searchQueries, setSearchQueries] = useState({});
    const [selectedResidents, setSelectedResidents] = useState({});
    const [openDropdownId, setOpenDropdownId] = useState(null);

    // Residents Directory search & filter state
    const [residentSearch, setResidentSearch] = useState('');
    const [residentFilter, setResidentFilter] = useState('ALL'); // 'ALL' | 'ASSIGNED' | 'UNASSIGNED'

    // Load Apartments on mount
    useEffect(() => {
        const fetchApartments = async () => {
            try {
                const res = await api.get('/admin/apartments');
                const list = res.data.data || [];
                setApartments(list);
                if (list.length > 0) {
                    setSelectedApartmentId(list[0].id);
                } else {
                    setIsLoading(false);
                }
            } catch (err) {
                setStatus({ type: 'error', message: 'Failed to load apartments.' });
                setIsLoading(false);
            }
        };
        fetchApartments();
    }, []);

    // Load Households, Unassigned Residents, and All Residents Directory
    const fetchHouseholdData = async (aptId = selectedApartmentId) => {
        if (!aptId) return;
        try {
            setIsLoading(true);
            const [householdsRes, unassignedRes, allRes] = await Promise.all([
                api.get(`/admin/apartments/${aptId}/households`),
                api.get('/admin/unassigned-residents'),
                api.get('/admin/residents')
            ]);
            setHouseholds(householdsRes.data.data || []);
            setUnassignedResidents(unassignedRes.data.data || []);
            setAllResidents(allRes.data.data || []);
        } catch (err) {
            setStatus({ type: 'error', message: 'Failed to load household or resident data.' });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (selectedApartmentId) {
            fetchHouseholdData(selectedApartmentId);
        }
    }, [selectedApartmentId]);

    const onAssignResident = async (householdId, flatNumber) => {
        const resident = selectedResidents[householdId];
        if (!resident) {
            setStatus({ type: 'error', message: `Please select a resident from the list for Flat ${flatNumber}.` });
            return;
        }

        setProcessingId(`resident-${householdId}`);
        setStatus({ type: '', message: '' });
        try {
            await api.patch(`/admin/households/${householdId}/assign-resident/${resident.id}`);
            setStatus({ type: 'success', message: `${resident.firstName} ${resident.lastName} assigned to Flat ${flatNumber}!` });
            setSelectedResidents((prev) => ({ ...prev, [householdId]: null }));
            setSearchQueries((prev) => ({ ...prev, [household.id]: '' }));
            fetchHouseholdData(selectedApartmentId);
        } catch (err) {
            setStatus({ type: 'error', message: err.response?.data?.message || 'Failed to assign resident.' });
        } finally {
            setProcessingId(null);
        }
    };

    const onUnassignResident = async (householdId, flatNumber, residentName) => {
        setProcessingId(`unassign-${householdId}`);
        setStatus({ type: '', message: '' });
        try {
            await api.patch(`/admin/households/${householdId}/unassign-resident`);
            setStatus({
                type: 'success',
                message: `${residentName || 'Resident'} removed from Flat ${flatNumber}.`
            });
            fetchHouseholdData(selectedApartmentId);
        } catch (err) {
            setStatus({
                type: 'error',
                message: err.response?.data?.message || 'Failed to remove resident from flat.'
            });
        } finally {
            setProcessingId(null);
        }
    };

    const onCreateMeter = async (householdId, flatNumber) => {
        setProcessingId(`meter-${householdId}`);
        setStatus({ type: '', message: '' });
        const payload = {
            meterNumber: `V-MTR-${selectedApartmentId}-${flatNumber}`,
            installationDate: new Date().toISOString().split('T')[0],
            isVirtual: true,
            householdId: householdId
        };
        try {
            await api.post('/admin/meters', payload);
            setStatus({ type: 'success', message: `Virtual Meter created for Flat ${flatNumber}!` });
            fetchHouseholdData(selectedApartmentId);
        } catch (err) {
            setStatus({ type: 'error', message: err.response?.data?.message || 'Failed to create meter.' });
        } finally {
            setProcessingId(null);
        }
    };

    if (isLoading) {
        return <WaterLoader message="Loading Household & Resident Directory..." />;
    }

    const filteredDirectory = allResidents.filter((r) => {
        const isAssigned = Boolean(r.flatNumber);
        const matchesFilter =
            residentFilter === 'ALL' ||
            (residentFilter === 'ASSIGNED' && isAssigned) ||
            (residentFilter === 'UNASSIGNED' && !isAssigned);

        const matchesSearch = `${r.firstName} ${r.lastName} ${r.email} ${r.flatNumber || ''} ${r.apartmentName || ''}`
            .toLowerCase()
            .includes(residentSearch.toLowerCase());

        return matchesFilter && matchesSearch;
    });

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            {/* Header + Mode Switcher + Apartment Selector */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">Household Manager</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 text-lg">
                        Assign or remove residents from flats, view the residents directory, and configure meters.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {/* Tab Switcher */}
                    <div className="flex bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl p-1.5 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
                        <button
                            type="button"
                            onClick={() => { setActiveTab('flats'); setStatus({ type: '', message: '' }); }}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'flats'
                                    ? 'bg-blue-600 text-white shadow-md'
                                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}
                        >
                            <Home size={17} /> Flats ({households.length})
                        </button>
                        <button
                            type="button"
                            onClick={() => { setActiveTab('residents'); setStatus({ type: '', message: '' }); }}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'residents'
                                    ? 'bg-blue-600 text-white shadow-md'
                                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}
                        >
                            <Users size={17} /> Residents List ({allResidents.length})
                        </button>
                    </div>

                    {apartments.length > 0 && activeTab === 'flats' && (
                        <div className="flex items-center gap-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl px-4 py-2 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
                            <Building2 className="text-blue-600 dark:text-blue-400 shrink-0" size={20} />
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Apartment Complex</span>
                                <select
                                    value={selectedApartmentId}
                                    onChange={(e) => setSelectedApartmentId(Number(e.target.value))}
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
                </div>
            </div>

            <AnimatePresence>
                {status.message && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className={`p-4 rounded-xl flex items-center gap-3 font-semibold shadow-sm ${status.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}
                    >
                        {status.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />} {status.message}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* TAB 1: FLATS & METERS */}
            {activeTab === 'flats' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {households.length === 0 ? (
                        <div className="lg:col-span-2 p-12 text-center text-gray-500 bg-white/60 dark:bg-gray-800/60 rounded-3xl border border-gray-200 dark:border-gray-700">
                            <Home className="mx-auto mb-4 opacity-50" size={48} />
                            <p className="text-lg font-medium">No households found for this complex. Add flats in Data Ingestion first.</p>
                        </div>
                    ) : (
                        households.map((household) => {
                            const query = searchQueries[household.id] || '';
                            const filteredResidents = unassignedResidents.filter((r) =>
                                `${r.firstName} ${r.lastName} ${r.email}`.toLowerCase().includes(query.toLowerCase())
                            );

                            return (
                                <motion.div
                                    key={household.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl p-6 rounded-3xl shadow-lg border border-white/20 dark:border-gray-700 space-y-4"
                                >
                                    <div className="flex justify-between items-start border-b border-gray-100 dark:border-gray-700 pb-4">
                                        <div>
                                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                                <Home className="text-blue-500" size={20} /> Flat {household.flatNumber}
                                            </h3>
                                            <p className="text-sm text-gray-500 font-medium mt-1">
                                                Floor: {household.floor} | {household.areaSqFt} SqFt | Occupants: {household.occupantsCount}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Resident Assignment & Unassign Section */}
                                    <div className="pt-2 relative">
                                        <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                                            <Users size={16} /> Resident Status
                                        </h4>

                                        {household.residentId ? (
                                            <div className="p-3.5 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl flex items-center justify-between gap-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0">
                                                        {household.residentName?.charAt(0) || 'R'}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-gray-900 dark:text-white">{household.residentName}</p>
                                                        <p className="text-xs text-green-600 dark:text-green-400 font-semibold">Assigned Resident</p>
                                                    </div>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() => onUnassignResident(household.id, household.flatNumber, household.residentName)}
                                                    disabled={processingId === `unassign-${household.id}`}
                                                    className="px-3 py-2 rounded-xl bg-red-100 hover:bg-red-200 dark:bg-red-900/40 dark:hover:bg-red-900/60 text-red-700 dark:text-red-300 text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0 disabled:opacity-50"
                                                >
                                                    {processingId === `unassign-${household.id}` ? (
                                                        <Loader2 size={14} className="animate-spin" />
                                                    ) : (
                                                        <UserMinus size={14} />
                                                    )}
                                                    Remove
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="relative">
                                                <div className="flex gap-2">
                                                    <div className="relative flex-1">
                                                        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                                        <input
                                                            type="text"
                                                            placeholder={unassignedResidents.length > 0 ? "Type resident name or email..." : "No unassigned residents available"}
                                                            value={query}
                                                            onFocus={() => setOpenDropdownId(household.id)}
                                                            onChange={(e) => {
                                                                setSearchQueries((prev) => ({ ...prev, [household.id]: e.target.value }));
                                                                setSelectedResidents((prev) => ({ ...prev, [household.id]: null }));
                                                                setOpenDropdownId(household.id);
                                                            }}
                                                            className="w-full pl-9 pr-3 py-3 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                                                        />
                                                    </div>

                                                    <button
                                                        type="button"
                                                        onClick={() => onAssignResident(household.id, household.flatNumber)}
                                                        disabled={!selectedResidents[household.id] || processingId === `resident-${household.id}`}
                                                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md disabled:opacity-50 flex items-center gap-1.5"
                                                    >
                                                        {processingId === `resident-${household.id}` ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                                                        Assign
                                                    </button>
                                                </div>

                                                {openDropdownId === household.id && unassignedResidents.length > 0 && (
                                                    <div className="absolute z-30 left-0 right-20 mt-1 max-h-48 overflow-y-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl divide-y divide-gray-100 dark:divide-gray-700">
                                                        {filteredResidents.length === 0 ? (
                                                            <div className="p-3 text-xs text-gray-400 text-center">No matching unassigned resident</div>
                                                        ) : (
                                                            filteredResidents.map((res) => (
                                                                <button
                                                                    key={res.id}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setSelectedResidents((prev) => ({ ...prev, [household.id]: res }));
                                                                        setSearchQueries((prev) => ({ ...prev, [household.id]: `${res.firstName} ${res.lastName} (${res.email})` }));
                                                                        setOpenDropdownId(null);
                                                                    }}
                                                                    className="w-full text-left px-4 py-2.5 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors flex flex-col"
                                                                >
                                                                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                                                                        {res.firstName} {res.lastName}
                                                                    </span>
                                                                    <span className="text-xs text-gray-500 dark:text-gray-400">{res.email}</span>
                                                                </button>
                                                            ))
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Meter Configuration Section */}
                                    <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                                        <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                                            <Activity size={16} /> Meter Status
                                        </h4>
                                        {household.meterNumber ? (
                                            <div className="p-3 bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 rounded-xl flex items-center justify-between">
                                                <span className="text-sm font-bold text-teal-700 dark:text-teal-300">
                                                    Active Meter: {household.meterNumber}
                                                </span>
                                                <span className="text-xs px-2.5 py-1 rounded-full bg-teal-500 text-white font-bold">INSTALLED</span>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => onCreateMeter(household.id, household.flatNumber)}
                                                disabled={processingId === `meter-${household.id}`}
                                                className="w-full py-3 bg-teal-50 hover:bg-teal-100 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400 border border-teal-200 dark:border-teal-800 rounded-xl font-bold transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
                                            >
                                                {processingId === `meter-${household.id}` ? <Loader2 className="animate-spin" size={18} /> : <PlusCircle size={18} />}
                                                Install Virtual Meter
                                            </button>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })
                    )}
                </div>
            )}

            {/* TAB 2: FULL RESIDENTS DIRECTORY */}
            {activeTab === 'residents' && (
                <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex gap-2">
                            {[
                                { id: 'ALL', label: `All (${allResidents.length})` },
                                { id: 'ASSIGNED', label: `Assigned (${allResidents.filter((r) => r.flatNumber).length})` },
                                { id: 'UNASSIGNED', label: `Unassigned (${allResidents.filter((r) => !r.flatNumber).length})` }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setResidentFilter(tab.id)}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${residentFilter === tab.id
                                            ? 'bg-blue-600 text-white shadow-md'
                                            : 'bg-white/70 dark:bg-gray-800/70 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
                                        }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        <div className="relative w-full sm:w-80">
                            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search resident name, email, or flat..."
                                value={residentSearch}
                                onChange={(e) => setResidentSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    <div className="bg-white/75 dark:bg-gray-800/75 backdrop-blur-xl rounded-3xl shadow-lg border border-white/20 dark:border-gray-700 overflow-hidden">
                        {filteredDirectory.length === 0 ? (
                            <div className="p-12 text-center text-gray-500 font-medium">
                                No residents match your filter.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
                                    <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-50/80 dark:bg-gray-700/60">
                                        <tr>
                                            <th className="px-6 py-4">Resident</th>
                                            <th className="px-6 py-4">Contact</th>
                                            <th className="px-6 py-4">Apartment & Flat</th>
                                            <th className="px-6 py-4">Meter</th>
                                            <th className="px-6 py-4 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60">
                                        {filteredDirectory.map((res) => {
                                            const matchedHousehold = households.find((h) => h.residentId === res.id);
                                            return (
                                                <tr key={res.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 text-white font-bold flex items-center justify-center overflow-hidden shrink-0">
                                                                {res.profilePhotoUrl ? (
                                                                    <img src={res.profilePhotoUrl} alt={res.firstName} className="w-full h-full object-cover" />
                                                                ) : (
                                                                    res.firstName?.charAt(0) || 'R'
                                                                )}
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-gray-900 dark:text-white">
                                                                    {res.firstName} {res.lastName}
                                                                </p>
                                                                <p className="text-xs text-gray-400">ID #{res.id}</p>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    <td className="px-6 py-4 space-y-1">
                                                        <div className="flex items-center gap-1.5 text-xs font-medium">
                                                            <Mail size={13} className="text-blue-500" /> {res.email}
                                                        </div>
                                                        {res.phoneNumber && (
                                                            <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                                                <Phone size={13} className="text-teal-500" /> {res.phoneNumber}
                                                            </div>
                                                        )}
                                                    </td>

                                                    <td className="px-6 py-4">
                                                        {res.flatNumber ? (
                                                            <div>
                                                                <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">
                                                                    Flat {res.flatNumber}
                                                                </span>
                                                                <p className="text-xs text-gray-500 mt-1">{res.apartmentName}</p>
                                                            </div>
                                                        ) : (
                                                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                                                                Unassigned
                                                            </span>
                                                        )}
                                                    </td>

                                                    <td className="px-6 py-4 font-semibold text-xs">
                                                        {res.meterNumber ? (
                                                            <span className="text-teal-600 dark:text-teal-400">{res.meterNumber}</span>
                                                        ) : (
                                                            <span className="text-gray-400">—</span>
                                                        )}
                                                    </td>

                                                    <td className="px-6 py-4 text-right">
                                                        {matchedHousehold ? (
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    onUnassignResident(
                                                                        matchedHousehold.id,
                                                                        matchedHousehold.flatNumber,
                                                                        `${res.firstName} ${res.lastName}`
                                                                    )
                                                                }
                                                                disabled={processingId === `unassign-${matchedHousehold.id}`}
                                                                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-100 hover:bg-red-200 dark:bg-red-900/40 text-red-700 dark:text-red-300 text-xs font-bold transition-colors disabled:opacity-50"
                                                            >
                                                                <UserMinus size={14} /> Remove from Flat
                                                            </button>
                                                        ) : (
                                                            <span className="text-xs text-gray-400 font-medium">Not in current complex</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}