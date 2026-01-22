import React, { createContext, useContext, useState, useEffect } from 'react';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';

const ToastContext = createContext();

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within ToastProvider');
    }
    return context;
};

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const addToast = (message, type = 'info', duration = 4000) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type, duration }]);
    };

    const removeToast = (id) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    };

    const toast = {
        success: (message, duration) => addToast(message, 'success', duration),
        error: (message, duration) => addToast(message, 'error', duration),
        info: (message, duration) => addToast(message, 'info', duration),
    };

    return (
        <ToastContext.Provider value={toast}>
            {children}
            <ToastContainer toasts={toasts} onClose={removeToast} />
        </ToastContext.Provider>
    );
}

function ToastContainer({ toasts, onClose }) {
    return (
        <div
            className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none"
            aria-live="polite"
            aria-atomic="true"
        >
            {toasts.map(toast => (
                <Toast key={toast.id} {...toast} onClose={() => onClose(toast.id)} />
            ))}
        </div>
    );
}

function Toast({ id, message, type, duration, onClose }) {
    useEffect(() => {
        if (duration) {
            const timer = setTimeout(onClose, duration);
            return () => clearTimeout(timer);
        }
    }, [duration, onClose]);

    const icons = {
        success: <CheckCircle2 size={20} className="text-green-400" />,
        error: <XCircle size={20} className="text-red-400" />,
        info: <Info size={20} className="text-blue-400" />,
    };

    const styles = {
        success: 'bg-green-500/10 border-green-500/30 text-green-100',
        error: 'bg-red-500/10 border-red-500/30 text-red-100',
        info: 'bg-blue-500/10 border-blue-500/30 text-blue-100',
    };

    return (
        <div
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-lg shadow-xl animate-in slide-in-from-right duration-300 ${styles[type]}`}
            role="alert"
        >
            {icons[type]}
            <p className="text-sm font-medium flex-1 pr-2">{message}</p>
            <button
                onClick={onClose}
                className="text-inherit opacity-60 hover:opacity-100 transition-opacity focus:outline-none focus:ring-2 focus:ring-current rounded"
                aria-label="Close notification"
            >
                <X size={16} />
            </button>
        </div>
    );
}
