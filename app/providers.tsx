"use client";

/**
 * Global Providers
 * Wraps the application with context providers for error handling, toasts, etc.
 */

import React, { ReactNode } from 'react';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { ToastProvider } from '@/components/ui/toast';

interface ProvidersProps {
    children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
    return (
        <ErrorBoundary showDetails={process.env.NODE_ENV === 'development'}>
            <ToastProvider>
                {children}
            </ToastProvider>
        </ErrorBoundary>
    );
}
