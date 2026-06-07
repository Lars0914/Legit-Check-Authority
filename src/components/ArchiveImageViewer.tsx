import React, { useMemo, useState } from "react";
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

  const handleViewerLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if (width <= 0 || height <= 0) return;
    setViewerSize({
      w: Math.round(width * 0.94),
      h: Math.round(height * 0.8),
    });
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
        <Text style={styles.counter}>
          {index + 1} / {images.length}
        </Text>
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

      {images.length > 1 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
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
              </Pressable>
            );
          })}
        </ScrollView>
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
    minHeight: 320,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.imageBg,
    overflow: "hidden",
  },
  thumbRow: {
    gap: 10,
    paddingTop: theme.spacing.md,
    paddingBottom: 4,
  },
  thumbWrap: {
    width: 72,
    height: 72,
    borderRadius: theme.radius.sm,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "transparent",
  },
  thumbWrapActive: {
    borderColor: theme.colors.accentGold,
  },
  thumb: {
    width: "100%",
    height: "100%",
  },
});
