import React, { useState, useRef, useEffect } from 'react';

const PRESET_RANGES = [
    { label: '₹3-5L', min: 300000, max: 500000 },
    { label: '₹5-10L', min: 500000, max: 1000000 },
    { label: '₹10-20L', min: 1000000, max: 2000000 },
    { label: '₹20L+', min: 2000000, max: 5000000 },
];

export function RangeSlider({
    min = 0,
    max = 5000000,
    step = 50000,
    value = [0, 5000000],
    onChange,
    formatValue = (val) => val,
    className = ""
}) {
    const [isDragging, setIsDragging] = useState(null);
    const sliderRef = useRef(null);

    const getPercentage = (value) => ((value - min) / (max - min)) * 100;

    const handleMouseDown = (thumb) => (e) => {
        e.preventDefault();
        setIsDragging(thumb);
    };

    const handleMouseMove = (e) => {
        if (!isDragging || !sliderRef.current) return;

        const rect = sliderRef.current.getBoundingClientRect();
        const percentage = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
        const newValue = min + (percentage / 100) * (max - min);
        const steppedValue = Math.round(newValue / step) * step;

        if (isDragging === 'min') {
            onChange([Math.min(steppedValue, value[1] - step), value[1]]);
        } else {
            onChange([value[0], Math.max(steppedValue, value[0] + step)]);
        }
    };

    const handleMouseUp = () => {
        setIsDragging(null);
    };

    useEffect(() => {
        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            return () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [isDragging, value]);

    const selectPreset = (preset) => {
        onChange([preset.min, preset.max]);
    };

    return (
        <div className={`space-y-4 ${className}`}>
            {/* Preset Quick Select */}
            <div className="flex flex-wrap gap-2">
                {PRESET_RANGES.map((preset) => (
                    <button
                        key={preset.label}
                        type="button"
                        onClick={() => selectPreset(preset)}
                        className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${value[0] === preset.min && value[1] === preset.max
                                ? 'bg-blue-600/20 border-blue-500/50 text-blue-300'
                                : 'bg-white/5 border-white/10 text-text-secondary hover:bg-white/10 hover:text-text-primary'
                            }`}
                    >
                        {preset.label}
                    </button>
                ))}
            </div>

            {/* Slider */}
            <div className="relative pt-2 pb-6">
                <div
                    ref={sliderRef}
                    className="relative h-2 bg-white/10 rounded-full cursor-pointer"
                >
                    {/* Active Range */}
                    <div
                        className="absolute h-full bg-gradient-to-r from-blue-600 to-blue-500 rounded-full"
                        style={{
                            left: `${getPercentage(value[0])}%`,
                            width: `${getPercentage(value[1]) - getPercentage(value[0])}%`
                        }}
                    />

                    {/* Min Thumb */}
                    <div
                        className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 bg-blue-600 rounded-full border-2 border-white shadow-lg cursor-grab ${isDragging === 'min' ? 'scale-125 cursor-grabbing' : 'hover:scale-110'
                            } transition-transform`}
                        style={{ left: `${getPercentage(value[0])}%` }}
                        onMouseDown={handleMouseDown('min')}
                        role="slider"
                        aria-label="Minimum salary"
                        aria-valuemin={min}
                        aria-valuemax={max}
                        aria-valuenow={value[0]}
                        tabIndex={0}
                    />

                    {/* Max Thumb */}
                    <div
                        className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 bg-blue-600 rounded-full border-2 border-white shadow-lg cursor-grab ${isDragging === 'max' ? 'scale-125 cursor-grabbing' : 'hover:scale-110'
                            } transition-transform`}
                        style={{ left: `${getPercentage(value[1])}%` }}
                        onMouseDown={handleMouseDown('max')}
                        role="slider"
                        aria-label="Maximum salary"
                        aria-valuemin={min}
                        aria-valuemax={max}
                        aria-valuenow={value[1]}
                        tabIndex={0}
                    />
                </div>

                {/* Value Labels */}
                <div className="flex justify-between mt-3 text-sm">
                    <span className="text-blue-300 font-medium">{formatValue(value[0])}</span>
                    <span className="text-text-secondary">to</span>
                    <span className="text-blue-300 font-medium">{formatValue(value[1])}</span>
                </div>
            </div>

            {/* Manual Inputs (fallback) */}
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="block text-xs text-text-secondary mb-1.5">Min Salary</label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary">₹</span>
                        <input
                            type="number"
                            min={min}
                            max={value[1]}
                            step={step}
                            value={value[0]}
                            onChange={(e) => onChange([parseInt(e.target.value) || 0, value[1]])}
                            className="w-full bg-black/20 border border-white/10 rounded-lg py-2 pl-7 pr-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-xs text-text-secondary mb-1.5">Max Salary</label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary">₹</span>
                        <input
                            type="number"
                            min={value[0]}
                            max={max}
                            step={step}
                            value={value[1]}
                            onChange={(e) => onChange([value[0], parseInt(e.target.value) || 0])}
                            className="w-full bg-black/20 border border-white/10 rounded-lg py-2 pl-7 pr-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
