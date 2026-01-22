import React, { useState, useRef, useEffect } from 'react';
import { X, Plus } from 'lucide-react';

const JOB_TITLE_SUGGESTIONS = [
    'Software Engineer', 'Frontend Developer', 'Backend Developer', 'Full Stack Developer',
    'DevOps Engineer', 'Data Scientist', 'Product Manager', 'UI/UX Designer',
    'Mobile Developer', 'QA Engineer', 'Cloud Architect', 'Security Engineer'
];

const LOCATION_SUGGESTIONS = [
    'Bengaluru', 'Mumbai', 'Delhi', 'Hyderabad', 'Pune', 'Chennai',
    'Noida', 'Gurugram', 'Kolkata', 'Ahmedabad', 'Remote'
];

export function EnhancedTagInput({
    placeholder = "Type and press enter...",
    tags = [],
    onTagsChange,
    className = "",
    type = "default", // "jobTitle" or "location" for autocomplete
    maxTags = 10
}) {
    const [inputValue, setInputValue] = useState("");
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const inputRef = useRef(null);
    const suggestionRef = useRef(null);

    const suggestions = type === "jobTitle"
        ? JOB_TITLE_SUGGESTIONS
        : type === "location"
            ? LOCATION_SUGGESTIONS
            : [];

    const filteredSuggestions = suggestions.filter(
        (suggestion) =>
            suggestion.toLowerCase().includes(inputValue.toLowerCase()) &&
            !tags.includes(suggestion)
    ).slice(0, 5);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (suggestionRef.current && !suggestionRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const addTag = (tag) => {
        const trimmed = tag.trim();
        if (trimmed && !tags.includes(trimmed) && tags.length < maxTags) {
            onTagsChange([...tags, trimmed]);
            setInputValue("");
            setShowSuggestions(false);
            setHighlightedIndex(-1);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (highlightedIndex >= 0 && filteredSuggestions[highlightedIndex]) {
                addTag(filteredSuggestions[highlightedIndex]);
            } else if (inputValue.trim()) {
                // Handle comma-separated values
                const values = inputValue.split(',').map(v => v.trim()).filter(v => v);
                if (values.length > 1) {
                    values.forEach(val => {
                        if (!tags.includes(val) && tags.length < maxTags) {
                            onTagsChange(prev => [...prev, val]);
                        }
                    });
                    setInputValue("");
                } else {
                    addTag(inputValue);
                }
            }
        } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
            onTagsChange(tags.slice(0, -1));
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            setHighlightedIndex(prev =>
                prev < filteredSuggestions.length - 1 ? prev + 1 : prev
            );
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1);
        } else if (e.key === 'Escape') {
            setShowSuggestions(false);
            setHighlightedIndex(-1);
        }
    };

    const handleInputChange = (e) => {
        const value = e.target.value;
        setInputValue(value);
        setShowSuggestions(value.length > 0 && filteredSuggestions.length > 0);
        setHighlightedIndex(-1);
    };

    const removeTag = (tagToRemove) => {
        onTagsChange(tags.filter(tag => tag !== tagToRemove));
    };

    return (
        <div className="relative" ref={suggestionRef}>
            <div className={`flex flex-wrap items-center gap-2 p-3 rounded-xl border border-white/10 bg-black/20 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500/50 transition-all ${className}`}>
                {tags.map((tag, index) => (
                    <span
                        key={index}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-blue-600/20 text-blue-300 border border-blue-500/30 hover:bg-blue-600/30 transition-colors"
                    >
                        {tag}
                        <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="hover:text-white focus:outline-none focus:ring-1 focus:ring-blue-400 rounded"
                            aria-label={`Remove ${tag}`}
                        >
                            <X size={14} />
                        </button>
                    </span>
                ))}
                <div className="flex-1 flex items-center gap-2 min-w-[200px]">
                    <input
                        ref={inputRef}
                        type="text"
                        value={inputValue}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        onFocus={() => {
                            if (inputValue && filteredSuggestions.length > 0) {
                                setShowSuggestions(true);
                            }
                        }}
                        className="flex-1 bg-transparent border-none outline-none text-text-primary placeholder:text-text-secondary"
                        placeholder={tags.length === 0 ? placeholder : ""}
                        aria-label={placeholder}
                        disabled={tags.length >= maxTags}
                    />
                    {tags.length === 0 && !inputValue && (
                        <span className="text-xs text-text-secondary/60 flex items-center gap-1">
                            <kbd className="px-1.5 py-0.5 bg-white/5 rounded text-[10px]">Enter</kbd>
                            to add
                        </span>
                    )}
                </div>
            </div>

            {/* Autocomplete Suggestions */}
            {showSuggestions && filteredSuggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-2 bg-bg-card border border-white/10 rounded-xl shadow-xl overflow-hidden">
                    {filteredSuggestions.map((suggestion, index) => (
                        <button
                            key={suggestion}
                            type="button"
                            onClick={() => addTag(suggestion)}
                            onMouseEnter={() => setHighlightedIndex(index)}
                            className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center gap-2 ${index === highlightedIndex
                                    ? 'bg-blue-600/20 text-blue-300'
                                    : 'text-text-primary hover:bg-white/5'
                                }`}
                        >
                            <Plus size={14} className="opacity-50" />
                            {suggestion}
                        </button>
                    ))}
                </div>
            )}

            {tags.length > 0 && (
                <p className="text-xs text-text-secondary mt-2">
                    {tags.length}/{maxTags} tags {tags.length < maxTags && '• Separate multiple with commas'}
                </p>
            )}
        </div>
    );
}
