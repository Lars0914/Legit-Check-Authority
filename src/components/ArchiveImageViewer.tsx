import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  LayoutChangeEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { resolveArchiveImageUrl } from "../lib/imageUrl";
import { theme } from "../theme";
import type { ArchiveImage as ArchiveImageType } from "../types/api";
import { ZoomableImageView } from "./ZoomableImageView";

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
  const [viewerSize, setViewerSize] = useState({ w: 640, h: 480 });
  const hasMultiple = images.length > 1;

  const handleViewerLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if (width <= 0 || height <= 0) return;
    setViewerSize({
      w: Math.round(width * 0.94),
      h: Math.round(height * 0.82),
    });
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

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.brand}>{brandName}</Text>
          <Text style={styles.model} numberOfLines={2}>
            {modelName}
          </Text>
        </View>
        {hasMultiple ? (
          <Text style={styles.counter}>
            {index + 1} / {images.length}
          </Text>
        ) : null}
      </View>

      <View style={styles.viewerFrame} onLayout={handleViewerLayout}>
        <ZoomableImageView
          uri={fullUri}
          resetKey={current.storagePath}
          baseWidth={viewerSize.w}
          baseHeight={viewerSize.h}
          controlsTheme="light"
        />
      </View>

      {hasMultiple ? (
        <View style={styles.footer}>
          <View style={styles.navRow}>
            <Pressable
              style={({ pressed }) => [
                styles.navBtn,
                index <= 0 && styles.navBtnDisabled,
                pressed && index > 0 && styles.navBtnPressed,
              ]}
              onPress={goPrevious}
              disabled={index <= 0}>
              <Text
                style={[
                  styles.navBtnText,
                  index <= 0 && styles.navBtnTextDisabled,
                ]}>
                ‹ Previous
              </Text>
            </Pressable>

            <Text style={styles.navCounter}>
              Photo {index + 1} of {images.length}
            </Text>

            <Pressable
              style={({ pressed }) => [
                styles.navBtn,
                index >= images.length - 1 && styles.navBtnDisabled,
                pressed && index < images.length - 1 && styles.navBtnPressed,
              ]}
              onPress={goNext}
              disabled={index >= images.length - 1}>
              <Text
                style={[
                  styles.navBtnText,
                  index >= images.length - 1 && styles.navBtnTextDisabled,
                ]}>
                Next ›
              </Text>
            </Pressable>
          </View>

          <Text style={styles.thumbLabel}>All photos — tap to jump</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator
            contentContainerStyle={styles.thumbRow}>
            {images.map((image, i) => {
              const thumbUri = resolveArchiveImageUrl(image.url, "thumb");
              const active = i === index;
              return (
                <Pressable
                  key={image.storagePath}
                  onPress={() => onIndexChange(i)}
                  style={[styles.thumbWrap, active && styles.thumbWrapActive]}>
                  <Image source={{ uri: thumbUri }} style={styles.thumb} />
                  <Text style={[styles.thumbIndex, active && styles.thumbIndexActive]}>
                    {i + 1}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    padding: theme.spacing.lg,
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
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: theme.spacing.md,
  },
  headerText: { flex: 1, paddingRight: 12 },
  brand: {
    ...theme.font.label,
    color: theme.colors.accentGold,
    marginBottom: 6,
  },
  model: {
    fontSize: 22,
    fontWeight: "700",
    color: theme.colors.text,
    lineHeight: 28,
  },
  counter: {
    fontSize: 13,
    fontWeight: "700",
    color: theme.colors.textMuted,
    marginTop: 4,
  },
  viewerFrame: {
    flex: 1,
    minHeight: 240,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.imageBg,
    overflow: "hidden",
  },
  footer: {
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: theme.spacing.md,
  },
  navBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    minWidth: 110,
    alignItems: "center",
  },
  navBtnPressed: { opacity: 0.85 },
  navBtnDisabled: {
    opacity: 0.45,
  },
  navBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.colors.accentGold,
  },
  navBtnTextDisabled: {
    color: theme.colors.textMuted,
  },
  navCounter: {
    flex: 1,
    textAlign: "center",
    fontSize: 13,
    fontWeight: "600",
    color: theme.colors.textSecondary,
  },
  thumbLabel: {
    ...theme.font.label,
    color: theme.colors.textMuted,
    marginBottom: 8,
  },
  thumbRow: {
    gap: 10,
    paddingBottom: 4,
  },
  thumbWrap: {
    width: 80,
    height: 80,
    borderRadius: theme.radius.sm,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "transparent",
    backgroundColor: theme.colors.imageBg,
  },
  thumbWrapActive: {
    borderColor: theme.colors.accentGold,
  },
  thumb: {
    width: "100%",
    height: "100%",
  },
  thumbIndex: {
    position: "absolute",
    bottom: 4,
    right: 4,
    fontSize: 10,
    fontWeight: "800",
    color: "#FFFFFF",
    backgroundColor: "rgba(15, 23, 42, 0.65)",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: "hidden",
  },
  thumbIndexActive: {
    backgroundColor: theme.colors.accentGold,
  },
});
