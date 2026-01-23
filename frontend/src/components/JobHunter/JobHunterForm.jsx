import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EnhancedTagInput } from '../ui/EnhancedTagInput';
import { RangeSlider } from '../ui/RangeSlider';
import { useToast } from '../ui/Toast';
import { JobHunterLogs } from './JobHunterLogs';
import {
    ChevronDown,
    Briefcase,
    MapPin,
    Home,
    Building2,
    Shuffle,
    Clock,
    Calendar,
    DollarSign,
    ChevronUp,
    Sparkles,
    CheckCircle2,
    ArrowLeft
} from 'lucide-react';

export default function JobHunterForm({ onSubmit }) {
    const toast = useToast();
    const navigate = useNavigate();

    const [config, setConfig] = useState({
        jobTitles: [],
        locationTypes: ['remote'], // Smart default
        locations: [],
        noticePeriod: "immediate",
        salaryRange: [500000, 1500000], // Default ₹5L - ₹15L
        currency: "INR",
        startDate: "immediately",
        employmentTypes: ['full-time'], // Smart default
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [errors, setErrors] = useState({});

    const locationIcons = {
        remote: <Home size={16} />,
        hybrid: <Shuffle size={16} />,
        onsite: <Building2 size={16} />
    };

    const validateForm = () => {
        const newErrors = {};

        if (config.jobTitles.length === 0) {
            newErrors.jobTitles = 'Please add at least one job title';
        }

        if (config.locationTypes.length === 0) {
            newErrors.locationTypes = 'Please select at least one location type';
        }

        if (config.employmentTypes.length === 0) {
            newErrors.employmentTypes = 'Please select at least one employment type';
        }

        if (config.salaryRange[0] >= config.salaryRange[1]) {
            newErrors.salary = 'Minimum salary must be less than maximum';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const toggleSelection = (field, value) => {
        const current = config[field];
        const updated = current.includes(value)
            ? current.filter(item => item !== value)
            : [...current, value];
        setConfig({ ...config, [field]: updated });

        // Clear error when user makes a selection
        if (errors[field]) {
            setErrors({ ...errors, [field]: undefined });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            toast.error('Please fill in all required fields');
            return;
        }

        setIsSubmitting(true);

        try {
            // If onSubmit prop is provided, use it (for hook integration)
            if (onSubmit) {
                await onSubmit(config);
            } else {
                // Fallback to old navigation behavior
                console.log("Submitting config:", config);
                sessionStorage.setItem('jobHunterConfig', JSON.stringify(config));
                const runId = `run_${Date.now()}`;
                toast.success('Job Hunter Agent configured successfully!');
                navigate(`/dashboard/hunter/result/${runId}`);
            }
        } catch (error) {
            console.error('Form submission error:', error);
            toast.error('Failed to start job hunt. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatINR = (value) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(value);
    };

    const formatINRCompact = (value) => {
        if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
        if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
        if (value >= 1000) return `₹${(value / 1000).toFixed(0)}K`;
        return `₹${value}`;
    };

    return (
        <div className="w-full max-w-4xl mx-auto p-0 space-y-6">

            <form onSubmit={handleSubmit} className="space-y-6 font-dm-sans">

                {/* Section 1: What You're Looking For */}
                <section className="space-y-5 p-6 bg-[#18181B]/60 backdrop-blur-xl rounded-2xl border border-white/10 shadow-xl overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 opacity-20" />
                    <div className="flex items-center gap-2 pb-2 border-b border-white/5">
                        <Briefcase size={20} className="text-[#2934FF]" />
                        <h3 className="text-lg font-bold text-white tracking-wide">What You're Looking For</h3>
                    </div>

                    {/* Job Titles */}
                    <div className="space-y-2">
                        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                            Target Job Titles <span className="text-red-400">*</span>
                        </label>
                        <EnhancedTagInput
                            tags={config.jobTitles}
                            onTagsChange={(newTitles) => {
                                setConfig({ ...config, jobTitles: newTitles });
                                if (errors.jobTitles) setErrors({ ...errors, jobTitles: undefined });
                            }}
                            placeholder="e.g. Software Engineer, Product Designer"
                            type="jobTitle"
                            maxTags={5}
                        />
                        {errors.jobTitles && (
                            <p className="text-xs text-red-400 flex items-center gap-1">
                                <span className="w-1 h-1 rounded-full bg-red-400" />
                                {errors.jobTitles}
                            </p>
                        )}
                        {!errors.jobTitles && config.jobTitles.length === 0 && (
                            <p className="text-xs text-text-secondary">
                                Try: Software Engineer, Frontend Developer, Full Stack Developer
                            </p>
                        )}
                    </div>

                    {/* Employment Types */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-text-primary">
                            Employment Type <span className="text-red-400">*</span>
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {['Full-time', 'Part-time', 'Contract', 'Internship'].map((type) => (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => toggleSelection('employmentTypes', type.toLowerCase())}
                                    className={`px-4 py-2.5 rounded-xl border text-sm font-medium transition-all duration-300 ${config.employmentTypes.includes(type.toLowerCase())
                                        ? 'bg-[#2934FF] border-[#2934FF] text-white shadow-[0_0_15px_rgba(41,52,255,0.4)] scale-105'
                                        : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10 hover:text-white hover:border-white/10'
                                        }`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                        {errors.employmentTypes && (
                            <p className="text-xs text-red-400 flex items-center gap-1">
                                <span className="w-1 h-1 rounded-full bg-red-400" />
                                {errors.employmentTypes}
                            </p>
                        )}
                    </div>
                </section>

                {/* Section 2: Location Preferences */}
                <section className="space-y-5 p-6 bg-[#18181B]/60 backdrop-blur-xl rounded-2xl border border-white/10 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-blue-500 to-purple-500 opacity-20" />
                    <div className="flex items-center gap-2 pb-2 border-b border-white/5">
                        <MapPin size={20} className="text-[#A855F7]" />
                        <h3 className="text-lg font-bold text-white tracking-wide">Location Preferences</h3>
                    </div>

                    {/* Location Types */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-text-primary">
                            Work Mode <span className="text-red-400">*</span>
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {['Remote', 'Hybrid', 'Onsite'].map((type) => (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => toggleSelection('locationTypes', type.toLowerCase())}
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all duration-300 ${config.locationTypes.includes(type.toLowerCase())
                                        ? 'bg-[#A855F7] border-[#A855F7] text-white shadow-[0_0_15px_rgba(168,85,247,0.4)] scale-105'
                                        : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10 hover:text-white hover:border-white/10'
                                        }`}
                                >
                                    {locationIcons[type.toLowerCase()]}
                                    {type}
                                </button>
                            ))}
                        </div>
                        {errors.locationTypes && (
                            <p className="text-xs text-red-400 flex items-center gap-1">
                                <span className="w-1 h-1 rounded-full bg-red-400" />
                                {errors.locationTypes}
                            </p>
                        )}
                    </div>

                    {/* Preferred Locations */}
                    {(config.locationTypes.includes('hybrid') || config.locationTypes.includes('onsite')) && (
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-text-primary">
                                Preferred Cities
                                {(config.locationTypes.includes('hybrid') || config.locationTypes.includes('onsite')) &&
                                    !config.locationTypes.includes('remote') && (
                                        <span className="text-red-400"> *</span>
                                    )
                                }
                            </label>
                            <EnhancedTagInput
                                tags={config.locations}
                                onTagsChange={(newLocations) => setConfig({ ...config, locations: newLocations })}
                                placeholder="e.g. Bengaluru, Mumbai, Delhi"
                                type="location"
                                maxTags={5}
                            />
                            <p className="text-xs text-text-secondary">
                                Leave empty to search all locations
                            </p>
                        </div>
                    )}
                </section>

                {/* Section 3: Compensation */}
                <section className="space-y-5 p-6 bg-[#18181B]/60 backdrop-blur-xl rounded-2xl border border-white/10 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 via-blue-500 to-green-500 opacity-20" />
                    <div className="flex items-center gap-2 pb-2 border-b border-white/5">
                        <DollarSign size={20} className="text-[#22C55E]" />
                        <h3 className="text-lg font-bold text-white tracking-wide">Expected Salary (Annual)</h3>
                    </div>

                    <RangeSlider
                        min={0}
                        max={5000000}
                        step={50000}
                        value={config.salaryRange}
                        onChange={(newRange) => {
                            setConfig({ ...config, salaryRange: newRange });
                            if (errors.salary) setErrors({ ...errors, salary: undefined });
                        }}
                        formatValue={formatINRCompact}
                    />

                    {errors.salary && (
                        <p className="text-xs text-red-400 flex items-center gap-1">
                            <span className="w-1 h-1 rounded-full bg-red-400" />
                            {errors.salary}
                        </p>
                    )}

                    {config.jobTitles.length > 0 && (
                        <div className="flex items-start gap-2 p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg">
                            <Sparkles size={16} className="text-blue-400 mt-0.5 flex-shrink-0" />
                            <p className="text-xs text-blue-300">
                                Based on your selections, typical range for {config.jobTitles[0]} in India is ₹8L - ₹18L
                            </p>
                        </div>
                    )}
                </section>

                {/* Advanced Options - Collapsible */}
                <section className="bg-white/[0.02] rounded-2xl border border-white/5">
                    <button
                        type="button"
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        className="w-full flex items-center justify-between p-4 text-left hover:bg-white/[0.02] transition-colors rounded-2xl"
                    >
                        <span className="text-sm font-medium text-text-primary flex items-center gap-2">
                            <Calendar size={18} className="text-blue-400" />
                            Advanced Options
                        </span>
                        {showAdvanced ? <ChevronUp size={18} className="text-text-secondary" /> : <ChevronDown size={18} className="text-text-secondary" />}
                    </button>

                    {showAdvanced && (
                        <div className="px-6 pb-6 space-y-5 border-t border-white/5 pt-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {/* Notice Period */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-text-primary flex items-center gap-2">
                                        <Clock size={16} className="text-blue-400" />
                                        Notice Period
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={config.noticePeriod}
                                            onChange={(e) => setConfig({ ...config, noticePeriod: e.target.value })}
                                            className="w-full appearance-none bg-black/20 border border-white/10 text-text-primary rounded-xl px-4 py-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                        >
                                            <option value="immediate">Immediate (0-15 days)</option>
                                            <option value="30_days">30 Days</option>
                                            <option value="60_days">60 Days</option>
                                            <option value="90_days">90 Days</option>
                                        </select>
                                        <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
                                    </div>
                                </div>

                                {/* Start Date */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-text-primary flex items-center gap-2">
                                        <Calendar size={16} className="text-blue-400" />
                                        Job Search Status
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={config.startDate}
                                            onChange={(e) => setConfig({ ...config, startDate: e.target.value })}
                                            className="w-full appearance-none bg-black/20 border border-white/10 text-text-primary rounded-xl px-4 py-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                        >
                                            <option value="immediately">Looking Actively</option>
                                            <option value="actively_applying">Open to Opportunities</option>
                                            <option value="flexible">Just Browsing</option>
                                        </select>
                                        <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </section>

                {/* Submit Button */}
                <div className="pt-4 pb-8">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-4 bg-[#2934FF] hover:bg-[#1E28CC] disabled:bg-[#2934FF]/50 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(41,52,255,0.4)] hover:shadow-[0_0_30px_rgba(41,52,255,0.6)] transition-all duration-300 transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 border border-[#2934FF]/50"
                    >
                        {isSubmitting ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Configuring Your Agent...
                            </>
                        ) : (
                            <>
                                <Sparkles size={20} className="fill-white" />
                                Start Job Hunter Agent
                            </>
                        )}
                    </button>

                    {Object.keys(errors).length > 0 && (
                        <p className="text-xs text-red-400 text-center mt-3 bg-red-500/10 border border-red-500/20 py-2 rounded-lg">
                            Please fix all errors to proceed.
                        </p>
                    )}
                </div>

            </form>
        </div>
    );
}
