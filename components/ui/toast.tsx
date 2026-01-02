"use client";

/**
 * Toast Notification System
 * Provides user feedback for actions, errors, and status updates
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

// Toast types
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
    id: string;
    type: ToastType;
    title: string;
    message?: string;
    duration?: number;
    action?: {
        label: string;
        onClick: () => void;
    };
}

interface ToastContextType {
    toasts: Toast[];
    addToast: (toast: Omit<Toast, 'id'>) => string;
    removeToast: (id: string) => void;
    clearToasts: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Generate unique ID
const generateId = () => Math.random().toString(36).substring(2, 9);

// Toast Provider Component
export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback((toast: Omit<Toast, 'id'>): string => {
        const id = generateId();
        const duration = toast.duration ?? 5000;
        const newToast: Toast = {
            ...toast,
            id,
            duration,
        };

        setToasts((prev) => [...prev, newToast]);

        // Auto-remove after duration (0 means no auto-dismiss)
        if (duration > 0) {
            setTimeout(() => {
                setToasts((prev) => prev.filter((t) => t.id !== id));
            }, duration);
        }

        return id;
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const clearToasts = useCallback(() => {
        setToasts([]);
    }, []);

    return (
        <ToastContext.Provider value={{ toasts, addToast, removeToast, clearToasts }}>
            {children}
            <ToastContainer toasts={toasts} onRemove={removeToast} />
        </ToastContext.Provider>
    );
}

// Hook to use toast
export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }

    const { addToast, removeToast, clearToasts } = context;

    return {
        toast: addToast,
        success: (title: string, message?: string) =>
            addToast({ type: 'success', title, message }),
        error: (title: string, message?: string) =>
            addToast({ type: 'error', title, message, duration: 8000 }),
        warning: (title: string, message?: string) =>
            addToast({ type: 'warning', title, message }),
        info: (title: string, message?: string) =>
            addToast({ type: 'info', title, message }),
        dismiss: removeToast,
        clearAll: clearToasts,
    };
}

// Toast Container
function ToastContainer({
    toasts,
    onRemove
}: {
    toasts: Toast[];
    onRemove: (id: string) => void;
}) {
    if (toasts.length === 0) return null;

    return (
        <div
            className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none"
            role="region"
            aria-label="Notifications"
        >
            {toasts.map((toast) => (
                <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
            ))}
        </div>
    );
}

// Individual Toast Item
function ToastItem({
    toast,
    onRemove
}: {
    toast: Toast;
    onRemove: (id: string) => void;
}) {
    const icons: Record<ToastType, ReactNode> = {
        success: <CheckCircle className="h-5 w-5 text-green-500" />,
        error: <AlertCircle className="h-5 w-5 text-red-500" />,
        warning: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
        info: <Info className="h-5 w-5 text-blue-500" />,
    };

    const bgColors: Record<ToastType, string> = {
        success: 'border-green-500/20 bg-green-500/5',
        error: 'border-red-500/20 bg-red-500/5',
        warning: 'border-yellow-500/20 bg-yellow-500/5',
        info: 'border-blue-500/20 bg-blue-500/5',
    };

    return (
        <div
            className={cn(
                "pointer-events-auto",
                "flex items-start gap-3 p-4",
                "bg-card border rounded-lg shadow-lg",
                "animate-slide-in-right",
                bgColors[toast.type]
            )}
            role="alert"
            aria-live={toast.type === 'error' ? 'assertive' : 'polite'}
        >
            {/* Icon */}
            <div className="flex-shrink-0 mt-0.5">
                {icons[toast.type]}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-foreground">
                    {toast.title}
                </p>
                {toast.message && (
                    <p className="text-xs text-muted-foreground mt-1">
                        {toast.message}
                    </p>
                )}
                {toast.action && (
                    <button
                        onClick={toast.action.onClick}
                        className="text-xs font-medium text-primary hover:underline mt-2"
                    >
                        {toast.action.label}
                    </button>
                )}
            </div>

            {/* Close Button */}
            <button
                onClick={() => onRemove(toast.id)}
                className="flex-shrink-0 p-1 rounded hover:bg-muted transition-colors"
                aria-label="Dismiss notification"
            >
                <X className="h-4 w-4 text-muted-foreground" />
            </button>
        </div>
    );
}
