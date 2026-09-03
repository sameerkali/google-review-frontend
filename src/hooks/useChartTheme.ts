"use client";

import { useTheme } from "@/components/ThemeProvider";
import { getCategoricalColors, getNivoTheme } from "@/lib/nivoTheme";

/** The handful of lines every chart component repeated: current theme, its
    categorical color set, and nivo's own theme object built from it. `theme`
    itself is still exposed for the charts that branch on it directly (e.g.
    a light/dark point-fill color nivo's theme prop doesn't cover). */
export function useChartTheme() {
  const { theme } = useTheme();
  return { theme, colors: getCategoricalColors(theme), nivoTheme: getNivoTheme(theme) };
}
