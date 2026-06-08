import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  LayoutChangeEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  type TextLayoutEvent,
  useWindowDimensions,
  View,
} from "react-native";
import { CachedImage } from "./CachedImage";
import { useZoomableImage } from "../hooks/useZoomableImage";
import { formatArchiveDescription } from "../lib/archiveDescription";
import { prefetchNeighborArchiveFull } from "../lib/imagePrefetch";
import { resolveArchiveImageUrl } from "../lib/imageUrl";
import { theme } from "../theme";
import type { ArchiveImage as ArchiveImageType } from "../types/api";

const MAX_INSIGHT_HEIGHT_RATIO = 0.25;
const INSIGHT_PADDING_VERTICAL = 16;
const INSIGHT_LINE_HEIGHT = 15;

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
  const { height: screenHeight, width: screenWidth } = useWindowDimensions();
  const maxInsightHeight = Math.round(screenHeight * MAX_INSIGHT_HEIGHT_RATIO);
  const sideNavInset = screenWidth >= 1024 ? 24 : screenWidth >= 768 ? 16 : 12;
  const [textHeight, setTextHeight] = useState<number | null>(null);

  const current = images[index];
  const fullUri = current
    ? resolveArchiveImageUrl(current.url, "full")
    : "";
  const [frameSize, setFrameSize] = useState({ w: 1, h: 1 });
  const [imageLoading, setImageLoading] = useState(true);
  const zoom = useZoomableImage(frameSize.w, frameSize.h);

  useEffect(() => {
    zoom.resetZoom();
    setImageLoading(true);
  }, [current?.storagePath, zoom.resetZoom]);

  useEffect(() => {
    if (images.length === 0) return;
    prefetchNeighborArchiveFull(
      images.map((image) => image.url),
      index,
    );
  }, [images, index]);

  useEffect(() => {
    setTextHeight(null);
  }, [current?.storagePath, current?.description]);

  const insightMeasured = textHeight !== null && textHeight > 0;
  const contentWithPadding = insightMeasured
    ? textHeight + INSIGHT_PADDING_VERTICAL
    : 0;
  const insightMinHeight = INSIGHT_LINE_HEIGHT + INSIGHT_PADDING_VERTICAL;
  const insightBoxHeight = current?.description
    ? Math.min(Math.max(contentWithPadding, insightMinHeight), maxInsightHeight)
    : 0;
  const insightScrollable =
    insightMeasured && contentWithPadding > maxInsightHeight;

  const handleInsightTextLayout = (event: TextLayoutEvent) => {
    const lines = event.nativeEvent.lines;
    if (lines.length === 0) return;
    const measured = Math.ceil(
      lines.reduce((sum, line) => sum + line.height, 0),
    );
    if (measured > 0) {
      setTextHeight((prev) => Math.max(prev ?? 0, measured));
    }
  };

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
      <View style={styles.imageSection}>
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
                <CachedImage
                  uri={fullUri}
                  style={{ width: zoom.baseW, height: zoom.baseH }}
                  resizeMode="contain"
                  priority="high"
                  onLoadEnd={() => setImageLoading(false)}
                  onError={() => setImageLoading(false)}
                />
              </View>
              {imageLoading ? (
                <ActivityIndicator
                  style={styles.imageLoader}
                  color={theme.colors.accentGold}
                />
              ) : null}
            </View>
          </View>

          {images.length > 1 ? (
            <>
              <View style={[styles.sideNavSlot, { left: sideNavInset }]}>
                <Pressable
                  style={({ pressed }) => [
                    styles.sideNavBtn,
                    !canGoPrevious && styles.sideNavBtnDisabled,
                    pressed && canGoPrevious && styles.sideNavBtnPressed,
                  ]}
                  onPress={goPrevious}
                  disabled={!canGoPrevious}
                  accessibilityLabel="Previous image"
                  accessibilityRole="button">
                  <Text
                    style={[
                      styles.sideNavBtnText,
                      !canGoPrevious && styles.sideNavBtnTextDisabled,
                    ]}>
                    {"<"}
                  </Text>
                </Pressable>
              </View>

              <View style={[styles.sideNavSlot, { right: sideNavInset }]}>
                <Pressable
                  style={({ pressed }) => [
                    styles.sideNavBtn,
                    !canGoNext && styles.sideNavBtnDisabled,
                    pressed && canGoNext && styles.sideNavBtnPressed,
                  ]}
                  onPress={goNext}
                  disabled={!canGoNext}
                  accessibilityLabel="Next image"
                  accessibilityRole="button">
                  <Text
                    style={[
                      styles.sideNavBtnText,
                      !canGoNext && styles.sideNavBtnTextDisabled,
                    ]}>
                    {">"}
                  </Text>
                </Pressable>
              </View>
            </>
          ) : null}
        </View>
      </View>

      {current.description ? (
        <>
          {!insightMeasured ? (
            <View style={styles.insightMeasure} pointerEvents="none">
              <Text
                style={styles.insightText}
                onTextLayout={handleInsightTextLayout}>
                {current.description}
              </Text>
            </View>
          ) : null}
          <ScrollView
            style={[
              styles.insightScroll,
              insightMeasured
                ? { height: insightBoxHeight }
                : { maxHeight: maxInsightHeight },
            ]}
            contentContainerStyle={styles.insightScrollContent}
            showsVerticalScrollIndicator={insightScrollable}
            scrollEnabled={insightScrollable}
            nestedScrollEnabled>
            <Text style={styles.insightText}>
              {formatArchiveDescription(current.description) ?? ""}
            </Text>
          </ScrollView>
        </>
      ) : null}
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
  imageSection: {
    flex: 1,
    paddingHorizontal: theme.spacing.sm,
  },
  captionBar: {
    paddingHorizontal: theme.spacing.xs,
    paddingTop: theme.spacing.xs,
    paddingBottom: 4,
  },
  captionBrand: {
    ...theme.font.label,
    color: theme.colors.accentGold,
    marginBottom: 2,
    fontSize: 9,
  },
  captionModel: {
    fontSize: 13,
    fontWeight: "700",
    color: theme.colors.text,
  },
  viewerFrame: {
    flex: 1,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.imageBg,
    overflow: "hidden",
    position: "relative",
  },
  viewport: {
    flex: 1,
    overflow: "hidden",
  },
  sideNavSlot: {
    position: "absolute",
    top: 0,
    bottom: 0,
    justifyContent: "center",
    zIndex: 2,
  },
  sideNavBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0F172A",
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  sideNavBtnPressed: { transform: [{ scale: 0.96 }] },
  sideNavBtnDisabled: {},
  sideNavBtnText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000000",
    lineHeight: 22,
    marginTop: -1,
  },
  sideNavBtnTextDisabled: {
    color: theme.colors.textMuted,
  },
  stage: {
    justifyContent: "center",
    alignItems: "center",
  },
  imageLoader: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  insightMeasure: {
    position: "absolute",
    opacity: 0,
    left: theme.spacing.sm,
    right: theme.spacing.sm,
    paddingHorizontal: 12,
    zIndex: -1,
  },
  insightScroll: {
    flexGrow: 0,
    flexShrink: 0,
    marginHorizontal: theme.spacing.sm,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.borderBright,
    overflow: "hidden",
  },
  insightScrollContent: {
    flexGrow: 0,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  insightText: {
    fontSize: 11,
    lineHeight: 15,
    color: theme.colors.text,
    fontWeight: "400",
  },
});
