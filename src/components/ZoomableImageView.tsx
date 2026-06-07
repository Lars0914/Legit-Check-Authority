import React, { useEffect } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useZoomableImage } from "../hooks/useZoomableImage";
import { theme } from "../theme";

interface Props {
  uri: string;
  /** Reset zoom when the image changes. */
  resetKey?: string;
  showControls?: boolean;
  controlsTheme?: "light" | "dark";
  baseWidth: number;
  baseHeight: number;
}

export function ZoomableImageView({
  uri,
  resetKey,
  showControls = true,
  controlsTheme = "dark",
  baseWidth,
  baseHeight,
}: Props) {
  const zoom = useZoomableImage(baseWidth, baseHeight);
  const isDark = controlsTheme === "dark";

  useEffect(() => {
    zoom.resetZoom();
  }, [resetKey, uri, zoom.resetZoom]);

  return (
    <View style={styles.wrap}>
      <View
        style={styles.viewport}
        onLayout={zoom.handleViewportLayout}
        {...zoom.panHandlers}>
        <View
          style={[
            styles.stage,
            { width: zoom.viewport.w, height: zoom.viewport.h },
          ]}>
          <View
            style={{
              width: zoom.baseW,
              height: zoom.baseH,
              transform: [
                { translateX: zoom.offset.x },
                { translateY: zoom.offset.y },
                { scale: zoom.zoomLevel },
              ],
            }}>
            <Image
              source={{ uri }}
              style={{ width: zoom.baseW, height: zoom.baseH }}
              resizeMode="contain"
            />
          </View>
        </View>
      </View>

      {showControls ? (
        <View style={styles.controls}>
          <View style={styles.zoomRow}>
            <Pressable
              style={[styles.zoomBtn, isDark && styles.zoomBtnDark]}
              onPress={() => zoom.adjustZoom(-zoom.zoomStep)}
              disabled={zoom.zoomLevel <= zoom.minZoom}>
              <Text style={[styles.zoomBtnText, isDark && styles.zoomBtnTextDark]}>
                −
              </Text>
            </Pressable>
            <Text style={[styles.zoomLevel, isDark && styles.zoomBtnTextDark]}>
              {Math.round(zoom.zoomLevel * 100)}%
            </Text>
            <Pressable
              style={[styles.zoomBtn, isDark && styles.zoomBtnDark]}
              onPress={() => zoom.adjustZoom(zoom.zoomStep)}
              disabled={zoom.zoomLevel >= zoom.maxZoom}>
              <Text style={[styles.zoomBtnText, isDark && styles.zoomBtnTextDark]}>
                +
              </Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  viewport: {
    flex: 1,
    overflow: "hidden",
  },
  stage: {
    justifyContent: "center",
    alignItems: "center",
  },
  controls: {
    alignItems: "center",
    paddingVertical: 12,
  },
  zoomRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  zoomBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.pillBg,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  zoomBtnDark: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderColor: "rgba(255,255,255,0.15)",
  },
  zoomBtnText: {
    color: theme.colors.text,
    fontSize: 22,
    fontWeight: "600",
    lineHeight: 24,
  },
  zoomBtnTextDark: {
    color: "#F8FAFC",
  },
  zoomLevel: {
    fontSize: 14,
    fontWeight: "600",
    minWidth: 48,
    textAlign: "center",
    color: theme.colors.text,
  },
});
