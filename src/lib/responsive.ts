import { useWindowDimensions } from "react-native";

/** Tablet / desktop split — mobile layout below this width. */
export const TABLET_BREAKPOINT = 768;

export function useResponsiveLayout() {
  const { width, height } = useWindowDimensions();
  const isWide = width >= TABLET_BREAKPOINT;

  return {
    width,
    height,
    isWide,
    sidebarWidth: isWide ? Math.min(360, Math.round(width * 0.3)) : width,
  };
}
