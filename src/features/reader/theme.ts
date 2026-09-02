import type { ReaderFontFamily, ReaderTheme } from "./types";

export const readerThemes: Record<
  ReaderTheme,
  {
    name: string;
    outer: string;
    surface: string;
    shadow: string;
    text: string;
    muted: string;
    controlBg: string;
    controlText: string;
    accent: string;
  }
> = {
  light: {
    name: "Paper",
    outer: "#d9c7a0",
    surface: "#f7f0e3",
    shadow: "rgba(80,60,20,0.28)",
    text: "#2c1a0a",
    muted: "#836b4d",
    controlBg: "rgba(44,26,10,0.88)",
    controlText: "#f7f0e3",
    accent: "#d79a3d",
  },
  sepia: {
    name: "Sepia",
    outer: "#b9985b",
    surface: "#e6d3a6",
    shadow: "rgba(60,40,10,0.35)",
    text: "#4a2a06",
    muted: "#75552d",
    controlBg: "rgba(74,42,6,0.9)",
    controlText: "#f0e1b8",
    accent: "#bf7d2d",
  },
  dark: {
    name: "Night",
    outer: "#0d0a06",
    surface: "#1a1611",
    shadow: "rgba(0,0,0,0.6)",
    text: "#e8e0cc",
    muted: "#9d927d",
    controlBg: "rgba(18,15,10,0.92)",
    controlText: "#e8e0cc",
    accent: "#d5a75f",
  },
};

export const readerFontFamilies: Record<
  ReaderFontFamily,
  { css: string; label: string }
> = {
  lora: { css: "'Lora', Georgia, serif", label: "Lora" },
  fraunces: { css: "'Fraunces', Georgia, serif", label: "Fraunces" },
  nunito: { css: "'Nunito', system-ui, sans-serif", label: "Nunito" },
};

export const readerFontSizeMap = {
  small: { label: "Small", px: 15 },
  medium: { label: "Medium", px: 17 },
  large: { label: "Large", px: 19 },
  xlarge: { label: "XL", px: 21 },
} as const;
