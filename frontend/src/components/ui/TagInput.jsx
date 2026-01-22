import React, { useState } from 'react';
import { X } from 'lucide-react';

export function TagInput({
    placeholder = "Type and press enter...",
    tags = [],
    onTagsChange,
    className = ""
}) {
    const [inputState, setInputState] = useState("");

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const trimmed = inputState.trim();
            if (trimmed && !tags.includes(trimmed)) {
                onTagsChange([...tags, trimmed]);
                setInputState("");
            }
        } else if (e.key === 'Backspace' && !inputState && tags.length > 0) {
            onTagsChange(tags.slice(0, -1));
        }
    };

    const removeTag = (tagToRemove) => {
        onTagsChange(tags.filter(tag => tag !== tagToRemove));
    };

    return (
        <div className={`flex flex-wrap items-center gap-2 p-2 rounded-md border border-white/10 bg-white/5 focus-within:ring-2 focus-within:ring-brand-primary ${className}`}>
            {tags.map((tag, index) => (
                <span key={index} className="flex items-center gap-1 px-2 py-1 text-sm rounded bg-brand-primary/20 text-brand-primary-light border border-brand-primary/30">
                    {tag}
                    <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="hover:text-white focus:outline-none"
                    >
                        <X size={14} />
                    </button>
                </span>
            ))}
            <input
                type="text"
                value={inputState}
                onChange={(e) => setInputState(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 bg-transparent border-none outline-none text-text-primary placeholder:text-text-secondary min-w-[120px]"
                placeholder={tags.length === 0 ? placeholder : ""}
            />
        </div>
    );
}
