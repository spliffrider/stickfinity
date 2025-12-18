"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = 'space' | 'teal';

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setTheme] = useState<Theme>('teal'); // Default to new theme
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem('stickfinity_theme') as Theme;
        if (saved) {
            setTheme(saved);
        }
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted) return;
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('stickfinity_theme', theme);
    }, [theme, mounted]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'space' ? 'teal' : 'space');
    };

    if (!mounted) {
        return <>{children}</>; // Render children to avoid layout shift, but theme might be default
    }

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    return context;
}
