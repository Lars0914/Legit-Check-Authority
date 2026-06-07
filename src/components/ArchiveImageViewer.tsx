import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useZoomableImage } from "../hooks/useZoomableImage";
import { resolveArchiveImageUrl } from "../lib/imageUrl";
import { theme } from "../theme";
import type { ArchiveImage as ArchiveImageType } from "../types/api";

interface Props {
  brandName: string;
  modelName: string;
  images: ArchiveImageType[];
  index: number;
  loading?: boolean;
  onIndexChange: (index: number) => void;
}

export function ArchiveImageViewer({
  brandName,
  modelName,
  images,
  index,
  loading = false,
  onIndexChange,
}: Props) {
  const current = images[index];
  const fullUri = current
    ? resolveArchiveImageUrl(current.url, "full")
    : "";
  const [frameSize, setFrameSize] = useState({ w: 1, h: 1 });
  const zoom = useZoomableImage(frameSize.w, frameSize.h);

  useEffect(() => {
    zoom.resetZoom();
  }, [current?.storagePath, zoom.resetZoom]);

  const handleFrameLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if (width <= 0 || height <= 0) return;
    setFrameSize({ w: Math.round(width), h: Math.round(height) });
  };

  const goPrevious = () => {
    if (index > 0) onIndexChange(index - 1);
  };

  const goNext = () => {
    if (index < images.length - 1) onIndexChange(index + 1);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.accentGold} />
        <Text style={styles.loadingText}>Loading reference photos…</Text>
      </View>
    );
  }

  if (!current) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyTitle}>Select a watch model</Text>
        <Text style={styles.emptyBody}>
          Choose a brand and model from the sidebar to view reference photos here.
        </Text>
      </View>
    );
  }

  const canGoPrevious = index > 0;
  const canGoNext = index < images.length - 1;

  return (
    <View style={styles.wrap}>
      <View style={styles.captionBar}>
        <Text style={styles.captionBrand} numberOfLines={1}>
          {brandName}
        </Text>
        <Text style={styles.captionModel} numberOfLines={1}>
          {modelName}
        </Text>
      </View>

      <View style={styles.viewerFrame} onLayout={handleFrameLayout}>
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
                source={{ uri: fullUri }}
                style={{ width: zoom.baseW, height: zoom.baseH }}
                resizeMode="contain"
              />
            </View>
          </View>
        </View>
      </View>

      <View style={styles.toolbar}>
        <Pressable
          style={({ pressed }) => [
            styles.toolbarBtn,
            styles.toolbarBtnWide,
            !canGoPrevious && styles.toolbarBtnDisabled,
            pressed && canGoPrevious && styles.toolbarBtnPressed,
          ]}
          onPress={goPrevious}
          disabled={!canGoPrevious}>
          <Text
            style={[
              styles.toolbarBtnText,
              !canGoPrevious && styles.toolbarBtnTextDisabled,
            ]}>
            Previous
          </Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.toolbarBtn,
            zoom.zoomLevel <= zoom.minZoom && styles.toolbarBtnDisabled,
            pressed && styles.toolbarBtnPressed,
          ]}
          onPress={() => zoom.adjustZoom(-zoom.zoomStep)}
          disabled={zoom.zoomLevel <= zoom.minZoom}>
          <Text style={styles.toolbarBtnSymbol}>−</Text>
        </Pressable>

        <Text style={styles.toolbarCounter}>
          {index + 1} / {images.length}
        </Text>

        <Pressable
          style={({ pressed }) => [
            styles.toolbarBtn,
            zoom.zoomLevel >= zoom.maxZoom && styles.toolbarBtnDisabled,
            pressed && styles.toolbarBtnPressed,
          ]}
          onPress={() => zoom.adjustZoom(zoom.zoomStep)}
          disabled={zoom.zoomLevel >= zoom.maxZoom}>
          <Text style={styles.toolbarBtnSymbol}>+</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.toolbarBtn,
            styles.toolbarBtnWide,
            !canGoNext && styles.toolbarBtnDisabled,
            pressed && canGoNext && styles.toolbarBtnPressed,
          ]}
          onPress={goNext}
          disabled={!canGoNext}>
          <Text
            style={[
              styles.toolbarBtnText,
              !canGoNext && styles.toolbarBtnTextDisabled,
            ]}>
            Next
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: theme.spacing.xl,
  },
  loadingText: {
    marginTop: 12,
    color: theme.colors.textSecondary,
    fontSize: 14,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: theme.colors.text,
    marginBottom: 8,
  },
  emptyBody: {
    fontSize: 15,
    color: theme.colors.textMuted,
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 360,
  },
  captionBar: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.xs,
  },
  captionBrand: {
    ...theme.font.label,
    color: theme.colors.accentGold,
    marginBottom: 2,
  },
  captionModel: {
    fontSize: 15,
    fontWeight: "700",
    color: theme.colors.text,
  },
  viewerFrame: {
    flex: 1,
    marginHorizontal: theme.spacing.sm,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.imageBg,
    overflow: "hidden",
  },
  viewport: {
    flex: 1,
    overflow: "hidden",
  },
  stage: {
    justifyContent: "center",
    alignItems: "center",
  },
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  toolbarBtn: {
    minWidth: 44,
    height: 44,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.bg,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  toolbarBtnWide: {
    minWidth: 96,
    paddingHorizontal: 16,
  },
  toolbarBtnPressed: { opacity: 0.85 },
  toolbarBtnDisabled: { opacity: 0.4 },
  toolbarBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.colors.text,
  },
  toolbarBtnTextDisabled: {
    color: theme.colors.textMuted,
  },
  toolbarBtnSymbol: {
    fontSize: 22,
    fontWeight: "600",
    color: theme.colors.text,
    lineHeight: 24,
  },
  toolbarCounter: {
    minWidth: 72,
    textAlign: "center",
    fontSize: 15,
    fontWeight: "700",
    color: theme.colors.text,
  },
});
