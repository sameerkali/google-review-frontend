import type { PartialTheme as NivoTheme } from "@nivo/theming";

type Mode = "light" | "dark";

const INK = { light: "#18181b", dark: "#fafafa" };
const SECONDARY = { light: "#3f3f46", dark: "#d4d4d8" };
const MUTED = { light: "#71717a", dark: "#a1a1aa" };
const GRID = { light: "#e4e4e7", dark: "#27272a" };
const SURFACE = { light: "#ffffff", dark: "#18181b" };
const BORDER = { light: "#e4e4e7", dark: "#3f3f46" };

/* Same four categorical hex values already in globals.css (--chart-series-*)
   - duplicated here as plain strings because Nivo's `colors` prop needs
   static JS values, not CSS custom properties, since it paints via inline
   SVG attributes rather than stylesheet rules. Validated against this
   app's actual card surfaces via the dataviz skill's palette validator. */
const CATEGORICAL = {
  light: ["#2a78d6", "#eb6834", "#1baf7a", "#eda100"],
  dark: ["#3987e5", "#d95926", "#199e70", "#c98500"],
};

/* Sequential/ordinal ramp - mode-invariant per the palette spec (one ramp,
   not a light/dark pair), light→dark steps for ordered stages (funnel). */
export const SEQUENTIAL_ORDINAL = ["#6da7ec", "#2a78d6", "#184f95"];

export function getCategoricalColors(mode: Mode): string[] {
  return CATEGORICAL[mode];
}

export function getNivoTheme(mode: Mode): NivoTheme {
  return {
    background: "transparent",
    text: { fontSize: 12, fill: SECONDARY[mode] },
    axis: {
      domain: { line: { stroke: GRID[mode], strokeWidth: 1 } },
      ticks: { line: { stroke: GRID[mode], strokeWidth: 1 }, text: { fill: MUTED[mode], fontSize: 11 } },
      legend: { text: { fill: SECONDARY[mode], fontSize: 12 } },
    },
    grid: { line: { stroke: GRID[mode], strokeWidth: 1 } },
    legends: { text: { fill: SECONDARY[mode], fontSize: 12 } },
    labels: { text: { fill: INK[mode], fontSize: 12, fontWeight: 600 } },
    dots: { text: { fill: SECONDARY[mode], fontSize: 11 } },
    tooltip: {
      container: {
        background: SURFACE[mode],
        color: INK[mode],
        fontSize: 12,
        borderRadius: 10,
        border: `1px solid ${BORDER[mode]}`,
        boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
        padding: "8px 12px",
      },
    },
    crosshair: { line: { stroke: MUTED[mode], strokeWidth: 1, strokeOpacity: 0.5 } },
    annotations: { text: { fill: INK[mode], fontSize: 12 }, link: { stroke: MUTED[mode] }, outline: { stroke: SURFACE[mode] }, symbol: { fill: MUTED[mode] } },
  };
}
