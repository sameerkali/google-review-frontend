"use client";

import { useTheme } from "@/components/ThemeProvider";
import { SunIcon, MoonIcon } from "@/components/icons";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      className={`rounded-lg p-2 text-fg-tertiary hover:text-fg hover:bg-surface-inset transition-colors duration-150 cursor-pointer ${className}`}
    >
      {theme === "dark" ? <SunIcon className="w-4 h-4" /> : <MoonIcon className="w-4 h-4" />}
    </button>
  );
}
