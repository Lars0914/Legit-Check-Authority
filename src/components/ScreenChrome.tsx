import React from "react";
import {
  Platform,
  StatusBar,
  StyleSheet,
  View,
  type ViewStyle,
} from "react-native";
import { theme } from "../theme";

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function ScreenChrome({ children, style }: Props) {
  const topInset =
    Platform.OS === "android" ? (StatusBar.currentHeight ?? 24) + 8 : 12;

  return (
    <View style={[styles.root, style]}>
      <View style={styles.glowTop} />
      <View style={styles.glowOrb} />
      <View style={[styles.content, { paddingTop: topInset }]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  glowTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 220,
    backgroundColor: theme.colors.bgGlow,
    opacity: 1,
  },
  glowOrb: {
    position: "absolute",
    top: -80,
    right: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: theme.colors.accent,
    opacity: 0.08,
  },
  content: {
    flex: 1,
  },
});
