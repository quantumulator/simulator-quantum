"use client";

/**
 * Loading State Components
 * Provides skeleton loaders, spinners, and progress indicators
 */

import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Skeleton Loader - mimics content shape during loading
 */
export function Skeleton({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn(
                "animate-pulse rounded-md bg-muted/50",
                className
            )}
            {...props}
        />
    );
}

/**
 * Card Skeleton - for card-shaped content
 */
export function CardSkeleton({ className }: { className?: string }) {
    return (
        <div className={cn("rounded-xl border bg-card p-6 space-y-4", className)}>
            <Skeleton className="h-6 w-1/3" />
            <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-4/6" />
            </div>
        </div>
    );
}

/**
 * Circuit Skeleton - for circuit builder loading
 */
export function CircuitSkeleton() {
    return (
        <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-8 w-24" />
            </div>
            <div className="space-y-6 mt-8">
                {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                        <Skeleton className="h-6 w-12" />
                        <div className="flex-1 flex gap-2">
                            {Array.from({ length: 8 }).map((_, j) => (
                                <Skeleton key={j} className="h-16 w-20 rounded-lg" />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

/**
 * Bloch Sphere Skeleton
 */
export function BlochSphereSkeleton() {
    return (
        <div className="h-full flex items-center justify-center">
            <div className="text-center space-y-4">
                <div className="w-32 h-32 mx-auto rounded-full bg-muted/30 animate-pulse flex items-center justify-center">
                    <div className="w-24 h-24 rounded-full bg-muted/50" />
                </div>
                <Skeleton className="h-4 w-24 mx-auto" />
            </div>
        </div>
    );
}

/**
 * Spinner Component
 */
export function Spinner({
    size = 'md',
    className,
}: {
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}) {
    const sizeClasses = {
        sm: 'h-4 w-4 border-2',
        md: 'h-8 w-8 border-2',
        lg: 'h-12 w-12 border-3',
    };

    return (
        <div
            className={cn(
                "animate-spin rounded-full border-primary border-t-transparent",
                sizeClasses[size],
                className
            )}
            role="status"
            aria-label="Loading"
        >
            <span className="sr-only">Loading...</span>
        </div>
    );
}

/**
 * Loading Overlay - covers content while loading
 */
export function LoadingOverlay({
    message = 'Loading...',
    variant = 'default',
}: {
    message?: string;
    variant?: 'default' | 'quantum';
}) {
    return (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="text-center">
                {variant === 'quantum' ? (
                    <div className="relative w-16 h-16 mx-auto mb-4">
                        <div className="absolute inset-0 rounded-full border-2 border-primary/30 animate-ping" />
                        <div className="absolute inset-2 rounded-full border-2 border-primary animate-spin" />
                        <div className="absolute inset-4 rounded-full bg-primary/20" />
                    </div>
                ) : (
                    <Spinner size="lg" className="mx-auto mb-4" />
                )}
                <p className="text-sm text-muted-foreground">{message}</p>
            </div>
        </div>
    );
}

/**
 * Progress Bar
 */
export function ProgressBar({
    value,
    max = 100,
    label,
    showValue = false,
    className,
}: {
    value: number;
    max?: number;
    label?: string;
    showValue?: boolean;
    className?: string;
}) {
    const percentage = Math.min(100, Math.max(0, (value / max) * 100));

    return (
        <div className={cn("space-y-1", className)}>
            {(label || showValue) && (
                <div className="flex justify-between text-xs text-muted-foreground">
                    {label && <span>{label}</span>}
                    {showValue && <span>{Math.round(percentage)}%</span>}
                </div>
            )}
            <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                    className="h-full bg-primary transition-all duration-300 ease-out"
                    style={{ width: `${percentage}%` }}
                    role="progressbar"
                    aria-valuenow={value}
                    aria-valuemin={0}
                    aria-valuemax={max}
                />
            </div>
        </div>
    );
}

/**
 * Pulse Dot - for status indicators
 */
export function PulseDot({
    status = 'default',
    className,
}: {
    status?: 'default' | 'success' | 'warning' | 'error';
    className?: string;
}) {
    const colors = {
        default: 'bg-primary',
        success: 'bg-green-500',
        warning: 'bg-yellow-500',
        error: 'bg-red-500',
    };

    return (
        <span className={cn("relative flex h-3 w-3", className)}>
            <span
                className={cn(
                    "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                    colors[status]
                )}
            />
            <span
                className={cn(
                    "relative inline-flex rounded-full h-3 w-3",
                    colors[status]
                )}
            />
        </span>
    );
}

/**
 * Shimmer Effect - gradient loading effect
 */
export function Shimmer({
    className,
    children,
}: {
    className?: string;
    children?: React.ReactNode;
}) {
    return (
        <div className={cn("relative overflow-hidden", className)}>
            {children}
            <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>
    );
}

/**
 * Empty State
 */
export function EmptyState({
    icon,
    title,
    description,
    action,
}: {
    icon?: React.ReactNode;
    title: string;
    description?: string;
    action?: React.ReactNode;
}) {
    return (
        <div className="flex flex-col items-center justify-center p-8 text-center">
            {icon && (
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                    {icon}
                </div>
            )}
            <h3 className="text-lg font-medium mb-1">{title}</h3>
            {description && (
                <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                    {description}
                </p>
            )}
            {action}
        </div>
    );
}
