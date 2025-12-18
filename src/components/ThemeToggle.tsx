"use client";

import { useTheme } from "./ThemeProvider";
import { Moon, Sun } from "lucide-react";

export default function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className="p-3 rounded-full bg-white/20 backdrop-blur-md border border-white/20 text-white shadow-lg hover:bg-white/30 transition-all active:scale-95"
            title={theme === 'space' ? "Switch to Teal Mode" : "Switch to Space Mode"}
        >
            {theme === 'space' ? <Sun size={20} className="text-yellow-300" /> : <Moon size={20} className="text-white" />}
        </button>
    );
}
