"use client";

/**
 * Keyboard Shortcuts Hook
 * Provides keyboard navigation for the quantum simulator
 */

import { useEffect, useCallback } from 'react';

export interface KeyboardShortcut {
    key: string;
    ctrl?: boolean;
    shift?: boolean;
    alt?: boolean;
    meta?: boolean;
    action: () => void;
    description: string;
}

interface UseKeyboardShortcutsOptions {
    enabled?: boolean;
    shortcuts: KeyboardShortcut[];
}

/**
 * Check if an element is an input element (should not trigger shortcuts)
 */
function isInputElement(element: EventTarget | null): boolean {
    if (!element || !(element instanceof HTMLElement)) return false;
    return (
        element.tagName === 'INPUT' ||
        element.tagName === 'TEXTAREA' ||
        element.tagName === 'SELECT' ||
        element.isContentEditable
    );
}

/**
 * Hook for handling keyboard shortcuts
 */
export function useKeyboardShortcuts({
    enabled = true,
    shortcuts,
}: UseKeyboardShortcutsOptions) {
    const handleKeyDown = useCallback(
        (event: KeyboardEvent) => {
            if (!enabled) return;

            // Don't trigger shortcuts when typing in inputs
            if (isInputElement(event.target)) return;

            for (const shortcut of shortcuts) {
                const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase();
                const ctrlMatches = (shortcut.ctrl ?? false) === (event.ctrlKey || event.metaKey);
                const shiftMatches = (shortcut.shift ?? false) === event.shiftKey;
                const altMatches = (shortcut.alt ?? false) === event.altKey;

                if (keyMatches && ctrlMatches && shiftMatches && altMatches) {
                    event.preventDefault();
                    shortcut.action();
                    return;
                }
            }
        },
        [enabled, shortcuts]
    );

    useEffect(() => {
        if (typeof window === 'undefined') return;
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);
}

/**
 * Default shortcuts for the quantum simulator
 */
export function useQuantumShortcuts({
    onUndo,
    onRedo,
    onRun,
    onClear,
    onSave,
    onToggleCode,
    gateShortcuts = {},
}: {
    onUndo?: () => void;
    onRedo?: () => void;
    onRun?: () => void;
    onClear?: () => void;
    onSave?: () => void;
    onToggleCode?: () => void;
    gateShortcuts?: Record<string, () => void>;
}) {
    const shortcuts: KeyboardShortcut[] = [];

    // Standard shortcuts
    if (onUndo) {
        shortcuts.push({
            key: 'z',
            ctrl: true,
            action: onUndo,
            description: 'Undo last action',
        });
    }

    if (onRedo) {
        shortcuts.push({
            key: 'z',
            ctrl: true,
            shift: true,
            action: onRedo,
            description: 'Redo last action',
        });
        shortcuts.push({
            key: 'y',
            ctrl: true,
            action: onRedo,
            description: 'Redo last action',
        });
    }

    if (onRun) {
        shortcuts.push({
            key: 'Enter',
            ctrl: true,
            action: onRun,
            description: 'Run simulation',
        });
        shortcuts.push({
            key: 'r',
            ctrl: true,
            action: onRun,
            description: 'Run simulation',
        });
    }

    if (onClear) {
        shortcuts.push({
            key: 'Backspace',
            ctrl: true,
            action: onClear,
            description: 'Clear circuit',
        });
    }

    if (onSave) {
        shortcuts.push({
            key: 's',
            ctrl: true,
            action: onSave,
            description: 'Save circuit',
        });
    }

    if (onToggleCode) {
        shortcuts.push({
            key: '`',
            ctrl: true,
            action: onToggleCode,
            description: 'Toggle code editor',
        });
    }

    // Gate shortcuts (1-9 for quick gate selection)
    const gateKeys = ['h', 'x', 'y', 'z', 's', 't', 'c'];
    gateKeys.forEach((key) => {
        const upperKey = key.toUpperCase();
        if (gateShortcuts[upperKey]) {
            shortcuts.push({
                key,
                action: gateShortcuts[upperKey],
                description: `Select ${upperKey} gate`,
            });
        }
    });

    useKeyboardShortcuts({ shortcuts });

    return shortcuts;
}

/**
 * Get formatted shortcut string for display
 */
export function formatShortcut(shortcut: KeyboardShortcut): string {
    const parts: string[] = [];
    const isMac = typeof navigator !== 'undefined' && navigator.platform.includes('Mac');

    if (shortcut.ctrl) parts.push(isMac ? '⌘' : 'Ctrl');
    if (shortcut.shift) parts.push(isMac ? '⇧' : 'Shift');
    if (shortcut.alt) parts.push(isMac ? '⌥' : 'Alt');

    let key = shortcut.key;
    if (key === ' ') key = 'Space';
    if (key === 'Enter') key = '↵';
    if (key === 'Backspace') key = '⌫';
    if (key === 'Escape') key = 'Esc';

    parts.push(key.toUpperCase());

    return parts.join(isMac ? '' : '+');
}
