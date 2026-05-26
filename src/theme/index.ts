/** Light theme — refined Web3 / luxury watch authentication */
export const theme = {
  colors: {
    bg: "#F5F7FC",
    bgGlow: "#EEF2FF",
    surface: "#FFFFFF",
    surfaceHover: "#F8FAFC",
    glass: "rgba(255, 255, 255, 0.96)",
    border: "rgba(124, 58, 237, 0.18)",
    borderBright: "rgba(8, 145, 178, 0.35)",

    text: "#0F172A",
    textSecondary: "#475569",
    textMuted: "#94A3B8",

    accent: "#7C3AED",
    accentCyan: "#0891B2",
    accentGold: "#B45309",
    gradientStart: "#EEF2FF",
    gradientEnd: "#F5F7FC",

    genuine: "#059669",
    genuineDim: "rgba(5, 150, 105, 0.08)",
    genuineBorder: "rgba(5, 150, 105, 0.35)",

    fake: "#DB2777",
    fakeDim: "rgba(219, 39, 119, 0.08)",
    fakeBorder: "rgba(219, 39, 119, 0.35)",

    error: "#DC2626",
    errorBg: "rgba(220, 38, 38, 0.08)",
    warning: "#D97706",
    warningBg: "rgba(217, 119, 6, 0.1)",

    imageBg: "#E8ECF4",
    pillBg: "rgba(15, 23, 42, 0.04)",
  },
  radius: { sm: 10, md: 14, lg: 18, xl: 24 },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
  font: {
    hero: { fontSize: 28, fontWeight: "800" as const, letterSpacing: 0.5 },
    title: { fontSize: 18, fontWeight: "700" as const },
    body: { fontSize: 14, lineHeight: 22 },
    caption: { fontSize: 11, letterSpacing: 0.8 },
    label: {
      fontSize: 11,
      fontWeight: "800" as const,
      letterSpacing: 1.2,
      textTransform: "uppercase" as const,
    },
  },
};
